import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
async function getAuthenticatedUserId(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
        throw new Error("Authentication required. Please sign in.");
    }
    return identity.subject;
}
export const getEarningsSummary = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx);
        const books = await ctx.db
            .query("books")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const publishedBooks = books.filter((b) => b.status === "published");
        const salesRecords = await ctx.db
            .query("salesRecords")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const payouts = await ctx.db
            .query("payouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        let totalEarnings = 0;
        let totalUnitsSold = 0;
        let lifetimeRevenue = 0;
        const monthlyData = {};
        const bookEarnings = {};
        for (const record of salesRecords) {
            totalEarnings += record.royaltyAmount;
            totalUnitsSold += record.unitsSold;
            lifetimeRevenue += record.grossRevenue;
            if (!monthlyData[record.period]) {
                monthlyData[record.period] = { revenue: 0, royalties: 0, units: 0 };
            }
            monthlyData[record.period].revenue += record.grossRevenue;
            monthlyData[record.period].royalties += record.royaltyAmount;
            monthlyData[record.period].units += record.unitsSold;
            const bookIdStr = record.bookId;
            if (!bookEarnings[bookIdStr]) {
                const book = books.find((b) => b._id === bookIdStr);
                bookEarnings[bookIdStr] = {
                    title: book?.title || "Unknown",
                    units: 0,
                    revenue: 0,
                    royalties: 0,
                };
            }
            bookEarnings[bookIdStr].units += record.unitsSold;
            bookEarnings[bookIdStr].revenue += record.grossRevenue;
            bookEarnings[bookIdStr].royalties += record.royaltyAmount;
        }
        const totalPaidOut = payouts
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
        const pendingPayouts = payouts
            .filter((p) => p.status === "pending" || p.status === "processing")
            .reduce((sum, p) => sum + p.amount, 0);
        const availableBalance = totalEarnings - totalPaidOut - pendingPayouts;
        const monthlyBreakdown = Object.entries(monthlyData)
            .map(([period, data]) => ({ period, ...data }))
            .sort((a, b) => b.period.localeCompare(a.period));
        const perBookEarnings = Object.entries(bookEarnings)
            .map(([bookId, data]) => ({ bookId, ...data }))
            .sort((a, b) => b.royalties - a.royalties);
        return {
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalUnitsSold,
            lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
            availableBalance: Math.round(availableBalance * 100) / 100,
            totalPaidOut: Math.round(totalPaidOut * 100) / 100,
            pendingPayouts: Math.round(pendingPayouts * 100) / 100,
            publishedBooksCount: publishedBooks.length,
            monthlyBreakdown,
            perBookEarnings,
        };
    },
});
export const getPayoutHistory = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx);
        const payouts = await ctx.db
            .query("payouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
        return payouts;
    },
});
export const getPayoutAccounts = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx);
        const accounts = await ctx.db
            .query("payoutAccounts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        return accounts;
    },
});
export const requestPayout = mutation({
    args: {
        userId: v.optional(v.string()),
        amount: v.number(),
        method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
        periodStart: v.string(),
        periodEnd: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx);
        if (args.amount < 25) {
            throw new Error("Minimum payout amount is $25.00");
        }
        const accounts = await ctx.db
            .query("payoutAccounts")
            .withIndex("by_user_method", (q) => q.eq("userId", userId).eq("method", args.method))
            .collect();
        if (accounts.length === 0) {
            throw new Error("No payout account configured for this method. Please set up your payout account first.");
        }
        const pendingPayouts = await ctx.db
            .query("payouts")
            .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "pending"))
            .collect();
        if (pendingPayouts.length > 0) {
            throw new Error("You already have a pending payout request. Please wait for it to be processed.");
        }
        const salesRecords = await ctx.db
            .query("salesRecords")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const completedPayouts = await ctx.db
            .query("payouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const totalEarned = salesRecords.reduce((sum, r) => sum + r.royaltyAmount, 0);
        const totalPaid = completedPayouts
            .filter((p) => p.status === "completed" || p.status === "processing" || p.status === "pending")
            .reduce((sum, p) => sum + p.amount, 0);
        const available = totalEarned - totalPaid;
        if (args.amount > available) {
            throw new Error(`Insufficient balance. Available: $${available.toFixed(2)}`);
        }
        const bookBreakdown = [];
        const bookMap = new Map();
        for (const record of salesRecords) {
            const key = record.bookId;
            const existing = bookMap.get(key) || { title: "", royalties: 0, units: 0 };
            existing.royalties += record.royaltyAmount;
            existing.units += record.unitsSold;
            bookMap.set(key, existing);
        }
        const books = await ctx.db
            .query("books")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        for (const [bookId, data] of bookMap) {
            const book = books.find((b) => b._id === bookId);
            if (data.royalties > 0) {
                const proportion = data.royalties / totalEarned;
                bookBreakdown.push({
                    bookId,
                    bookTitle: book?.title || "Unknown",
                    amount: Math.round(args.amount * proportion * 100) / 100,
                    unitsSold: data.units,
                });
            }
        }
        const now = Date.now();
        const payoutId = await ctx.db.insert("payouts", {
            userId,
            amount: args.amount,
            currency: "USD",
            status: "pending",
            method: args.method,
            periodStart: args.periodStart,
            periodEnd: args.periodEnd,
            bookBreakdown,
            createdAt: now,
            updatedAt: now,
        });
        return payoutId;
    },
});
export const savePayoutAccount = mutation({
    args: {
        userId: v.optional(v.string()),
        method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
        stripeConnectAccountId: v.optional(v.string()),
        payoneerAccountEmail: v.optional(v.string()),
        payoneerPayeeId: v.optional(v.string()),
        bankDetails: v.optional(v.object({
            accountHolder: v.string(),
            bankName: v.string(),
            lastFourDigits: v.string(),
            country: v.string(),
        })),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx);
        const existing = await ctx.db
            .query("payoutAccounts")
            .withIndex("by_user_method", (q) => q.eq("userId", userId).eq("method", args.method))
            .first();
        const now = Date.now();
        if (args.isDefault) {
            const allAccounts = await ctx.db
                .query("payoutAccounts")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            for (const acc of allAccounts) {
                if (acc.isDefault) {
                    await ctx.db.patch(acc._id, { isDefault: false, updatedAt: now });
                }
            }
        }
        if (existing) {
            await ctx.db.patch(existing._id, {
                stripeConnectAccountId: args.stripeConnectAccountId,
                payoneerAccountEmail: args.payoneerAccountEmail,
                payoneerPayeeId: args.payoneerPayeeId,
                bankDetails: args.bankDetails,
                isDefault: args.isDefault ?? existing.isDefault,
                updatedAt: now,
            });
            return existing._id;
        }
        const id = await ctx.db.insert("payoutAccounts", {
            userId,
            method: args.method,
            isDefault: args.isDefault ?? true,
            stripeConnectAccountId: args.stripeConnectAccountId,
            stripeOnboardingComplete: !!args.stripeConnectAccountId,
            payoneerAccountEmail: args.payoneerAccountEmail,
            payoneerPayeeId: args.payoneerPayeeId,
            bankDetails: args.bankDetails,
            createdAt: now,
            updatedAt: now,
        });
        return id;
    },
});
export const recordSale = mutation({
    args: {
        bookId: v.id("books"),
        channel: v.string(),
        period: v.string(),
        unitsSold: v.number(),
        grossRevenue: v.number(),
        netRevenue: v.number(),
        royaltyAmount: v.number(),
        currency: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        const id = await ctx.db.insert("salesRecords", {
            bookId: args.bookId,
            userId: book.userId,
            channel: args.channel,
            period: args.period,
            unitsSold: args.unitsSold,
            grossRevenue: args.grossRevenue,
            netRevenue: args.netRevenue,
            royaltyAmount: args.royaltyAmount,
            currency: args.currency || "USD",
            recordedAt: Date.now(),
        });
        await ctx.db.patch(args.bookId, {
            salesCount: (book.salesCount || 0) + args.unitsSold,
            totalEarnings: (book.totalEarnings || 0) + args.royaltyAmount,
            updatedAt: Date.now(),
        });
        return id;
    },
});
