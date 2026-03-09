interface Driver {
  number: number;
  name: string;
  team: string;
  color: string;
}

interface CarData {
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  n_gear: number;
  drs: number | null;
}

interface Props {
  driver1: Driver;
  driver2: Driver;
  carData1: CarData[];
  carData2: CarData[];
}

const POWER_UNITS: Record<string, {
  manufacturer: string;
  type: string;
  powerSplit: string;
  pros: string[];
  cons: string[];
}> = {
  "Red Bull Racing": {
    manufacturer: "Red Bull Powertrains / Ford",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["In-house development control", "Ford technical partnership", "Built at Milton Keynes alongside chassis", "Full integration between PU and chassis teams"],
    cons: ["First season with own PU", "No prior engine manufacturing experience at this scale", "High risk, high reward approach"],
  },
  "Ferrari": {
    manufacturer: "Ferrari",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["High RPM capability", "Strong ERS recharge under braking", "Excellent Boost deployment", "Aggressive Overtake Mode usage"],
    cons: ["Higher brake temperatures", "Reliability concerns in long stints"],
  },
  "Mercedes": {
    manufacturer: "Mercedes-AMG",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Best-in-class fuel efficiency", "Smooth ERS power curve", "Strong Active Aero integration", "Consistent Boost deployment"],
    cons: ["Slower initial Overtake Mode response", "Setup sensitivity"],
  },
  "McLaren": {
    manufacturer: "Mercedes-AMG",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Excellent chassis-ERS integration", "Strong aero efficiency in Straight Mode", "Fast pit stops"],
    cons: ["Tyre management challenges", "Dependent on Mercedes PU updates"],
  },
  "Aston Martin": {
    manufacturer: "Honda Racing Corporation",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Honda works team status", "Proven hybrid expertise from road car division", "Adrian Newey leading car design", "Exclusive PU supply deal"],
    cons: ["First season as works Honda team", "New partnership dynamics", "Development timeline pressures"],
  },
  "Alpine": {
    manufacturer: "Mercedes-AMG",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Mercedes PU performance", "Strong straight-line speed", "Proven reliability"],
    cons: ["Customer team disadvantage vs works Mercedes", "No engine control", "Transition from Renault mid-cycle"],
  },
  "Williams": {
    manufacturer: "Mercedes-AMG",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Good straight-line speed", "Effective Active Aero usage", "Reliable Mercedes supply"],
    cons: ["Chassis limitations", "ERS deployment consistency"],
  },
  "Haas F1 Team": {
    manufacturer: "Ferrari",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Ferrari PU performance", "Strong Boost button response", "Proven reliability"],
    cons: ["Limited development resources", "Chassis lags behind PU capability"],
  },
  "Racing Bulls": {
    manufacturer: "Red Bull Powertrains / Ford",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Red Bull PU advantage", "Strong Overtake Mode capability", "Sister team technical support"],
    cons: ["Fewer resources than Red Bull", "Slower Active Aero development"],
  },
  "Audi": {
    manufacturer: "Audi",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["New manufacturer ambition", "Strong EV/hybrid expertise from road cars", "Heavy investment in F1"],
    cons: ["First season with own PU", "Unknown reliability in race conditions", "Steep F1 learning curve"],
  },
  "Cadillac": {
    manufacturer: "Ferrari",
    type: "1.6L V6 Turbo Hybrid — 2026 Spec",
    powerSplit: "50% ICE / 50% ERS",
    pros: ["Ferrari customer PU", "Strong American motorsport backing", "TWG/Andretti experience"],
    cons: ["Brand new F1 team", "Limited F1 aerodynamic data", "Chassis development curve"],
  },
};

function getCarStats(data: CarData[]) {
  if (!data.length) return null;
  const speeds = data.map(d => d.speed).filter(Boolean);
  const rpms = data.map(d => d.rpm).filter(Boolean);
  const throttles = data.map(d => d.throttle).filter(v => v !== null && v !== undefined);
  const brakes = data.map(d => d.brake).filter(v => v !== null && v !== undefined);
  const fullThrottle = throttles.filter(t => t >= 98).length;
  const hardBraking = brakes.filter(b => b >= 80).length;

  return {
    topSpeed: Math.max(...speeds),
    maxRpm: Math.max(...rpms),
    avgThrottle: throttles.reduce((a, b) => a + b, 0) / throttles.length,
    avgBrake: brakes.reduce((a, b) => a + b, 0) / brakes.length,
    fullThrottlePct: (fullThrottle / throttles.length) * 100,
    hardBrakingPct: (hardBraking / brakes.length) * 100,
    totalPoints: data.length,
  };
}

function StatRow({ label, val1, val2, unit, color1, color2, higherIsBetter = true, decimals = 1 }: {
  label: string; val1: number; val2: number; unit: string;
  color1: string; color2: string; higherIsBetter?: boolean; decimals?: number;
}) {
  const winner = higherIsBetter ? (val1 >= val2 ? 1 : 2) : (val1 <= val2 ? 1 : 2);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1a1a2e" }}>
      <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        {winner === 1 && <span style={{ fontSize: 9, color: color1 }}>▲</span>}
        <span style={{ fontSize: 18, fontWeight: 800, color: winner === 1 ? color1 : "#aaa" }}>
          {val1.toFixed(decimals)}{unit}
        </span>
      </div>
      <div style={{ fontSize: 10, letterSpacing: 1, color: "#555", textAlign: "center", minWidth: 140 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: winner === 2 ? color2 : "#aaa" }}>
          {val2.toFixed(decimals)}{unit}
        </span>
        {winner === 2 && <span style={{ fontSize: 9, color: color2 }}>▲</span>}
      </div>
    </div>
  );
}

function PowerUnitCard({ driver, pu }: { driver: Driver; pu: typeof POWER_UNITS[string] }) {
  return (
    <div style={{ background: "#0d0d14", border: `1px solid ${driver.color}22`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginBottom: 4 }}>2026 POWER UNIT</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: driver.color, marginBottom: 2 }}>{pu.manufacturer}</div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{pu.type}</div>
      <div style={{
        display: "inline-block", background: "#1a1a2e", borderRadius: 4,
        padding: "3px 8px", fontSize: 10, color: "#ffd700", letterSpacing: 1, marginBottom: 16
      }}>
        ⚡ {pu.powerSplit}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#39b54a", marginBottom: 8 }}>✓ STRENGTHS</div>
        {pu.pros.map((p, i) => (
          <div key={i} style={{ fontSize: 11, color: "#aaa", marginBottom: 4, paddingLeft: 8 }}>• {p}</div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#e8002d", marginBottom: 8 }}>✗ WEAKNESSES</div>
        {pu.cons.map((c, i) => (
          <div key={i} style={{ fontSize: 11, color: "#aaa", marginBottom: 4, paddingLeft: 8 }}>• {c}</div>
        ))}
      </div>

      <div style={{
        marginTop: 16, padding: "10px 12px", background: "#1a1a2e",
        borderRadius: 8, fontSize: 10, color: "#555", lineHeight: 1.6
      }}>
        🆕 2026 spec: Active Aero (Straight/Corner Mode) + Boost Button + Overtake Mode replaces DRS
      </div>
    </div>
  );
}

export default function CarInsights({ driver1, driver2, carData1, carData2 }: Props) {
  const stats1 = getCarStats(carData1);
  const stats2 = getCarStats(carData2);
  const pu1 = POWER_UNITS[driver1.team];
  const pu2 = POWER_UNITS[driver2.team];

  if (!stats1 || !stats2) return (
    <div style={{ textAlign: "center", padding: 40, color: "#666" }}>⏳ Loading car data...</div>
  );

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, letterSpacing: 2, color: "#666", marginBottom: 16 }}>
        CAR & ENGINE INSIGHTS
      </div>

      {/* Head to head stats */}
      <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", marginBottom: 16, alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: driver1.color, textAlign: "right" }}>{driver1.name}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#444", textAlign: "center", padding: "0 20px" }}>HEAD TO HEAD</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: driver2.color }}>{driver2.name}</div>
        </div>

        <StatRow label="TOP SPEED" val1={stats1.topSpeed} val2={stats2.topSpeed} unit=" km/h" color1={driver1.color} color2={driver2.color} decimals={0} />
        <StatRow label="MAX RPM" val1={stats1.maxRpm} val2={stats2.maxRpm} unit="" color1={driver1.color} color2={driver2.color} decimals={0} />
        <StatRow label="AVG THROTTLE" val1={stats1.avgThrottle} val2={stats2.avgThrottle} unit="%" color1={driver1.color} color2={driver2.color} />
        <StatRow label="FULL THROTTLE TIME" val1={stats1.fullThrottlePct} val2={stats2.fullThrottlePct} unit="%" color1={driver1.color} color2={driver2.color} />
        <StatRow label="AVG BRAKE" val1={stats1.avgBrake} val2={stats2.avgBrake} unit="%" color1={driver1.color} color2={driver2.color} higherIsBetter={false} />
        <StatRow label="HARD BRAKING" val1={stats1.hardBrakingPct} val2={stats2.hardBrakingPct} unit="%" color1={driver1.color} color2={driver2.color} higherIsBetter={false} />

        <div style={{ marginTop: 16, padding: "10px 12px", background: "#1a1a2e", borderRadius: 8, fontSize: 11, color: "#555" }}>
          ℹ️ DRS removed in 2026. Overtake Mode (electrical boost when within 1s of car ahead) and Active Aero now power overtaking opportunities.
        </div>
      </div>

      {/* Power Unit Cards */}
      {pu1 && pu2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <PowerUnitCard driver={driver1} pu={pu1} />
          <PowerUnitCard driver={driver2} pu={pu2} />
        </div>
      )}
    </div>
  );
}