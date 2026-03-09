import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  ReferenceArea
} from "recharts";
import StrategyRating from "./StrategyRating";
import CarInsights from "./CarInsights";
import TrackMap from "./TrackMap";

interface Driver {
  number: number;
  name: string;
  team: string;
  color: string;
}

interface Lap {
  lap_number: number;
  lap_duration: number;
}

interface Stint {
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

interface Props {
  driver1: Driver;
  driver2: Driver;
  sessionKey: number;
}

const BASE = "https://api.openf1.org/v1";

const TYRE_COLORS: Record<string, string> = {
  SOFT: "#e8002d",
  MEDIUM: "#ffd700",
  HARD: "#ffffff",
  INTERMEDIATE: "#39b54a",
  WET: "#0067ff",
};

const TYRE_BG: Record<string, string> = {
  SOFT: "rgba(232,0,45,0.08)",
  MEDIUM: "rgba(255,215,0,0.08)",
  HARD: "rgba(255,255,255,0.05)",
  INTERMEDIATE: "rgba(57,181,74,0.08)",
  WET: "rgba(0,103,255,0.08)",
};

export default function DriverComparison({ driver1, driver2, sessionKey }: Props) {
  const [laps1, setLaps1] = useState<Lap[]>([]);
  const [laps2, setLaps2] = useState<Lap[]>([]);
  const [stints1, setStints1] = useState<Stint[]>([]);
  const [stints2, setStints2] = useState<Stint[]>([]);
  const [pits1, setPits1] = useState<any[]>([]);
  const [pits2, setPits2] = useState<any[]>([]);
  const [carData1, setCarData1] = useState<any[]>([]);
  const [carData2, setCarData2] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      try {
        const r1 = await axios.get(`${BASE}/laps?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(800);
        const r2 = await axios.get(`${BASE}/laps?session_key=${sessionKey}&driver_number=${driver2.number}`);
        await delay(800);
        const s1 = await axios.get(`${BASE}/stints?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(800);
        const s2 = await axios.get(`${BASE}/stints?session_key=${sessionKey}&driver_number=${driver2.number}`);
        await delay(800);
        const p1 = await axios.get(`${BASE}/pit?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(800);
        const p2 = await axios.get(`${BASE}/pit?session_key=${sessionKey}&driver_number=${driver2.number}`);
        await delay(800);
        const c1 = await axios.get(`${BASE}/car_data?session_key=${sessionKey}&driver_number=${driver1.number}`);
        await delay(800);
        const c2 = await axios.get(`${BASE}/car_data?session_key=${sessionKey}&driver_number=${driver2.number}`);

        setLaps1(r1.data.filter((l: Lap) => l.lap_duration && l.lap_duration < 200));
        setLaps2(r2.data.filter((l: Lap) => l.lap_duration && l.lap_duration < 200));
        setStints1(s1.data);
        setStints2(s2.data);
        setPits1(p1.data);
        setPits2(p2.data);
        setCarData1(c1.data);
        setCarData2(c2.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [driver1, driver2, sessionKey, refreshKey]);

  // Live refresh every 30 seconds during race hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getUTCHours();
      if (hour >= 5 && hour <= 15) {
        setRefreshKey(k => k + 1);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = laps1.map(l1 => {
    const l2 = laps2.find(l => l.lap_number === l1.lap_number);
    return {
      lap: l1.lap_number,
      [driver1.name]: +l1.lap_duration.toFixed(3),
      [driver2.name]: l2 ? +l2.lap_duration.toFixed(3) : null,
    };
  });

  const fastest1 = laps1.length ? Math.min(...laps1.map(l => l.lap_duration)) : 0;
  const fastest2 = laps2.length ? Math.min(...laps2.map(l => l.lap_duration)) : 0;
  const delta = (fastest1 - fastest2).toFixed(3);

  return (
    <div style={{ padding: "32px 40px" }}>

      {/* Last updated indicator */}
      {lastUpdated && (
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 1, marginBottom: 16, textAlign: "right" }}>
          LAST UPDATED: {lastUpdated}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
        <StatCard title="FASTEST LAP" driver1={driver1} driver2={driver2}
          val1={fastest1 ? fastest1.toFixed(3) + "s" : "—"}
          val2={fastest2 ? fastest2.toFixed(3) + "s" : "—"} />
        <StatCard title="TOTAL LAPS" driver1={driver1} driver2={driver2}
          val1={laps1.length.toString()}
          val2={laps2.length.toString()} />
        <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginBottom: 12 }}>LAP DELTA</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: +delta < 0 ? driver1.color : driver2.color }}>
            {delta !== "0.000" ? (parseFloat(delta) > 0 ? "+" : "") + delta + "s" : "EQUAL"}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            {+delta < 0 ? driver1.name : driver2.name} faster
          </div>
        </div>
      </div>

      {/* Tyre Stint Bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <TyreStintBar driver={driver1} stints={stints1} totalLaps={laps1.length} />
        <TyreStintBar driver={driver2} stints={stints2} totalLaps={laps2.length} />
      </div>

      {/* Lap Time Chart */}
      <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 14, letterSpacing: 2, color: "#666", marginBottom: 24 }}>
          LAP TIME COMPARISON — AUSTRALIAN GP 2026
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>⏳ Loading telemetry...</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              {stints1.map(s => (
                <ReferenceArea
                  key={s.stint_number}
                  x1={s.lap_start} x2={s.lap_end}
                  fill={TYRE_BG[s.compound] || "transparent"}
                />
              ))}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="lap" stroke="#444"
                label={{ value: "Lap", position: "insideBottom", offset: -5, fill: "#666" }} />
              <YAxis stroke="#444" domain={["auto", "auto"]} tickFormatter={v => v + "s"} />
              <Tooltip
                contentStyle={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 8 }}
                formatter={(val: any) => val + "s"}
                labelFormatter={l => `Lap ${l}`}
              />
              <Legend />
              <Line type="monotone" dataKey={driver1.name} stroke={driver1.color} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey={driver2.name} stroke={driver2.color} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center" }}>
          {Object.entries(TYRE_COLORS).map(([compound, color]) => (
            <div key={compound} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, border: "1px solid #333" }} />
              <span style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>{compound}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Rating */}
      <StrategyRating
        driver1={driver1} driver2={driver2}
        stints1={stints1} stints2={stints2}
        pits1={pits1} pits2={pits2}
        totalLaps={Math.max(laps1.length, laps2.length)}
      />

      {/* Car Insights */}
      <CarInsights
        driver1={driver1} driver2={driver2}
        carData1={carData1} carData2={carData2}
      />

      {/* Track Map */}
      <TrackMap
        driver1={driver1} driver2={driver2}
        sessionKey={sessionKey}
      />

    </div>
  );
}

function TyreStintBar({ driver, stints, totalLaps }: { driver: Driver; stints: Stint[]; totalLaps: number }) {
  return (
    <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginBottom: 12 }}>
        {driver.name.toUpperCase()} — TYRE STRATEGY
      </div>
      <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", gap: 2 }}>
        {stints.map(s => {
          const width = ((s.lap_end - s.lap_start + 1) / totalLaps) * 100;
          return (
            <div key={s.stint_number}
              style={{
                width: `${width}%`,
                background: TYRE_COLORS[s.compound] || "#333",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: s.compound === "HARD" || s.compound === "MEDIUM" ? "#000" : "#fff",
                borderRadius: 4,
              }}
              title={`${s.compound} — Laps ${s.lap_start}-${s.lap_end}`}
            >
              {s.compound[0]}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        {stints.map(s => (
          <div key={s.stint_number} style={{ fontSize: 11, color: "#666" }}>
            <span style={{ color: TYRE_COLORS[s.compound], fontWeight: 700 }}>{s.compound}</span>
            {" "}L{s.lap_start}–{s.lap_end}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, driver1, driver2, val1, val2 }: any) {
  return (
    <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: driver1.color, marginBottom: 4 }}>{driver1.name}</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{val1}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: driver2.color, marginBottom: 4 }}>{driver2.name}</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{val2}</div>
        </div>
      </div>
    </div>
  );
}