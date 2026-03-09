import { useState, useEffect } from "react";
import DriverComparison from "./components/DriverComparison";
import "./App.css";

const DRIVERS = [
  { number: 1, name: "Lando Norris", team: "McLaren", color: "#FF8000" },
  { number: 3, name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6" },
  { number: 6, name: "Isack Hadjar", team: "Racing Bulls", color: "#6692FF" },
  { number: 12, name: "Kimi Antonelli", team: "Mercedes", color: "#27F4D2" },
  { number: 16, name: "Charles Leclerc", team: "Ferrari", color: "#E8002D" },
  { number: 44, name: "Lewis Hamilton", team: "Ferrari", color: "#E8002D" },
  { number: 63, name: "George Russell", team: "Mercedes", color: "#27F4D2" },
  { number: 81, name: "Oscar Piastri", team: "McLaren", color: "#FF8000" },
  { number: 14, name: "Fernando Alonso", team: "Aston Martin", color: "#358C75" },
  { number: 18, name: "Lance Stroll", team: "Aston Martin", color: "#358C75" },
  { number: 23, name: "Alexander Albon", team: "Williams", color: "#64C4FF" },
  { number: 55, name: "Carlos Sainz", team: "Williams", color: "#64C4FF" },
  { number: 10, name: "Pierre Gasly", team: "Alpine", color: "#FF87BC" },
  { number: 43, name: "Franco Colapinto", team: "Alpine", color: "#FF87BC" },
  { number: 31, name: "Esteban Ocon", team: "Haas F1 Team", color: "#B6BABD" },
  { number: 87, name: "Oliver Bearman", team: "Haas F1 Team", color: "#B6BABD" },
  { number: 5, name: "Gabriel Bortoleto", team: "Audi", color: "#C0C0C0" },
  { number: 27, name: "Nico Hulkenberg", team: "Audi", color: "#C0C0C0" },
  { number: 11, name: "Sergio Perez", team: "Cadillac", color: "#FF0000" },
  { number: 77, name: "Valtteri Bottas", team: "Cadillac", color: "#FF0000" },
  { number: 30, name: "Liam Lawson", team: "Racing Bulls", color: "#6692FF" },
  { number: 41, name: "Arvid Lindblad", team: "Racing Bulls", color: "#6692FF" },
];

function LiveIndicator() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const hour = now.getUTCHours();
  const isLive = hour >= 5 && hour <= 15;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: isLive ? "#39b54a" : "#666",
        boxShadow: isLive ? "0 0 6px #39b54a" : "none",
        animation: isLive ? "pulse 1.5s infinite" : "none",
      }} />
      <span style={{ fontSize: 10, letterSpacing: 2, color: isLive ? "#39b54a" : "#444" }}>
        {isLive ? "LIVE — AUTO REFRESH ON" : "OFFLINE — NEXT RACE: CHINESE GP MAR 15"}
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

export default function App() {
  const [driver1, setDriver1] = useState(DRIVERS[1]);
  const [driver2, setDriver2] = useState(DRIVERS[4]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="header-badge">2026 SEASON</span>
          <h1>F1 <span className="accent">Insight</span></h1>
          <p>Race Engineering Intelligence Platform</p>
          <LiveIndicator />
        </div>
        <div className="driver-selectors">
          <div className="selector-group">
            <label>DRIVER 1</label>
            <select
              style={{ borderColor: driver1.color }}
              value={driver1.number}
              onChange={e => setDriver1(DRIVERS.find(d => d.number === +e.target.value)!)}
            >
              {DRIVERS.map(d => (
                <option key={d.number} value={d.number}>#{d.number} {d.name}</option>
              ))}
            </select>
          </div>
          <div className="vs">VS</div>
          <div className="selector-group">
            <label>DRIVER 2</label>
            <select
              style={{ borderColor: driver2.color }}
              value={driver2.number}
              onChange={e => setDriver2(DRIVERS.find(d => d.number === +e.target.value)!)}
            >
              {DRIVERS.map(d => (
                <option key={d.number} value={d.number}>#{d.number} {d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <DriverComparison driver1={driver1} driver2={driver2} sessionKey={11234} />
    </div>
  );
}