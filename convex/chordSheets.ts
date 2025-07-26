import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const chordSheets = await ctx.db
      .query("chordSheets")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    // Get author information for each chord sheet
    const chordSheetsWithAuthors = await Promise.all(
      chordSheets.map(async (sheet) => {
        const author = await ctx.db.get(sheet.authorId);
        return {
          ...sheet,
          authorName: author?.name || author?.email || "Anonymous",
        };
      })
    );

    return chordSheetsWithAuthors;
  },
});

export const getById = query({
  args: { id: v.id("chordSheets") },
  handler: async (ctx, args) => {
    const chordSheet = await ctx.db.get(args.id);
    if (!chordSheet) {
      return null;
    }

    // Check if user can view this chord sheet
    const userId = await getAuthUserId(ctx);
    if (!chordSheet.isPublic && chordSheet.authorId !== userId) {
      return null;
    }

    const author = await ctx.db.get(chordSheet.authorId);
    return {
      ...chordSheet,
      authorName: author?.name || author?.email || "Anonymous",
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    artist: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create chord sheets");
    }

    return await ctx.db.insert("chordSheets", {
      title: args.title,
      artist: args.artist,
      content: args.content,
      authorId: userId,
      tags: args.tags,
      isPublic: args.isPublic,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("chordSheets"),
    title: v.string(),
    artist: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update chord sheets");
    }

    const chordSheet = await ctx.db.get(args.id);
    if (!chordSheet) {
      throw new Error("Chord sheet not found");
    }

    if (chordSheet.authorId !== userId) {
      throw new Error("Can only update your own chord sheets");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      artist: args.artist,
      content: args.content,
      tags: args.tags,
      isPublic: args.isPublic,
    });
  },
});

export const myChordSheets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("chordSheets")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    if (!args.query.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("chordSheets")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("isPublic", true)
      )
      .take(limit);

    // Get author information for each result
    const resultsWithAuthors = await Promise.all(
      results.map(async (sheet) => {
        const author = await ctx.db.get(sheet.authorId);
        return {
          ...sheet,
          authorName: author?.name || author?.email || "Anonymous",
        };
      })
    );

    return resultsWithAuthors;
  },
});
