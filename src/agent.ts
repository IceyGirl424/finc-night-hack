import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const ThemeSchema = z.object({
  theme: z.enum(["spooky", "party", "romantic", "ocean", "cyberpunk"]),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "must be a hex color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "must be a hex color"),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "must be a hex color"),
  icon: z.enum([
    "ghost",
    "star",
    "heart",
    "wave",
    "lightning",
    "moon",
    "flower",
    "diamond",
    "skull",
    "crown",
  ]),
  animation: z.enum(["blink", "pulse", "wave", "sparkle", "static", "fade"]),
  text: z.string().max(12),
  intensity: z.number().min(0).max(1),
});

export type ClipTheme = z.infer<typeof ThemeSchema>;

const THEME_PRESETS: Record<string, ClipTheme> = {
  spooky: {
    theme: "spooky",
    primaryColor: "#7C3AED",
    secondaryColor: "#F97316",
    accentColor: "#FFFFFF",
    icon: "ghost",
    animation: "blink",
    text: "BOO",
    intensity: 0.8,
  },
  party: {
    theme: "party",
    primaryColor: "#EC4899",
    secondaryColor: "#FACC15",
    accentColor: "#22D3EE",
    icon: "star",
    animation: "sparkle",
    text: "PARTY",
    intensity: 1.0,
  },
  romantic: {
    theme: "romantic",
    primaryColor: "#F43F5E",
    secondaryColor: "#FB7185",
    accentColor: "#FFF1F2",
    icon: "heart",
    animation: "pulse",
    text: "LOVE",
    intensity: 0.7,
  },
  ocean: {
    theme: "ocean",
    primaryColor: "#0EA5E9",
    secondaryColor: "#06B6D4",
    accentColor: "#E0F2FE",
    icon: "wave",
    animation: "wave",
    text: "SURF",
    intensity: 0.6,
  },
  cyberpunk: {
    theme: "cyberpunk",
    primaryColor: "#10B981",
    secondaryColor: "#6366F1",
    accentColor: "#F0ABFC",
    icon: "lightning",
    animation: "sparkle",
    text: "CYBER",
    intensity: 0.9,
  },
};

const SYSTEM_PROMPT = `You are a fashion clip theme designer. Given a natural-language request, output ONLY a JSON object with these exact fields:

{
  "theme": one of: "spooky" | "party" | "romantic" | "ocean" | "cyberpunk",
  "primaryColor": hex color string like "#RRGGBB",
  "secondaryColor": hex color string like "#RRGGBB",
  "accentColor": hex color string like "#RRGGBB",
  "icon": one of: "ghost" | "star" | "heart" | "wave" | "lightning" | "moon" | "flower" | "diamond" | "skull" | "crown",
  "animation": one of: "blink" | "pulse" | "wave" | "sparkle" | "static" | "fade",
  "text": a short string up to 12 characters,
  "intensity": a number between 0.0 and 1.0
}

Output ONLY the JSON. No markdown, no explanation, no code blocks. Just the raw JSON object.`;

function localFallback(input: string): ClipTheme {
  const lower = input.toLowerCase();
  if (lower.includes("spook") || lower.includes("halloween") || lower.includes("ghost") || lower.includes("scary"))
    return THEME_PRESETS.spooky!;
  if (lower.includes("party") || lower.includes("celebrat") || lower.includes("fun"))
    return THEME_PRESETS.party!;
  if (lower.includes("love") || lower.includes("roman") || lower.includes("heart") || lower.includes("valentine"))
    return THEME_PRESETS.romantic!;
  if (lower.includes("ocean") || lower.includes("sea") || lower.includes("wave") || lower.includes("water") || lower.includes("surf"))
    return THEME_PRESETS.ocean!;
  if (lower.includes("cyber") || lower.includes("neon") || lower.includes("tech") || lower.includes("hack"))
    return THEME_PRESETS.cyberpunk!;
  // default
  return THEME_PRESETS.party!;
}

export async function interpretMessage(input: string): Promise<ClipTheme> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[agent] No ANTHROPIC_API_KEY — using local fallback");
    return localFallback(input);
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const raw = response.content[0];
  if (raw?.type !== "text") throw new Error("Unexpected response type from model");

  const parsed = JSON.parse(raw.text.trim());
  return ThemeSchema.parse(parsed);
}
