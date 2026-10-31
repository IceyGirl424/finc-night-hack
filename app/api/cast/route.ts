import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { interpretMessage } from "../../../src/agent";

export async function POST(req: NextRequest) {
  const body = await req.json() as { message?: unknown };
  const message = body.message;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 503 });
  }

  const convex = new ConvexHttpClient(convexUrl);

  await convex.mutation(makeFunctionReference<"mutation">("clipState:logEvent"), {
    event: "message_received",
    detail: message.slice(0, 80),
  });

  let theme;
  try {
    theme = await interpretMessage(message);
  } catch (err) {
    console.error("[cast] agent error:", err);
    return NextResponse.json({ error: "Agent failed to interpret message" }, { status: 500 });
  }

  await convex.mutation(makeFunctionReference<"mutation">("clipState:logEvent"), {
    event: "agent_interpreted",
    detail: theme.theme,
  });

  await convex.mutation(makeFunctionReference<"mutation">("clipState:applyTheme"), theme);

  return NextResponse.json({ ok: true, theme });
}
