import { useState, useEffect } from "react";
import DataGrid from "./components/DataGrid";
import LiquidTank from "./components/LiquidTank";
import DeliveryTracker from "./components/DeliveryTracker";
import AuditLogViewer from "./components/AuditLogViewer";
import Insights from "./components/Insights";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

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
        
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#00D4FF] tracking-widest drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]">
              PYROTRACK
            </h1>
            <p className="text-slate-500 text-sm mt-1">Cooking Gas Intelligence & Logistics</p>
          </div>
          
          <div className="flex gap-3">
            {/* 🗄️ NEW: SECURE VAULT BACKUP BUTTON */}
            <a 
              href="/api/v1/backup"
              className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
            >
              🗄️ Download Backup
            </a>
            <button 
              onClick={() => setIsAuditOpen(true)}
              className="text-xs bg-slate-800 text-slate-300 px-4 py-2 rounded border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
            >
              🛡️ View Audit Logs
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">
            <strong>Backend Connection Failed:</strong> {error}
          </div>
        )}

        <DeliveryTracker entries={entries} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8">
          <div className="space-y-8">
            <LiquidTank entries={entries} />
          </div>
          <div>
            <DataGrid entries={entries} refreshData={fetchEntries} />
          </div>
        </div>

        <Insights entries={entries} />

      </div>
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
