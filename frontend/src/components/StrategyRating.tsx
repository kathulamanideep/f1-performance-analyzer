interface Stint {
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
}

interface Pit {
  lap_number: number;
  pit_duration: number;
}

interface Driver {
  number: number;
  name: string;
  team: string;
  color: string;
}

interface Props {
  driver1: Driver;
  driver2: Driver;
  stints1: Stint[];
  stints2: Stint[];
  pits1: Pit[];
  pits2: Pit[];
  totalLaps: number;
}

const TYRE_COLORS: Record<string, string> = {
  SOFT: "#e8002d",
  MEDIUM: "#ffd700",
  HARD: "#ffffff",
  INTERMEDIATE: "#39b54a",
  WET: "#0067ff",
};

const OPTIMAL_STINT: Record<string, { min: number; max: number }> = {
  SOFT:         { min: 10, max: 20 },
  MEDIUM:       { min: 18, max: 30 },
  HARD:         { min: 25, max: 40 },
  INTERMEDIATE: { min: 5,  max: 30 },
  WET:          { min: 5,  max: 30 },
};

function scoreStintLength(compound: string, laps: number): number {
  const range = OPTIMAL_STINT[compound] || { min: 10, max: 35 };
  if (laps >= range.min && laps <= range.max) return 10;
  if (laps < range.min) return Math.max(0, 10 - (range.min - laps) * 1.5);
  return Math.max(0, 10 - (laps - range.max) * 1.5);
}

function scorePitSpeed(duration: number): number {
  // duration = full pit lane time (entry to exit), NOT stationary time
  // TV shows ~2s stationary; pit lane time is typically 17-22s
  if (duration <= 17) return 10;
  if (duration <= 19) return 9;
  if (duration <= 21) return 7;
  if (duration <= 24) return 5;
  return Math.max(0, 5 - (duration - 24));
}

function scoreCompoundChoice(compound: string, stintLaps: number, isFirstStint: boolean): number {
  if (isFirstStint && compound === "HARD" && stintLaps >= 15) return 10;
  if (isFirstStint && compound === "MEDIUM") return 8;
  if (isFirstStint && compound === "SOFT") return 5;
  if (!isFirstStint && compound === "HARD" && stintLaps >= 20) return 10;
  return 7;
}

function analyzeStrategy(stints: Stint[], pits: Pit[], totalLaps: number) {
  const stintScores = stints.map((s, i) => {
    const laps = s.lap_end - s.lap_start + 1;
    const stintScore = scoreStintLength(s.compound, laps);
    const compoundScore = scoreCompoundChoice(s.compound, laps, i === 0);
    return { ...s, laps, stintScore, compoundScore };
  });

  const pitScores = pits.map(p => ({
    ...p,
    speed_score: scorePitSpeed(p.pit_duration),
  }));

  const avgStint = stintScores.reduce((a, b) => a + b.stintScore, 0) / stintScores.length;
  const avgCompound = stintScores.reduce((a, b) => a + b.compoundScore, 0) / stintScores.length;
  const avgPit = pitScores.length ? pitScores.reduce((a, b) => a + b.speed_score, 0) / pitScores.length : 8;
  const overall = (avgStint + avgCompound + avgPit) / 3;

  return { stintScores, pitScores, avgStint, avgCompound, avgPit, overall };
}

function getVerdict(score: number): { label: string; color: string; suggestion: string } {
  if (score >= 9) return { label: "OPTIMAL", color: "#39b54a", suggestion: "Near-perfect strategy. No significant improvements needed." };
  if (score >= 7.5) return { label: "SOLID", color: "#ffd700", suggestion: "Good strategy with minor optimization possible on stint lengths." };
  if (score >= 6) return { label: "ACCEPTABLE", color: "#ff8c00", suggestion: "Strategy worked but timing could be improved by 2-3 laps on pit windows." };
  return { label: "SUBOPTIMAL", color: "#e8002d", suggestion: "Significant strategy improvements available. Consider different compound order." };
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 4, height: 6, width: "100%", marginTop: 4 }}>
      <div style={{
        width: `${score * 10}%`,
        height: "100%",
        background: color,
        borderRadius: 4,
        transition: "width 1s ease"
      }} />
    </div>
  );
}

function DriverStrategyCard({ driver, stints, pits, totalLaps }: {
  driver: Driver; stints: Stint[]; pits: Pit[]; totalLaps: number;
}) {
  const analysis = analyzeStrategy(stints, pits, totalLaps);
  const verdict = getVerdict(analysis.overall);

  return (
    <div style={{ background: "#0d0d14", border: `1px solid ${driver.color}22`, borderRadius: 12, padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#666" }}>STRATEGY RATING</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: driver.color, marginTop: 4 }}>{driver.name}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: verdict.color, lineHeight: 1 }}>
            {analysis.overall.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: verdict.color, marginTop: 2 }}>{verdict.label}</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { label: "STINT TIMING", score: analysis.avgStint },
          { label: "COMPOUND CHOICE", score: analysis.avgCompound },
          { label: "PIT SPEED", score: analysis.avgPit },
        ].map(({ label, score }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, letterSpacing: 1, color: "#666" }}>{label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{score.toFixed(1)}</span>
            </div>
            <ScoreBar score={score} color={driver.color} />
          </div>
        ))}
      </div>

      {/* Pit stop details */}
      {pits.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", marginBottom: 10 }}>PIT STOPS</div>
          <div style={{ display: "flex", gap: 10 }}>
            {pits.map((p, i) => (
              <div key={i} style={{
                background: "#1a1a2e", borderRadius: 8, padding: "10px 16px", textAlign: "center",
                border: `1px solid ${p.pit_duration <= 19 ? "#39b54a33" : "#ff8c0033"}`
              }}>
                <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>LAP {p.lap_number}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: p.pit_duration <= 19 ? "#39b54a" : "#ff8c00" }}>
                  {p.pit_duration}s
                </div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 1 }}>PIT LANE</div>
                <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
                  {p.pit_duration <= 17 ? "⚡ FAST" : p.pit_duration <= 21 ? "✓ GOOD" : "⚠ SLOW"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>
            * Pit lane time (entry to exit). Stationary tyre change ≈ 2–3s shown on TV.
          </div>
        </div>
      )}

      {/* Stint breakdown */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", marginBottom: 10 }}>STINT BREAKDOWN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analysis.stintScores.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: TYRE_COLORS[s.compound] || "#333",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: s.compound === "HARD" || s.compound === "MEDIUM" ? "#000" : "#fff"
              }}>{s.compound[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    {s.compound} — {s.laps} laps (L{s.lap_start}–{s.lap_end})
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.stintScore >= 8 ? "#39b54a" : "#ff8c00" }}>
                    {s.stintScore.toFixed(1)}/10
                  </span>
                </div>
                <ScoreBar score={s.stintScore} color={TYRE_COLORS[s.compound] || "#666"} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        background: `${verdict.color}11`,
        border: `1px solid ${verdict.color}33`,
        borderRadius: 8, padding: 12
      }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: verdict.color, marginBottom: 4 }}>💡 RECOMMENDATION</div>
        <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{verdict.suggestion}</div>
      </div>
    </div>
  );
}

export default function StrategyRating({ driver1, driver2, stints1, stints2, pits1, pits2, totalLaps }: Props) {
  if (!stints1.length && !stints2.length) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, letterSpacing: 2, color: "#666", marginBottom: 16 }}>
        STRATEGY ANALYSIS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <DriverStrategyCard driver={driver1} stints={stints1} pits={pits1} totalLaps={totalLaps} />
        <DriverStrategyCard driver={driver2} stints={stints2} pits={pits2} totalLaps={totalLaps} />
      </div>
    </div>
  );
}