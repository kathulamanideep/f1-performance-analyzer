import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Driver {
  number: number;
  name: string;
  team: string;
  color: string;
}

interface TrackPoint {
  x: number;
  y: number;
  speed: number;
  throttle: number;
  brake: number;
  rpm: number;
  is_boost: boolean;
  is_straight_mode: boolean;
  is_braking: boolean;
}

interface Props {
  driver1: Driver;
  driver2: Driver;
  sessionKey: number;
}

const BASE = "https://api.openf1.org/v1";

type ViewMode = "speed" | "boost" | "braking" | "aero";

function mergeByTime(loc: any[], car: any[]): TrackPoint[] {
  const carLookup: Record<string, any> = {};
  for (const c of car) {
    const t = c.date.slice(0, 19);
    carLookup[t] = c;
  }

  return loc.map(l => {
    const t = l.date.slice(0, 19);
    const c = carLookup[t] || {};
    const speed = c.speed || 0;
    const throttle = c.throttle || 0;
    const brake = c.brake || 0;
    const rpm = c.rpm || 0;

    return {
      x: l.x,
      y: l.y,
      speed,
      throttle,
      brake,
      rpm,
      is_boost: throttle >= 98 && rpm > 10000 && speed > 250,
      is_straight_mode: speed > 280 && brake < 5,
      is_braking: brake > 80,
    };
  });
}

function normalizePoints(points: TrackPoint[], width: number, height: number, padding: number) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scaleX = (width - padding * 2) / (maxX - minX);
  const scaleY = (height - padding * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);

  return points.map(p => ({
    ...p,
    nx: (p.x - minX) * scale + padding,
    ny: (p.y - minY) * scale + padding,
  }));
}

function getSpeedColor(speed: number): string {
  if (speed > 280) return "#e8002d";
  if (speed > 200) return "#ffd700";
  if (speed > 120) return "#39b54a";
  return "#3671c6";
}

export default function TrackMap({ driver1, driver2, sessionKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points1, setPoints1] = useState<(TrackPoint & { nx: number; ny: number })[]>([]);
  const [points2, setPoints2] = useState<(TrackPoint & { nx: number; ny: number })[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("speed");
  const [activeDriver, setActiveDriver] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const W = 600, H = 500, PAD = 40;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      try {
        const l1 = await axios.get(`${BASE}/location?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(400);
        const c1 = await axios.get(`${BASE}/car_data?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(400);
        const l2 = await axios.get(`${BASE}/location?session_key=${sessionKey}&driver_number=${driver2.number}`);
        await delay(400);
        const c2 = await axios.get(`${BASE}/car_data?session_key=${sessionKey}&driver_number=${driver2.number}`);

        const merged1 = mergeByTime(l1.data, c1.data);
        const merged2 = mergeByTime(l2.data, c2.data);

        const norm1 = normalizePoints(merged1, W, H, PAD);
        const norm2 = normalizePoints(merged2, W, H, PAD);

        setPoints1(norm1);
        setPoints2(norm2);

        // Compute stats
        setStats({
          d1: {
            topSpeed: Math.max(...merged1.map(p => p.speed)),
            boostPct: ((merged1.filter(p => p.is_boost).length / merged1.length) * 100).toFixed(1),
            brakingPct: ((merged1.filter(p => p.is_braking).length / merged1.length) * 100).toFixed(1),
            aeroPct: ((merged1.filter(p => p.is_straight_mode).length / merged1.length) * 100).toFixed(1),
          },
          d2: {
            topSpeed: Math.max(...merged2.map(p => p.speed)),
            boostPct: ((merged2.filter(p => p.is_boost).length / merged2.length) * 100).toFixed(1),
            brakingPct: ((merged2.filter(p => p.is_braking).length / merged2.length) * 100).toFixed(1),
            aeroPct: ((merged2.filter(p => p.is_straight_mode).length / merged2.length) * 100).toFixed(1),
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [driver1, driver2, sessionKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points1.length || !points2.length) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    const points = activeDriver === 1 ? points1 : points2;
    const driver = activeDriver === 1 ? driver1 : driver2;

    // Draw base track outline first (grey)
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.nx, p.ny);
      else ctx.lineTo(p.nx, p.ny);
    });
    ctx.strokeStyle = "#1e1e2e";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw colored telemetry overlay
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.beginPath();
      ctx.moveTo(points[i - 1].nx, points[i - 1].ny);
      ctx.lineTo(p.nx, p.ny);
      ctx.lineWidth = 3;

      if (viewMode === "speed") {
        ctx.strokeStyle = getSpeedColor(p.speed);
      } else if (viewMode === "boost") {
        ctx.strokeStyle = p.is_boost ? "#ffd700" : "#1e1e2e";
        ctx.lineWidth = p.is_boost ? 4 : 2;
      } else if (viewMode === "braking") {
        ctx.strokeStyle = p.is_braking ? "#e8002d" : "#1e1e2e";
        ctx.lineWidth = p.is_braking ? 4 : 2;
      } else if (viewMode === "aero") {
        ctx.strokeStyle = p.is_straight_mode ? "#3671c6" : "#1e1e2e";
        ctx.lineWidth = p.is_straight_mode ? 4 : 2;
      }
      ctx.stroke();
    }

    // Draw start/finish marker
    if (points.length > 0) {
      ctx.beginPath();
      ctx.arc(points[0].nx, points[0].ny, 8, 0, Math.PI * 2);
      ctx.fillStyle = driver.color;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("S/F", points[0].nx + 10, points[0].ny + 4);
    }
  }, [points1, points2, viewMode, activeDriver, driver1, driver2]);

  const modes: { key: ViewMode; label: string; color: string; desc: string }[] = [
    { key: "speed", label: "SPEED", color: "#e8002d", desc: "Red = fast, Green = medium, Blue = slow" },
    { key: "boost", label: "⚡ BOOST ZONES", color: "#ffd700", desc: "Yellow = full throttle high RPM (inferred Boost)" },
    { key: "braking", label: "🔴 BRAKE ZONES", color: "#e8002d", desc: "Red = hard braking > 80%" },
    { key: "aero", label: "🔵 ACTIVE AERO", color: "#3671c6", desc: "Blue = Straight Mode (speed > 280 km/h)" },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, letterSpacing: 2, color: "#666", marginBottom: 16 }}>
        TRACK MAP — TELEMETRY OVERLAY
      </div>

      <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>

        {/* Driver toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[driver1, driver2].map((d, i) => (
            <button key={d.number} onClick={() => setActiveDriver((i + 1) as 1 | 2)}
              style={{
                padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 700,
                fontSize: 12, letterSpacing: 1, border: `2px solid ${d.color}`,
                background: activeDriver === i + 1 ? d.color : "transparent",
                color: activeDriver === i + 1 ? "#000" : d.color,
              }}>
              #{d.number} {d.name}
            </button>
          ))}
        </div>

        {/* View mode buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {modes.map(m => (
            <button key={m.key} onClick={() => setViewMode(m.key)}
              style={{
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                fontSize: 11, letterSpacing: 1, fontWeight: 600,
                border: `1px solid ${viewMode === m.key ? m.color : "#333"}`,
                background: viewMode === m.key ? `${m.color}22` : "transparent",
                color: viewMode === m.key ? m.color : "#666",
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>
          {modes.find(m => m.key === viewMode)?.desc}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#666" }}>⏳ Loading track data...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
            {/* Canvas */}
            <canvas ref={canvasRef} width={W} height={H}
              style={{ background: "#080810", borderRadius: 8, maxWidth: "100%" }} />

            {/* Stats panel */}
            {stats && (
              <div style={{ minWidth: 180 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginBottom: 12 }}>
                  {(activeDriver === 1 ? driver1 : driver2).name.toUpperCase()}
                </div>

                {[
                  { label: "TOP SPEED", val: `${(activeDriver === 1 ? stats.d1 : stats.d2).topSpeed} km/h`, color: "#e8002d" },
                  { label: "⚡ BOOST TIME", val: `${(activeDriver === 1 ? stats.d1 : stats.d2).boostPct}%`, color: "#ffd700" },
                  { label: "🔴 BRAKING TIME", val: `${(activeDriver === 1 ? stats.d1 : stats.d2).brakingPct}%`, color: "#e8002d" },
                  { label: "🔵 AERO STRAIGHT", val: `${(activeDriver === 1 ? stats.d1 : stats.d2).aeroPct}%`, color: "#3671c6" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ marginBottom: 16, padding: "12px", background: "#1a1a2e", borderRadius: 8 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}

                {/* Comparison */}
                {stats && (
                  <div style={{ marginTop: 8, padding: 12, background: "#1a1a2e", borderRadius: 8 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 8 }}>BOOST COMPARISON</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>
                      <span style={{ color: driver1.color }}>{driver1.name.split(" ")[1]}</span>: {stats.d1.boostPct}%
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>
                      <span style={{ color: driver2.color }}>{driver2.name.split(" ")[1]}</span>: {stats.d2.boostPct}%
                    </div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 8, lineHeight: 1.5 }}>
                      {parseFloat(stats.d1.boostPct) > parseFloat(stats.d2.boostPct)
                        ? `${driver1.name.split(" ")[1]} used Boost more aggressively`
                        : `${driver2.name.split(" ")[1]} used Boost more aggressively`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}