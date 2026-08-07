import { useState } from "react";
import { motion } from "framer-motion";

export default function DataGrid({ entries, refreshData }) {
  const [orderDate, setOrderDate] = useState("");
  const [amount, setAmount] = useState("");

  // Track row editing
  const [editRowId, setEditRowId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Track action dates (so you can backdate "Mark Empty", etc.)
  const [actionDates, setActionDates] = useState({});
  const today = new Date().toISOString().split('T')[0];

  const handleNewOrder = async () => {
    if (!orderDate || !amount) return alert("Please fill in both the date and amount.");
    await fetch("/api/v1/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered: orderDate, paid: parseFloat(amount) })
    });
    setOrderDate("");
    setAmount("");
    refreshData();
  };

  const updateEntry = async (id, payload) => {
    await fetch(`/api/v1/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setEditRowId(null);
    refreshData();
  };

  const startEditing = (entry) => {
    setEditRowId(entry.id);
    setEditForm({
      ordered: entry.ordered || "",
      paid: entry.paid || "",
      received: entry.received || "",
      started: entry.started || "",
      finished: entry.finished || ""
    });
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6 tracking-wide">CYLINDER LOG</h2>

      <div className="flex gap-3 mb-8">
        <input type="date" className="bg-slate-800 text-white p-2 rounded border border-slate-700 focus:outline-none focus:border-[#00D4FF]" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        <input type="number" placeholder="Cost (₹)" className="bg-slate-800 text-white p-2 rounded w-28 border border-slate-700 focus:outline-none focus:border-[#00D4FF]" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={handleNewOrder} className="bg-[#00D4FF] text-black px-5 py-2 rounded font-bold hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.4)]">SAVE</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-[#00D4FF] border-b border-slate-700">
            <tr>
              <th className="pb-3 w-32">Ordered</th>
              <th className="pb-3">Cost</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isEditing = editRowId === entry.id;
              const currentActionDate = actionDates[entry.id] || today;
              
              let status = "In Transit"; let statusColor = "text-slate-400";
              if (entry.finished) { status = "Finished"; statusColor = "text-slate-500"; } 
              else if (entry.started) { status = "Active Cylinder"; statusColor = "text-[#00D4FF] font-bold"; } 
              else if (entry.received) { status = "In Reserve"; statusColor = "text-emerald-400"; }

              return (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  
                  {isEditing ? (
                    /* ─── FULL ROW EDIT MODE ─── */
                    <>
                      <td className="py-3 pr-2 align-top">
                        <span className="text-xs text-slate-500">Ordered</span>
                        <input type="date" value={editForm.ordered} onChange={e=>setEditForm({...editForm, ordered: e.target.value})} className="bg-slate-950 text-xs p-1.5 rounded w-full border border-slate-700 mb-2" />
                        <span className="text-xs text-slate-500">Cost (₹)</span>
                        <input type="number" value={editForm.paid} onChange={e=>setEditForm({...editForm, paid: e.target.value})} className="bg-slate-950 text-xs p-1.5 rounded w-full border border-slate-700" />
                      </td>
                      <td className="py-3 pr-2 align-top" colSpan={2}>
                        <span className="text-xs text-slate-500">Received</span>
                        <input type="date" value={editForm.received} onChange={e=>setEditForm({...editForm, received: e.target.value})} className="bg-slate-950 text-xs p-1.5 rounded w-full border border-slate-700 mb-2" />
                        <span className="text-xs text-slate-500">Connected</span>
                        <input type="date" value={editForm.started} onChange={e=>setEditForm({...editForm, started: e.target.value})} className="bg-slate-950 text-xs p-1.5 rounded w-full border border-slate-700 mb-2" />
                        <span className="text-xs text-slate-500">Empty</span>
                        <input type="date" value={editForm.finished} onChange={e=>setEditForm({...editForm, finished: e.target.value})} className="bg-slate-950 text-xs p-1.5 rounded w-full border border-slate-700" />
                      </td>
                      <td className="py-3 align-top flex flex-col gap-2">
                        <button onClick={()=>updateEntry(entry.id, editForm)} className="bg-emerald-500 text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-400">Save</button>
                        <button onClick={()=>setEditRowId(null)} className="bg-slate-700 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-600">Cancel</button>
                      </td>
                    </>
                  ) : (
                    /* ─── NORMAL READ-ONLY ROW ─── */
                    <>
                      <td className="py-4 flex items-center gap-2">
                        <button onClick={()=>startEditing(entry)} title="Edit all dates/costs" className="text-slate-500 hover:text-[#00D4FF] bg-slate-800 px-2 py-1 rounded text-xs">✎</button>
                        {entry.ordered}
                      </td>
                      <td className="py-4">₹{entry.paid}</td>
                      <td className={`py-4 ${statusColor}`}>{status}</td>
                      <td className="py-4">
                        {!entry.finished && (
                          <div className="flex gap-2 items-center bg-slate-950 p-1.5 rounded-lg border border-slate-800 w-max">
                            {/* MINI DATE PICKER FOR QUICK ACTIONS */}
                            <input 
                              type="date" 
                              title="Action Date"
                              value={currentActionDate} 
                              onChange={(e)=> setActionDates({...actionDates, [entry.id]: e.target.value})} 
                              className="bg-transparent text-xs p-1 rounded text-slate-400 outline-none cursor-pointer" 
                            />
                            {/* DYNAMIC ACTION BUTTON */}
                            {!entry.received && (
                              <button onClick={() => updateEntry(entry.id, { received: currentActionDate })} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/20 border border-emerald-500/20">Mark Received</button>
                            )}
                            {entry.received && !entry.started && (
                              <button onClick={() => updateEntry(entry.id, { started: currentActionDate })} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded hover:bg-amber-500/20 border border-amber-500/20">Connect Tank</button>
                            )}
                            {entry.started && !entry.finished && (
                              <button onClick={() => updateEntry(entry.id, { finished: currentActionDate })} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded hover:bg-red-500/20 border border-red-500/20">Mark Empty</button>
                            )}
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
