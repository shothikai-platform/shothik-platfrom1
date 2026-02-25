import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
async function getAuthenticatedUserId(ctx, passedUserId) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
        return identity.subject;
    }
    if (passedUserId) {
        return passedUserId;
    }
    throw new Error("Authentication required: valid JWT token is needed");
}
export const createDraft = mutation({
    args: {
        userId: v.optional(v.string()),
        title: v.string(),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const now = Date.now();
        const bookId = await ctx.db.insert("books", {
            userId,
            projectId: args.projectId,
            status: "draft",
            title: args.title,
            language: "en",
            currency: "USD",
            listPrice: "9.99",
            keywords: [],
            completedSteps: [],
            currentStep: 0,
            agreementAccepted: false,
            agreementScrolled: false,
            agreementName: "",
            salesCount: 0,
            totalEarnings: 0,
            timestamps: {
                draft: new Date(now).toISOString(),
            },
            createdAt: now,
            updatedAt: now,
        });
        return bookId;
    },
});
export const updateDraft = mutation({
    args: {
        id: v.id("books"),
        userId: v.optional(v.string()),
        title: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        description: v.optional(v.string()),
        language: v.optional(v.string()),
        category: v.optional(v.string()),
        subcategory: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
        listPrice: v.optional(v.string()),
        currency: v.optional(v.string()),
        agreementAccepted: v.optional(v.boolean()),
        agreementName: v.optional(v.string()),
        agreementScrolled: v.optional(v.boolean()),
        currentStep: v.optional(v.number()),
        completedSteps: v.optional(v.array(v.string())),
        manuscriptName: v.optional(v.string()),
        manuscriptSize: v.optional(v.number()),
        manuscriptFormat: v.optional(v.string()),
        coverDimensions: v.optional(v.object({
            width: v.number(),
            height: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const { id, userId: _passedUserId, ...updates } = args;
        const book = await ctx.db.get(id);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        if (book.status !== "draft" && book.status !== "rejected") {
            throw new Error("Can only update books in draft or rejected status");
        }
        const filtered = {};
        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined)
                filtered[key] = val;
        }
        filtered.updatedAt = Date.now();
        await ctx.db.patch(id, filtered);
    },
});
export const saveManuscriptFile = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileSize: v.number(),
        format: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        await ctx.db.patch(args.bookId, {
            manuscriptStorageId: args.storageId,
            manuscriptName: args.fileName,
            manuscriptSize: args.fileSize,
            manuscriptFormat: args.format,
            updatedAt: Date.now(),
        });
    },
});
export const saveCoverFile = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
        storageId: v.id("_storage"),
        dimensions: v.object({
            width: v.number(),
            height: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        await ctx.db.patch(args.bookId, {
            coverStorageId: args.storageId,
            coverDimensions: args.dimensions,
            updatedAt: Date.now(),
        });
    },
});
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});
export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
export const submitForReview = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        if (book.status !== "draft" && book.status !== "rejected") {
            throw new Error("Can only submit books in draft or rejected status");
        }
        if (!book.manuscriptStorageId)
            throw new Error("Manuscript file is required");
        if (!book.title || book.title.trim().length < 3)
            throw new Error("Valid title is required");
        if (!book.description || book.description.trim().length < 50)
            throw new Error("Description must be at least 50 characters");
        if (!book.keywords || book.keywords.length < 3)
            throw new Error("At least 3 keywords are required");
        if (!book.category)
            throw new Error("Category is required");
        if (!book.coverStorageId)
            throw new Error("Cover image is required");
        if (!book.agreementAccepted)
            throw new Error("Agreement must be accepted");
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        await ctx.db.patch(args.bookId, {
            status: "submitted",
            timestamps: {
                ...existingTimestamps,
                submitted: now,
            },
            updatedAt: Date.now(),
        });
    },
});
export const get = query({
    args: { id: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.id);
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
export const listByUser = query({
    args: {
        userId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        let books;
        if (args.status) {
            books = await ctx.db
                .query("books")
                .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", args.status))
                .order("desc")
                .collect();
        }
        else {
            books = await ctx.db
                .query("books")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .order("desc")
                .collect();
        }
        const booksWithUrls = await Promise.all(books.map(async (book) => {
            let coverUrl = null;
            if (book.coverStorageId) {
                coverUrl = await ctx.storage.getUrl(book.coverStorageId);
            }
            return { ...book, coverUrl };
        }));
        return booksWithUrls;
    },
});
export const updateStatus = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
        status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("in_review"), v.literal("approved"), v.literal("rejected"), v.literal("uploading"), v.literal("published")),
        rejectionReason: v.optional(v.string()),
        rejectionCategory: v.optional(v.string()),
        googlePlayUrl: v.optional(v.string()),
        isbn: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const updatedTimestamps = {
            ...existingTimestamps,
            [args.status]: now,
        };
        const patch = {
            status: args.status,
            timestamps: updatedTimestamps,
            updatedAt: Date.now(),
        };
        if (args.rejectionReason)
            patch.rejectionReason = args.rejectionReason;
        if (args.rejectionCategory)
            patch.rejectionCategory = args.rejectionCategory;
        if (args.googlePlayUrl)
            patch.googlePlayUrl = args.googlePlayUrl;
        if (args.isbn)
            patch.isbn = args.isbn;
        await ctx.db.patch(args.bookId, patch);
    },
});
export const resubmitForReview = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        if (book.status !== "rejected") {
            throw new Error("Can only resubmit books that were rejected");
        }
        if (!book.manuscriptStorageId)
            throw new Error("Manuscript file is required");
        if (!book.title || book.title.trim().length < 3)
            throw new Error("Valid title is required");
        if (!book.description || book.description.trim().length < 50)
            throw new Error("Description must be at least 50 characters");
        if (!book.keywords || book.keywords.length < 3)
            throw new Error("At least 3 keywords are required");
        if (!book.category)
            throw new Error("Category is required");
        if (!book.coverStorageId)
            throw new Error("Cover image is required");
        if (!book.agreementAccepted)
            throw new Error("Agreement must be accepted");
        const now = new Date().toISOString();
        const existingTimestamps = book.timestamps || {};
        const existingNotifications = book.notifications || [];
        const previousRejections = book.previousRejections || [];
        const resubmissionCount = (book.resubmissionCount || 0) + 1;
        if (book.rejectionReason && book.rejectionCategory) {
            previousRejections.push({
                reason: book.rejectionReason,
                category: book.rejectionCategory,
                reviewNotes: book.reviewNotes || undefined,
                rejectedAt: book.timestamps?.rejected || now,
                reviewedBy: book.reviewedBy || undefined,
            });
        }
        await ctx.db.patch(args.bookId, {
            status: "submitted",
            rejectionReason: undefined,
            rejectionCategory: undefined,
            reviewNotes: undefined,
            reviewedBy: undefined,
            reviewedAt: undefined,
            resubmissionCount,
            previousRejections,
            timestamps: {
                ...existingTimestamps,
                submitted: now,
            },
            notifications: [
                ...existingNotifications,
                {
                    id: `notif_${Date.now()}`,
                    type: "resubmitted",
                    message: `Your book "${book.title}" has been resubmitted for review (resubmission #${resubmissionCount}). Our team will review the updated version within 48-72 hours.`,
                    read: false,
                    createdAt: now,
                },
            ],
            updatedAt: Date.now(),
        });
    },
});
export const markNotificationsRead = mutation({
    args: {
        bookId: v.id("books"),
        userId: v.optional(v.string()),
        notificationIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.bookId);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        const notifications = (book.notifications || []).map((n) => args.notificationIds.includes(n.id) ? { ...n, read: true } : n);
        await ctx.db.patch(args.bookId, { notifications, updatedAt: Date.now() });
    },
});
export const getUnreadNotifications = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const books = await ctx.db
            .query("books")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const unread = [];
        for (const book of books) {
            for (const notif of book.notifications || []) {
                if (!notif.read) {
                    unread.push({
                        bookId: book._id,
                        bookTitle: book.title,
                        notification: notif,
                    });
                }
            }
        }
        return unread.sort((a, b) => new Date(b.notification.createdAt).getTime() - new Date(a.notification.createdAt).getTime());
    },
});
export const remove = mutation({
    args: { id: v.id("books"), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const book = await ctx.db.get(args.id);
        if (!book)
            throw new Error("Book not found");
        if (book.userId !== userId)
            throw new Error("Unauthorized");
        if (book.status !== "draft") {
            throw new Error("Can only delete books in draft status");
        }
        if (book.manuscriptStorageId) {
            await ctx.storage.delete(book.manuscriptStorageId);
        }
        if (book.coverStorageId) {
            await ctx.storage.delete(book.coverStorageId);
        }
        await ctx.db.delete(args.id);
    },
});
