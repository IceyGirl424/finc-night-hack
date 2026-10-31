import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("clipState").order("desc").take(1);
    return rows[0] ?? null;
  },
});

export const applyTheme = mutation({
  args: {
    theme: v.string(),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.string(),
    icon: v.string(),
    animation: v.string(),
    text: v.string(),
    intensity: v.number(),
  },
  handler: async (ctx, args) => {
    // Keep only one row — delete old state first
    const existing = await ctx.db.query("clipState").collect();
    for (const row of existing) await ctx.db.delete(row._id);

    const id = await ctx.db.insert("clipState", {
      ...args,
      updatedAt: Date.now(),
    });

    // Log timeline events
    const now = Date.now();
    await ctx.db.insert("timeline", { event: "theme_synced", detail: args.theme, ts: now });
    await ctx.db.insert("timeline", { event: "clip_updated", detail: args.text, ts: now + 1 });

    return id;
  },
});

export const logEvent = mutation({
  args: {
    event: v.union(
      v.literal("message_received"),
      v.literal("agent_interpreted"),
      v.literal("theme_synced"),
      v.literal("clip_updated")
    ),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("timeline", { ...args, ts: Date.now() });
  },
});

export const getTimeline = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("timeline").withIndex("by_ts").order("desc").take(20);
  },
});
