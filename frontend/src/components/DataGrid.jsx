import { useState } from "react";
import { motion } from "framer-motion";

export default function DataGrid({ entries, refreshData }) {
  const [orderDate, setOrderDate] = useState("");
  const [amount, setAmount] = useState("");

  // ─── CREATE NEW ORDER (POST) ─────────────────────────────
  const handleNewOrder = async () => {
    if (!orderDate || !amount) return alert("Please fill in both the date and amount.");
    
    await fetch("/api/v1/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ordered: orderDate, 
        paid: parseFloat(amount) 
      })
    });
    
    setOrderDate("");
    setAmount("");
    refreshData(); // Instantly refresh the UI
  };

  // ─── UPDATE STATUS (PUT) ─────────────────────────────────
  const updateEntry = async (id, payload) => {
    await fetch(`/api/v1/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    refreshData();
  };

  // Get today's date in YYYY-MM-DD format for quick status updates
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6 tracking-wide">CYLINDER LOG</h2>

      {/* NEW ORDER FORM */}
      <div className="flex gap-3 mb-8">
        <input 
          type="date" 
          className="bg-slate-800 text-white p-2 rounded border border-slate-700 focus:outline-none focus:border-[#00D4FF]" 
          value={orderDate} 
          onChange={(e) => setOrderDate(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Cost (₹)" 
          className="bg-slate-800 text-white p-2 rounded w-28 border border-slate-700 focus:outline-none focus:border-[#00D4FF]" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
        />
        <button 
          onClick={handleNewOrder} 
          className="bg-[#00D4FF] text-black px-5 py-2 rounded font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.4)]"
        >
          SAVE
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-[#00D4FF] border-b border-slate-700">
            <tr>
              <th className="pb-3">Ordered</th>
              <th className="pb-3">Cost</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-500 italic">No cylinders logged yet.</td>
              </tr>
            )}
            {entries.map(entry => {
              // Determine logic state based on dates
              let status = "In Transit";
              let statusColor = "text-slate-400";
              
              if (entry.finished) {
                status = "Finished";
                statusColor = "text-slate-500";
              } else if (entry.started) {
                status = "Active Cylinder";
                statusColor = "text-[#00D4FF] font-bold";
              } else if (entry.received) {
                status = "In Reserve";
                statusColor = "text-emerald-400";
              }

              return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  key={entry.id} 
                  className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-4">{entry.ordered}</td>
                  <td className="py-4">₹{entry.paid}</td>
                  <td className={`py-4 ${statusColor}`}>{status}</td>
                  <td className="py-4 flex gap-2">
                    {!entry.received && (
                      <button onClick={() => updateEntry(entry.id, { received: today })} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/20 border border-emerald-500/20 transition">
                        Mark Received
                      </button>
                    )}
                    {entry.received && !entry.started && (
                      <button onClick={() => updateEntry(entry.id, { started: today })} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded hover:bg-amber-500/20 border border-amber-500/20 transition">
                        Connect Tank
                      </button>
                    )}
                    {entry.started && !entry.finished && (
                      <button onClick={() => updateEntry(entry.id, { finished: today })} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded hover:bg-red-500/20 border border-red-500/20 transition">
                        Mark Empty
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
