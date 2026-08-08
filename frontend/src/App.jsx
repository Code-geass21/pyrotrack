import { useState, useEffect } from "react";
import DataGrid from "./components/DataGrid";
import LiquidTank from "./components/LiquidTank";
import DeliveryTracker from "./components/DeliveryTracker";
import AuditLogViewer from "./components/AuditLogViewer";
import Insights from "./components/Insights";
import Auth from "./components/Auth";

export default function App() {
  const [token, setTokenState] = useState(localStorage.getItem("pyro_token"));
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

  const setToken = (newToken) => {
    if (newToken) localStorage.setItem("pyro_token", newToken);
    else localStorage.removeItem("pyro_token");
    setTokenState(newToken);
  };

  const fetchEntries = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/v1/entries", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.status === 401) { setToken(null); return; }
      if (!res.ok) throw new Error(`API returned status: ${res.status}`);
      const data = await res.json();
      setEntries(data);
      setError(null);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { fetchEntries(); }, [token]);

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!window.confirm("🚨 WARNING: This will overwrite your current database. Proceed?")) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setIsRebooting(true);
      const res = await fetch("/api/v1/restore", { method: "POST", body: formData });
      if (res.ok) setTimeout(() => { window.location.reload(); }, 5000);
      else { setIsRebooting(false); alert("Failed to restore backup."); }
    } catch (err) { setIsRebooting(false); alert("Error: " + err.message); }
  };

  if (!token) return <Auth setToken={setToken} />;

  return (
    <div className="min-h-screen bg-[#080C10] p-8 text-white font-sans selection:bg-[#00D4FF] selection:text-black relative">
      {isRebooting && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-black text-[#00D4FF] tracking-widest">RESTORING VAULT</h2>
          <p className="text-slate-400 mt-2">Rebooting backend server. Please wait...</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#00D4FF] tracking-widest drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]">PYROTRACK</h1>
            <p className="text-slate-500 text-sm mt-1">Cooking Gas Intelligence & Logistics</p>
          </div>
          <div className="flex gap-3">
            <label className="text-xs font-bold bg-amber-500/10 text-amber-400 px-4 py-2 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-2 cursor-pointer">
              🔄 Restore Backup <input type="file" accept=".zip" className="hidden" onChange={handleRestore} />
            </label>
            <a href="/api/v1/backup" className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
              💾 Download Backup
            </a>
            <button onClick={() => setIsAuditOpen(true)} className="text-xs bg-slate-800 text-slate-300 px-4 py-2 rounded border border-slate-700 hover:border-slate-500 hover:text-white transition-colors">
              🛡️ View Audit Logs
            </button>
            <button onClick={() => setToken(null)} className="text-xs bg-red-500/10 text-red-400 px-4 py-2 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors">
              Log Out
            </button>
          </div>
        </header>

        {error && !isRebooting && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8"><strong>Connection Error:</strong> {error}</div>}

        <DeliveryTracker entries={entries} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-8">
          <div className="space-y-8">
            <LiquidTank entries={entries} />
          </div>
          <div>
            <DataGrid entries={entries} refreshData={fetchEntries} token={token} />
          </div>
        </div>

        <Insights entries={entries} />
      </div>
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} token={token} />
    </div>
  );
}
