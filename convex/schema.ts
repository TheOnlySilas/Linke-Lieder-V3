import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  chordSheets: defineTable({
    title: v.string(),
    artist: v.string(),
    content: v.string(), // Markdown content with chord syntax
    authorId: v.id("users"),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
  })
    .index("by_author", ["authorId"])
    .index("by_public", ["isPublic"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["isPublic"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublic"],
    }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
