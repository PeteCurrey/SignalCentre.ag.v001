import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRiskGradeLabel, getRelativeTime } from "@/lib/utils";
import type { AIModel, Direction } from "@/lib/types";
import { getSignalDetail } from "@/lib/data/signals";

type Params = Promise<{ instrument: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { instrument } = await params;
  const name = instrument.replace(/-/g, "/").toUpperCase();
  return {
    title: `${name} Signal Detail`,
    description: `AI consensus analysis and signal intelligence for ${name}.`,
  };
}

function AIModelPanel({
  model,
  role,
  bias,
  confidence,
  rationale,
  keyPoints,
  concerns,
}: {
  model: AIModel;
  role: string;
  bias: Direction;
  confidence: number;
  rationale: string;
  keyPoints: string[];
  concerns?: string[];
}) {
  const modelColors: Record<string, string> = {
    CLAUDE: "var(--burgundy)",
    GPT: "var(--navy)",
    GROK: "var(--green)",
    GEMINI: "var(--amber)", // Fallback if still present in old data
  };
  const biasColors: Record<Direction, string> = {
    BULLISH: "var(--green)",
    BEARISH: "var(--burgundy)",
    NEUTRAL: "var(--text-muted)",
  };

  return (
    <div
      style={{
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "var(--space-6)",
        borderTop: `2px solid ${modelColors[model] || "var(--navy)"}`,
      }}
    >
      {/* Model header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-4)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: modelColors[model] || "var(--navy)",
              letterSpacing: "0.06em",
              marginBottom: "2px",
            }}
          >
            {model}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {role}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "0.625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}
          >
            Confidence
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.25rem",
              fontWeight: 500,
              color:
                confidence >= 80
                  ? "var(--green)"
                  : confidence >= 60
                  ? "var(--amber)"
                  : "var(--burgundy)",
            }}
          >
            {confidence}
          </div>
        </div>
      </div>

      {/* Bias */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "3px 10px",
          backgroundColor: "var(--bg-stone)",
          marginBottom: "var(--space-4)",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: biasColors[bias],
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          {bias === "BULLISH" ? "↑" : bias === "BEARISH" ? "↓" : "→"} {bias}
        </span>
      </div>

      {/* Rationale */}
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: "var(--space-4)",
        }}
      >
        {rationale}
      </p>

      {/* Key Points */}
      <div style={{ marginBottom: concerns?.length ? "var(--space-4)" : 0 }}>
        <div
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "var(--space-2)",
          }}
        >
          Key Points
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {keyPoints.map((point, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: "var(--space-2)",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                padding: "3px 0",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: modelColors[model] || "var(--navy)", flexShrink: 0 }}>—</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Concerns */}
      {concerns && concerns.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--burgundy)",
              marginBottom: "var(--space-2)",
            }}
          >
            Risk Flags
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {concerns.map((c, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  fontSize: "0.75rem",
                  color: "var(--burgundy-light)",
                  padding: "3px 0",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ flexShrink: 0 }}>⚠</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConfluenceRow({
  label,
  value,
  type,
}: {
  label: string;
  value: number | string;
  type: "score" | "raw" | "alignment";
}) {
  const numVal = typeof value === "number" ? value : 0;

  let barColor = "var(--navy)";
  let barWidth = "50%";

  if (type === "score") {
    barWidth = `${numVal}%`;
    barColor =
      numVal >= 70
        ? "var(--green)"
        : numVal >= 45
        ? "var(--amber)"
        : "var(--burgundy)";
  } else if (type === "alignment") {
    // -2 to +2 mapped to 0–100%
    barWidth = `${((numVal + 2) / 4) * 100}%`;
    barColor = numVal > 0 ? "var(--green)" : numVal < 0 ? "var(--burgundy)" : "var(--platinum)";
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr 80px",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-3) 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      {type !== "raw" ? (
        <div
          style={{
            height: "2px",
            backgroundColor: "var(--bg-stone)",
          }}
        >
          <div
            style={{
              width: barWidth,
              height: "100%",
              backgroundColor: barColor,
              transition: "width var(--duration-slow)",
            }}
          />
        </div>
      ) : (
        <div />
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--text-primary)",
          textAlign: "right",
        }}
      >
        {typeof value === "number" && type === "alignment"
          ? value > 0
            ? `+${value}`
            : value
          : value}
        {type === "score" ? "" : ""}
      </span>
    </div>
  );
}

export const revalidate = 0;

export default async function SignalDetailPage({ params }: { params: Params }) {
  const { instrument } = await params;
  const signal = await getSignalDetail(instrument);

  if (!signal) {
    notFound();
  }

  const instrumentName = signal.instrument;

  // Consensus agreement calculation
  const bullishCount = signal.aiResponses.filter((r) => r.bias === "BULLISH").length;
  const bearishCount = signal.aiResponses.filter((r) => r.bias === "BEARISH").length;
  const alignmentPct = Math.round(
    (Math.max(bullishCount, bearishCount) / signal.aiResponses.length) * 100
  );

  return (
    <div style={{ padding: "var(--space-8) var(--space-10)" }}>
      {/* Page Header */}
      <div
        style={{
          marginBottom: "var(--space-8)",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "var(--space-1)",
              }}
            >
              {signal.assetClass} · {signal.timeframe}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.75rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.02em",
                marginBottom: "var(--space-1)",
              }}
            >
              {instrumentName}
            </h1>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}
            >
              Signal generated {getRelativeTime(signal.timestamp)} ·{" "}
              {signal.sessionContext}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0",
              borderLeft: "1px solid var(--border)",
              borderTop: "1px solid var(--border)",
            }}
          >
            {[
              {
                label: "Direction",
                value:
                  signal.direction === "BULLISH"
                    ? "↑ BULLISH"
                    : signal.direction === "BEARISH"
                    ? "↓ BEARISH"
                    : "→ NEUTRAL",
                color:
                  signal.direction === "BULLISH"
                    ? "var(--green)"
                    : signal.direction === "BEARISH"
                    ? "var(--burgundy)"
                    : "var(--text-muted)",
              },
              {
                label: "Conviction",
                value: signal.convictionScore,
                color:
                  signal.convictionScore >= 70
                    ? "var(--green)"
                    : signal.convictionScore >= 45
                    ? "var(--amber)"
                    : "var(--burgundy)",
              },
              {
                label: "Consensus",
                value: signal.consensusScore,
                color:
                  signal.consensusScore >= 70
                    ? "var(--green)"
                    : signal.consensusScore >= 45
                    ? "var(--amber)"
                    : "var(--burgundy)",
              },
              {
                label: "Risk Grade",
                value: getRiskGradeLabel(signal.riskGrade),
                color:
                  signal.riskGrade === "A_PLUS"
                    ? "var(--green)"
                    : signal.riskGrade === "A"
                    ? "var(--green-light)"
                    : signal.riskGrade === "B"
                    ? "var(--amber)"
                    : "var(--burgundy)",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "var(--space-10)",
        }}
      >
        {/* Left column */}
        <div>
          {/* AI Consensus Engine */}
          <section style={{ marginBottom: "var(--space-10)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h2
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "0.02em",
                }}
              >
                AI Consensus Engine
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-4)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Alignment:{" "}
                  <span
                    style={{
                      color:
                        alignmentPct >= 75 ? "var(--green)" : "var(--amber)",
                      fontWeight: 600,
                    }}
                  >
                    {alignmentPct}%
                  </span>
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {bullishCount}/{signal.aiResponses.length} models bullish
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {signal.aiResponses.map((resp) => (
                <AIModelPanel key={resp.model} {...resp} />
              ))}
            </div>
          </section>

          {/* Confluence Matrix */}
          <section style={{ marginBottom: "var(--space-10)" }}>
            <h2
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "var(--space-4)",
                letterSpacing: "0.02em",
              }}
            >
              Confluence Matrix
            </h2>

            <div style={{ border: "1px solid var(--border)", padding: "var(--space-6)" }}>
              <ConfluenceRow
                label="RSI"
                value={signal.confluenceMatrix.rsi}
                type="raw"
              />
              <ConfluenceRow
                label="MACD Signal"
                value={signal.confluenceMatrix.macd}
                type="raw"
              />
              <ConfluenceRow
                label="EMA Alignment"
                value={signal.confluenceMatrix.emaAlignment}
                type="alignment"
              />
              <ConfluenceRow
                label="ATR"
                value={signal.confluenceMatrix.atr}
                type="raw"
              />
              <ConfluenceRow
                label="Relative Volume"
                value={signal.confluenceMatrix.volume}
                type="score"
              />
              <ConfluenceRow
                label="Sentiment Score"
                value={signal.confluenceMatrix.sentiment}
                type="score"
              />
              <ConfluenceRow
                label="News Flow"
                value={signal.confluenceMatrix.newsScore}
                type="score"
              />
              <div style={{ borderBottom: "none" }}>
                <ConfluenceRow
                  label="Macro Context"
                  value={signal.confluenceMatrix.macroScore}
                  type="score"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right column — Opportunity Framework */}
        <div>
          <div
            style={{
              border: "1px solid var(--border)",
              position: "sticky",
              top: "calc(var(--header-height) + var(--space-6))",
            }}
          >
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--bg-warm)",
              }}
            >
              <h2
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Opportunity Framework
              </h2>
            </div>

            <div style={{ padding: "var(--space-5)" }}>
              {[
                {
                  label: "Direction Bias",
                  value: signal.direction,
                  color:
                    signal.direction === "BULLISH"
                      ? "var(--green)"
                      : "var(--burgundy)",
                },
                { label: "Opportunity Zone", value: signal.opportunityZone },
                {
                  label: "Invalidation Level",
                  value: signal.invalidationLevel,
                  color: "var(--burgundy)",
                },
                {
                  label: "Volatility",
                  value: signal.volatilityExpectation,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: item.color || "var(--text-primary)",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}

              {/* Catalysts */}
              <div style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--border)" }}>
                <div
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Catalysts
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {signal.catalysts.map((c, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        padding: "2px 0",
                        display: "flex",
                        gap: "var(--space-2)",
                      }}
                    >
                      <span style={{ color: "var(--navy)" }}>·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Context */}
              <div style={{ padding: "var(--space-3) 0" }}>
                <div
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--burgundy)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Risk Context
                </div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.65,
                  }}
                >
                  {signal.riskContext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
