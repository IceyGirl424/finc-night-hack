import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clipState: defineTable({
    theme: v.string(),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.string(),
    icon: v.string(),
    animation: v.string(),
    text: v.string(),
    intensity: v.number(),
    updatedAt: v.number(),
  }),

  timeline: defineTable({
    event: v.union(
      v.literal("message_received"),
      v.literal("agent_interpreted"),
      v.literal("theme_synced"),
      v.literal("clip_updated")
    ),
    detail: v.optional(v.string()),
    ts: v.number(),
  }).index("by_ts", ["ts"]),
});
