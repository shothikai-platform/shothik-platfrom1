import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
const ADMIN_EMAILS = new Set([
    "demo@shothik.ai",
]);
async function requireAdmin(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
        throw new Error("Admin access denied: authentication required");
    }
    if (identity.email && ADMIN_EMAILS.has(identity.email)) {
        return identity.subject;
    }
    throw new Error("Admin access denied: insufficient privileges");
}
export const listByStatus = query({
    args: {
        status: v.optional(v.union(v.literal("submitted"), v.literal("in_review"), v.literal("approved"), v.literal("rejected"), v.literal("uploading"), v.literal("published"))),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        let books;
        if (args.status) {
            books = await ctx.db
                .query("books")
                .withIndex("by_status", (q) => q.eq("status", args.status))
                .order("desc")
                .collect();
        }
        else {
            books = await ctx.db
                .query("books")
                .withIndex("by_status", (q) => q.eq("status", "submitted"))
                .order("desc")
                .collect();
            const inReview = await ctx.db
                .query("books")
                .withIndex("by_status", (q) => q.eq("status", "in_review"))
                .order("desc")
                .collect();
            const approved = await ctx.db
                .query("books")
                .withIndex("by_status", (q) => q.eq("status", "approved"))
                .order("desc")
                .collect();
            books = [...books, ...inReview, ...approved];
        }
        const booksWithUrls = await Promise.all(books.map(async (book) => {
            let coverUrl = null;
            let manuscriptUrl = null;
            if (book.coverStorageId) {
                coverUrl = await ctx.storage.getUrl(book.coverStorageId);
            }
            if (book.manuscriptStorageId) {
                manuscriptUrl = await ctx.storage.getUrl(book.manuscriptStorageId);
            }
            return { ...book, coverUrl, manuscriptUrl };
        }));
        return booksWithUrls;
    },
});
export const getBookForReview = query({
    args: {
        bookId: v.id("books"),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            return null;
        let manuscriptUrl = null;
        let coverUrl = null;
        if (book.manuscriptStorageId) {
            manuscriptUrl = await ctx.storage.getUrl(book.manuscriptStorageId);
        }
        if (book.coverStorageId) {
            coverUrl = await ctx.storage.getUrl(book.coverStorageId);
        }
        return { ...book, manuscriptUrl, coverUrl };
    },
});
export const startReview = mutation({
    args: {
        bookId: v.id("books"),
        reviewerName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const adminUserId = await requireAdmin(ctx);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.status !== "submitted") {
            throw new Error("Can only start review on submitted books");
        }
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const existingNotifications = book.notifications || [];
        await ctx.db.patch(args.bookId, {
            status: "in_review",
            reviewedBy: args.reviewerName || adminUserId,
            reviewedAt: now,
            timestamps: {
                ...existingTimestamps,
                in_review: now,
            },
            notifications: [
                ...existingNotifications,
                {
                    id: `notif_${Date.now()}`,
                    type: "review_started",
                    message: "Your book is now being reviewed by our team. This typically takes 48-72 hours.",
                    read: false,
                    createdAt: now,
                },
            ],
            updatedAt: Date.now(),
        });
    },
});
export const approveBook = mutation({
    args: {
        bookId: v.id("books"),
        reviewNotes: v.optional(v.string()),
        isbn: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const adminUserId = await requireAdmin(ctx);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.status !== "in_review" && book.status !== "submitted") {
            throw new Error("Can only approve books that are submitted or in review");
        }
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const existingNotifications = book.notifications || [];
        await ctx.db.patch(args.bookId, {
            status: "approved",
            reviewNotes: args.reviewNotes || "",
            reviewedBy: book.reviewedBy || adminUserId,
            reviewedAt: now,
            isbn: args.isbn,
            timestamps: {
                ...existingTimestamps,
                approved: now,
            },
            notifications: [
                ...existingNotifications,
                {
                    id: `notif_${Date.now()}`,
                    type: "approved",
                    message: `Congratulations! Your book "${book.title}" has been approved for publishing. ${args.isbn ? `ISBN: ${args.isbn}` : "An ISBN will be assigned shortly."}`,
                    read: false,
                    createdAt: now,
                },
            ],
            updatedAt: Date.now(),
        });
    },
});
export const rejectBook = mutation({
    args: {
        bookId: v.id("books"),
        rejectionReason: v.string(),
        rejectionCategory: v.union(v.literal("content_quality"), v.literal("formatting"), v.literal("cover_quality"), v.literal("metadata"), v.literal("copyright"), v.literal("policy_violation"), v.literal("other")),
        reviewNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const adminUserId = await requireAdmin(ctx);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.status !== "in_review" && book.status !== "submitted") {
            throw new Error("Can only reject books that are submitted or in review");
        }
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const existingNotifications = book.notifications || [];
        const categoryLabels = {
            content_quality: "Content Quality",
            formatting: "Formatting Issues",
            cover_quality: "Cover Quality",
            metadata: "Metadata Issues",
            copyright: "Copyright Concerns",
            policy_violation: "Policy Violation",
            other: "Other",
        };
        await ctx.db.patch(args.bookId, {
            status: "rejected",
            rejectionReason: args.rejectionReason,
            rejectionCategory: args.rejectionCategory,
            reviewNotes: args.reviewNotes || "",
            reviewedBy: book.reviewedBy || adminUserId,
            reviewedAt: now,
            timestamps: {
                ...existingTimestamps,
                rejected: now,
            },
            notifications: [
                ...existingNotifications,
                {
                    id: `notif_${Date.now()}`,
                    type: "rejected",
                    message: `Your book "${book.title}" needs revisions. Category: ${categoryLabels[args.rejectionCategory] || args.rejectionCategory}. Reason: ${args.rejectionReason}. You can make changes and resubmit.`,
                    read: false,
                    createdAt: now,
                },
            ],
            updatedAt: Date.now(),
        });
    },
});
export const markPublished = mutation({
    args: {
        bookId: v.id("books"),
        googlePlayUrl: v.string(),
        isbn: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.status !== "approved" && book.status !== "uploading") {
            throw new Error("Can only publish books that are approved");
        }
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const existingNotifications = book.notifications || [];
        await ctx.db.patch(args.bookId, {
            status: "published",
            googlePlayUrl: args.googlePlayUrl,
            isbn: args.isbn || book.isbn,
            timestamps: {
                ...existingTimestamps,
                published: now,
            },
            notifications: [
                ...existingNotifications,
                {
                    id: `notif_${Date.now()}`,
                    type: "published",
                    message: `Your book "${book.title}" is now live on Google Play Books! View it here: ${args.googlePlayUrl}`,
                    read: false,
                    createdAt: now,
                },
            ],
            updatedAt: Date.now(),
        });
    },
});
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const submitted = await ctx.db
            .query("books")
            .withIndex("by_status", (q) => q.eq("status", "submitted"))
            .collect();
        const inReview = await ctx.db
            .query("books")
            .withIndex("by_status", (q) => q.eq("status", "in_review"))
            .collect();
        const approved = await ctx.db
            .query("books")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();
        const published = await ctx.db
            .query("books")
            .withIndex("by_status", (q) => q.eq("status", "published"))
            .collect();
        const rejected = await ctx.db
            .query("books")
            .withIndex("by_status", (q) => q.eq("status", "rejected"))
            .collect();
        return {
            submitted: submitted.length,
            inReview: inReview.length,
            approved: approved.length,
            published: published.length,
            rejected: rejected.length,
            total: submitted.length + inReview.length + approved.length + published.length + rejected.length,
        };
    },
});
