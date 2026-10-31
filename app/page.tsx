"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useState, useTransition } from "react";

// ─── Icon glyphs ────────────────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  ghost: "👻",
  star: "⭐",
  heart: "❤️",
  wave: "🌊",
  lightning: "⚡",
  moon: "🌙",
  flower: "🌸",
  diamond: "💎",
  skull: "💀",
  crown: "👑",
};

const EVENT_LABELS: Record<string, string> = {
  message_received: "Message received",
  agent_interpreted: "Agent interpreted",
  theme_synced: "Theme synced",
  clip_updated: "Clip updated",
};

const EVENT_COLORS: Record<string, string> = {
  message_received: "#a78bfa",
  agent_interpreted: "#34d399",
  theme_synced: "#60a5fa",
  clip_updated: "#f472b6",
};

const PRESETS = [
  { label: "👻 Spooky", message: "Make my clip spooky with purple and orange, blinking, with a ghost" },
  { label: "🎉 Party", message: "I want a wild party vibe with flashing rainbow colors and a star" },
  { label: "🌊 Ocean", message: "Give me chill ocean vibes with blue waves" },
];

// ─── Clip display ────────────────────────────────────────────────────────────

type ClipState = {
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  icon: string;
  animation: string;
  text: string;
  intensity: number;
  updatedAt: number;
} | null;

function ClipDisplay({ state }: { state: ClipState }) {
  const primary = state?.primaryColor ?? "#7C3AED";
  const secondary = state?.secondaryColor ?? "#F97316";
  const accent = state?.accentColor ?? "#FFFFFF";
  const icon = ICONS[state?.icon ?? "star"] ?? "⭐";
  const text = state?.text ?? "FINC";
  const animation = state?.animation ?? "pulse";
  const intensity = state?.intensity ?? 0.8;

  const glowIntensity = Math.round(intensity * 80);

  const animStyle: React.CSSProperties =
    animation === "blink"
      ? { animation: "blink 1.2s step-end infinite" }
      : animation === "pulse"
      ? {
          animation: "pulse-glow 2s ease-in-out infinite",
          ["--glow-color" as string]: primary,
        }
      : animation === "wave"
      ? {
          background: `linear-gradient(135deg, ${primary}, ${secondary}, ${primary})`,
          backgroundSize: "300% 300%",
          animation: "wave-move 3s ease infinite",
        }
      : animation === "sparkle"
      ? { animation: "sparkle 1.5s ease-in-out infinite" }
      : animation === "fade"
      ? { animation: "fade-in-out 2.5s ease-in-out infinite" }
      : {};

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
      {/* Clip body */}
      <div style={{ animation: "float 4s ease-in-out infinite" }}>
        <div
          style={{
            position: "relative",
            width: "200px",
            height: "56px",
            borderRadius: "28px",
            background: `linear-gradient(135deg, #1e1e2e, #2a2a3e)`,
            border: `2px solid ${primary}44`,
            boxShadow: `0 0 ${glowIntensity}px ${primary}66, inset 0 1px 0 ${primary}22`,
            overflow: "hidden",
          }}
        >
          {/* clip hinge detail */}
          <div
            style={{
              position: "absolute",
              right: "-8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "28px",
              background: `linear-gradient(90deg, #2a2a3e, #3a3a4e)`,
              borderRadius: "0 8px 8px 0",
              border: `1px solid ${primary}33`,
            }}
          />
          {/* display screen */}
          <div
            style={{
              position: "absolute",
              left: "8px",
              top: "6px",
              right: "24px",
              bottom: "6px",
              borderRadius: "20px",
              background: animation === "wave"
                ? `linear-gradient(135deg, ${primary}, ${secondary}, ${primary})`
                : `linear-gradient(135deg, ${primary}dd, ${secondary}99)`,
              backgroundSize: animation === "wave" ? "300% 300%" : undefined,
              boxShadow: `0 0 24px ${primary}88`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "0 10px",
              overflow: "hidden",
              ...animStyle,
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>{icon}</span>
            <span
              style={{
                color: accent,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textShadow: `0 0 8px ${accent}`,
                fontFamily: "inherit",
              }}
            >
              {text}
            </span>
          </div>
        </div>

        {/* clip jaw */}
        <div
          style={{
            width: "180px",
            height: "10px",
            margin: "0 auto",
            background: `linear-gradient(90deg, #1a1a28, #2a2a3e, #1a1a28)`,
            borderRadius: "0 0 8px 8px",
            border: `1px solid ${primary}22`,
            borderTop: "none",
          }}
        />
      </div>

      {/* Color swatches */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[primary, secondary, accent].map((c, i) => (
          <div
            key={i}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: c,
              boxShadow: `0 0 8px ${c}88`,
              border: "1px solid #ffffff22",
            }}
          />
        ))}
        <span style={{ color: "#6b6b8a", fontSize: "11px", marginLeft: "4px" }}>
          {state?.theme ?? "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

type TimelineEvent = {
  _id: string;
  event: string;
  detail?: string;
  ts: number;
};

function Timeline({ events }: { events: TimelineEvent[] | undefined }) {
  const items = events?.slice(0, 8) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.length === 0 && (
        <div style={{ color: "#6b6b8a", fontSize: "12px", padding: "8px 0" }}>
          No events yet — cast something to your clip.
        </div>
      )}
      {items.map((ev) => (
        <div
          key={ev._id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 10px",
            borderRadius: "8px",
            background: "#13131a",
            border: `1px solid ${EVENT_COLORS[ev.event] ?? "#2a2a3e"}33`,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: EVENT_COLORS[ev.event] ?? "#6b6b8a",
              boxShadow: `0 0 6px ${EVENT_COLORS[ev.event] ?? "#6b6b8a"}`,
              flexShrink: 0,
            }}
          />
          <span style={{ color: EVENT_COLORS[ev.event] ?? "#6b6b8a", fontSize: "11px", minWidth: "130px" }}>
            {EVENT_LABELS[ev.event] ?? ev.event}
          </span>
          {ev.detail && (
            <span style={{ color: "#6b6b8a", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ev.detail}
            </span>
          )}
          <span style={{ color: "#3a3a5a", fontSize: "10px", marginLeft: "auto", flexShrink: 0 }}>
            {new Date(ev.ts).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const clipState = useQuery(makeFunctionReference<"query">("clipState:getCurrent"));
  const timeline = useQuery(makeFunctionReference<"query">("clipState:getTimeline"));

  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastTheme, setLastTheme] = useState<object | null>(null);

  async function cast(message: string) {
    if (!message.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/cast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json() as { ok?: boolean; theme?: object; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Unknown error");
        setLastTheme(data.theme ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function reset() {
    setInput("");
    setError(null);
    setLastTheme(null);
  }

  const busy = isPending;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gridTemplateRows: "auto 1fr",
        gap: "0",
      }}
    >
      {/* Header */}
      <header
        style={{
          gridColumn: "1 / -1",
          padding: "20px 32px",
          borderBottom: "1px solid #1c1c28",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #a78bfa, #34d399)",
            boxShadow: "0 0 20px #a78bfa66",
          }}
        />
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#e8e8f0", letterSpacing: "0.05em" }}>
            finc studio
          </h1>
          <p style={{ fontSize: "11px", color: "#6b6b8a" }}>wearable clip digital twin</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#34d399",
              boxShadow: "0 0 8px #34d399",
            }}
          />
          <span style={{ fontSize: "11px", color: "#6b6b8a" }}>live</span>
        </div>
      </header>

      {/* Left — clip + controls */}
      <main style={{ padding: "40px 32px", display: "flex", flexDirection: "column", gap: "40px" }}>
        {/* Clip display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "48px 24px",
            background: "#13131a",
            borderRadius: "20px",
            border: "1px solid #1c1c28",
          }}
        >
          <p style={{ fontSize: "11px", color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            clip preview
          </p>
          <ClipDisplay state={clipState ?? null} />
        </div>

        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "11px", color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Tell your clip what to become
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && cast(input)}
              placeholder="Make it spooky with purple and a ghost…"
              disabled={busy}
              style={{
                flex: 1,
                background: "#13131a",
                border: "1px solid #2a2a3e",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#e8e8f0",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#a78bfa")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a3e")}
            />
            <button
              onClick={() => cast(input)}
              disabled={busy || !input.trim()}
              style={{
                padding: "12px 20px",
                background: busy ? "#2a2a3e" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                border: "none",
                borderRadius: "10px",
                color: busy ? "#6b6b8a" : "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: busy || !input.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
                minWidth: "100px",
              }}
            >
              {busy ? "Casting…" : "Cast to clip"}
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#2d1515",
                border: "1px solid #7f1d1d",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Preset buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "11px", color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Quick presets
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => cast(p.message)}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  background: "#13131a",
                  border: "1px solid #2a2a3e",
                  borderRadius: "20px",
                  color: "#a78bfa",
                  fontSize: "12px",
                  cursor: busy ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "#a78bfa";
                  (e.target as HTMLButtonElement).style.background = "#1c1c28";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "#2a2a3e";
                  (e.target as HTMLButtonElement).style.background = "#13131a";
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={reset}
              style={{
                padding: "8px 14px",
                background: "transparent",
                border: "1px solid #2a2a3e",
                borderRadius: "20px",
                color: "#6b6b8a",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside
        style={{
          borderLeft: "1px solid #1c1c28",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          overflowY: "auto",
        }}
      >
        {/* Event timeline */}
        <section>
          <h2
            style={{
              fontSize: "11px",
              color: "#6b6b8a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "14px",
            }}
          >
            Event timeline
          </h2>
          <Timeline events={timeline as TimelineEvent[] | undefined} />
        </section>

        {/* Dev panel */}
        <section>
          <h2
            style={{
              fontSize: "11px",
              color: "#6b6b8a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "14px",
            }}
          >
            Theme JSON
          </h2>
          <pre
            style={{
              background: "#0d0d14",
              border: "1px solid #1c1c28",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "11px",
              color: "#34d399",
              overflow: "auto",
              lineHeight: 1.7,
              maxHeight: "320px",
            }}
          >
            {lastTheme
              ? JSON.stringify(lastTheme, null, 2)
              : clipState
              ? JSON.stringify(
                  {
                    theme: clipState.theme,
                    primaryColor: clipState.primaryColor,
                    secondaryColor: clipState.secondaryColor,
                    accentColor: clipState.accentColor,
                    icon: clipState.icon,
                    animation: clipState.animation,
                    text: clipState.text,
                    intensity: clipState.intensity,
                  },
                  null,
                  2
                )
              : "// No theme yet"}
          </pre>
        </section>

        {/* Phone test hint */}
        <section
          style={{
            padding: "14px",
            background: "#0d0d14",
            border: "1px solid #1c1c28",
            borderRadius: "10px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#6b6b8a", lineHeight: 1.7 }}>
            📱 <span style={{ color: "#a78bfa" }}>Phone test:</span> Text your
            Photon line and the clip updates here live.
          </p>
          <p style={{ fontSize: "10px", color: "#3a3a5a", marginTop: "6px" }}>
            run <code style={{ color: "#34d399" }}>photon spectrum lines list</code> to find your number
          </p>
        </section>
      </aside>
    </div>
  );
}
