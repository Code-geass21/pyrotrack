import { useState, useEffect } from "react";
import DataGrid from "./components/DataGrid";
import LiquidTank from "./components/LiquidTank";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/v1/entries");
      if (!res.ok) throw new Error(`API returned status: ${res.status}`);
      const data = await res.json();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-[#080C10] p-8 text-white font-sans selection:bg-[#00D4FF] selection:text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10">
          <h1 className="text-3xl font-black text-[#00D4FF] tracking-widest drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]">
            PYROTRACK
          </h1>
          <p className="text-slate-500 text-sm mt-1">Cooking Gas Intelligence & Logistics</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">
            <strong>Backend Connection Failed:</strong> {error}
          </div>
        )}

        {/* DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8">
          
          {/* LEFT COLUMN: Animated Visuals */}
          <div className="space-y-8">
            <LiquidTank entries={entries} />
          </div>

          {/* RIGHT COLUMN: Data Grid */}
          <div>
            <DataGrid entries={entries} refreshData={fetchEntries} />
          </div>

        </div>
      </div>
    </div>
  );
}
