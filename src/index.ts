import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { interpretMessage } from "./agent.js";

const convexUrl = process.env.CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

const app = await Spectrum({
  projectId: process.env.PROJECT_ID!,
  projectSecret: process.env.PROJECT_SECRET!,
  providers: [imessage.config()],
});

console.log("[finc] Spectrum ready — listening for iMessages");
if (!convex) console.warn("[finc] CONVEX_URL not set — running without live sync");

for await (const [space, message] of app.messages) {
  if (message.direction === "outbound") continue;
  if (message.content.type !== "text") continue;

  const text = message.content.text.trim();
  if (!text) continue;

  await message.react("👍");

  await space.responding(async () => {
    if (!convex) {
      await message.reply(`echo: ${text}`);
      return;
    }

    try {
      await convex.mutation(makeFunctionReference<"mutation">("clipState:logEvent"), {
        event: "message_received",
        detail: text.slice(0, 80),
      });

      const theme = await interpretMessage(text);

      await convex.mutation(makeFunctionReference<"mutation">("clipState:logEvent"), {
        event: "agent_interpreted",
        detail: theme.theme,
      });

      await convex.mutation(makeFunctionReference<"mutation">("clipState:applyTheme"), theme);

      await message.reply(
        `✨ Clip updated!\nTheme: ${theme.theme}\nColors: ${theme.primaryColor} / ${theme.secondaryColor}\nAnimation: ${theme.animation} · Icon: ${theme.icon}\n"${theme.text}"`
      );
    } catch (err) {
      console.error("[finc] Error processing message:", err);
      await message.reply("Something went wrong interpreting that. Try again?");
    }
  });
}
