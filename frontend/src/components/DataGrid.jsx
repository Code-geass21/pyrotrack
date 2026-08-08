import { useState } from "react";
import { motion } from "framer-motion";

export default function DataGrid({ entries, refreshData, token }) {
  const [orderDate, setOrderDate] = useState("");
  const [amount, setAmount] = useState("");
  const [commission, setCommission] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [infoRowId, setInfoRowId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionDates, setActionDates] = useState({});
  const today = new Date().toISOString().split('T')[0];

  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const handleNewOrder = async () => {
    if (!orderDate || !amount) return alert("Please fill in both the date and amount.");
    await fetch("/api/v1/entries", {
      method: "POST", headers,
      body: JSON.stringify({ ordered: orderDate, paid: parseFloat(amount), commission: parseFloat(commission) || 0 })
    });
    setOrderDate(""); setAmount(""); setCommission(""); refreshData();
  };

  const updateEntry = async (id, payload) => {
    await fetch(`/api/v1/entries/${id}`, { method: "PUT", headers, body: JSON.stringify(payload) });
    setEditRowId(null); setInfoRowId(null); refreshData();
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("WARNING: Permanently delete this cylinder record?")) return;
    await fetch(`/api/v1/entries/${id}`, { method: "DELETE", headers });
    setEditRowId(null); refreshData();
  };

  const uploadReceipt = async (id, file) => {
    const formData = new FormData(); formData.append("file", file);
    await fetch(`/api/v1/entries/${id}/receipt`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
    refreshData();
  };

  const startEditing = (entry) => {
    if (editRowId === entry.id) { setEditRowId(null); return; }
    setEditRowId(entry.id); setInfoRowId(null);
    setEditForm({ ordered: entry.ordered || "", paid: entry.paid || "", commission: entry.commission || 0, received: entry.received || "", started: entry.started || "", finished: entry.finished || "" });
  };

  const toggleInfo = (entry) => {
    if (infoRowId === entry.id) { setInfoRowId(null); return; }
    setInfoRowId(entry.id); setEditRowId(null);
    setEditForm({ brand: entry.brand || "", agency: entry.agency || "", cylinder_number: entry.cylinder_number || "", registered_name: entry.registered_name || "", agency_location: entry.agency_location || "", agency_number: entry.agency_number || "", delivery_boy_name: entry.delivery_boy_name || "", delivery_boy_number: entry.delivery_boy_number || "", notes: entry.notes || "" });
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 tracking-wide flex-shrink-0">CYLINDER LOG</h2>

      <div className="flex gap-3 mb-6 flex-shrink-0 flex-wrap">
        <input type="date" className="bg-slate-800 text-white p-2 rounded border border-slate-700 focus:outline-none focus:border-[#00D4FF]" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        <input type="number" placeholder="Cost (₹)" className="bg-slate-800 text-white p-2 rounded w-24 border border-slate-700 focus:outline-none focus:border-[#00D4FF]" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="number" placeholder="Tip/Comm (₹)" className="bg-slate-800 text-white p-2 rounded w-28 border border-slate-700 focus:outline-none focus:border-amber-400" value={commission} onChange={(e) => setCommission(e.target.value)} />
        <button onClick={handleNewOrder} className="bg-[#00D4FF] text-black px-5 py-2 rounded font-bold hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.4)]">SAVE</button>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[450px] border border-slate-800 rounded-lg bg-slate-950 flex-1">
        <table className="w-full text-left text-sm text-slate-300 relative">
          <thead className="text-[#00D4FF] border-b border-slate-700 bg-slate-900 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 w-32">Ordered</th>
              <th className="p-3">Financials</th>
              <th className="p-3">Receipt & Info</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isEditing = editRowId === entry.id;
              const isInfoOpen = infoRowId === entry.id;
              const currentActionDate = actionDates[entry.id] || today;

              let status = "In Transit"; let statusColor = "text-slate-400";
              if (entry.finished) { status = "Finished"; statusColor = "text-slate-500"; }
              else if (entry.started) { status = "Active Cylinder"; statusColor = "text-[#00D4FF] font-bold"; }
              else if (entry.received) { status = "In Reserve"; statusColor = "text-emerald-400"; }

              return (
                <React.Fragment key={entry.id}>
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${isEditing || isInfoOpen ? 'bg-slate-800/60' : ''}`}>
                    {isEditing ? (
                      <>
                        <td className="p-3 align-top">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Ordered</span>
                          <input type="date" value={editForm.ordered} onChange={e=>setEditForm({...editForm, ordered: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 mb-2 focus:border-[#00D4FF] outline-none" />
                        </td>
                        <td className="p-3 align-top">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Cost (₹)</span>
                          <input type="number" value={editForm.paid} onChange={e=>setEditForm({...editForm, paid: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 mb-2 focus:border-[#00D4FF] outline-none" />
                          <span className="text-[10px] uppercase font-bold text-amber-500">Comm/Tip (₹)</span>
                          <input type="number" value={editForm.commission} onChange={e=>setEditForm({...editForm, commission: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 focus:border-amber-400 outline-none" />
                        </td>
                        <td className="p-3 align-top" colSpan={2}>
                          <div className="grid grid-cols-3 gap-2">
                            <div><span className="text-[10px] uppercase font-bold text-slate-500">Received</span><input type="date" value={editForm.received} onChange={e=>setEditForm({...editForm, received: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 outline-none" /></div>
                            <div><span className="text-[10px] uppercase font-bold text-slate-500">Connected</span><input type="date" value={editForm.started} onChange={e=>setEditForm({...editForm, started: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 outline-none" /></div>
                            <div><span className="text-[10px] uppercase font-bold text-slate-500">Empty</span><input type="date" value={editForm.finished} onChange={e=>setEditForm({...editForm, finished: e.target.value})} className="bg-[#080C10] text-xs p-1.5 rounded w-full border border-slate-700 outline-none" /></div>
                          </div>
                        </td>
                        <td className="p-3 align-top flex flex-col gap-2">
                          <button onClick={()=>updateEntry(entry.id, editForm)} className="bg-emerald-500 text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-400">Save</button>
                          <button onClick={()=>setEditRowId(null)} className="bg-slate-700 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-600">Cancel</button>
                          <button onClick={()=>deleteEntry(entry.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded text-xs hover:bg-red-500/20">Delete</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 flex items-center gap-2">
                          <button onClick={()=>startEditing(entry)} title="Edit Row" className="text-slate-500 hover:text-[#00D4FF] bg-[#080C10] px-2 py-1 rounded text-xs border border-slate-800">✎</button>
                          {entry.ordered}
                        </td>
                        <td className="p-3">
                          <div className="font-bold">₹{entry.paid}</div>
                          {entry.commission > 0 && <div className="text-[10px] text-amber-500">Tip: ₹{entry.commission}</div>}
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          {entry.receipt_path ? (
                            <a href={entry.receipt_path} target="_blank" rel="noreferrer" className="text-[10px] font-bold bg-[#00D4FF]/10 text-[#00D4FF] px-2 py-1 rounded border border-[#00D4FF]/30 hover:bg-[#00D4FF]/20"> REC</a>
                          ) : (
                            <label className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 hover:text-white cursor-pointer">
                               ADD <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if(e.target.files[0]) uploadReceipt(entry.id, e.target.files[0]); }} />
                            </label>
                          )}
                          <button onClick={()=>toggleInfo(entry)} className="text-[10px] font-bold bg-slate-700 px-2 py-1 rounded text-slate-300 hover:text-white">📄 DATA</button>
                        </td>
                        <td className={`p-3 ${statusColor}`}>{status}</td>
                        <td className="p-3">
                          {!entry.finished && (
                            <div className="flex gap-2 items-center bg-[#080C10] p-1.5 rounded-lg border border-slate-800 w-max">
                              <input type="date" value={currentActionDate} onChange={(e)=> setActionDates({...actionDates, [entry.id]: e.target.value})} className="bg-transparent text-xs p-1 rounded text-slate-400 outline-none cursor-pointer" />
                              {!entry.received && <button onClick={() => updateEntry(entry.id, { received: currentActionDate })} className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/20">Mark Received</button>}
                              {entry.received && !entry.started && <button onClick={() => updateEntry(entry.id, { started: currentActionDate })} className="text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded border border-amber-500/20">Connect Tank</button>}
                              {entry.started && !entry.finished && <button onClick={() => updateEntry(entry.id, { finished: currentActionDate })} className="text-[10px] font-bold uppercase bg-red-500/10 text-red-400 px-3 py-1.5 rounded border border-red-500/20">Mark Empty</button>}
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </motion.tr>

                  {/* FEATURE 2: METADATA EXPANDABLE ROW */}
                  {isInfoOpen && (
                    <tr className="bg-[#0a0f16]">
                      <td colSpan={5} className="p-6 border-b border-slate-800/80">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Brand</span><input type="text" value={editForm.brand} onChange={e=>setEditForm({...editForm, brand: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Agency</span><input type="text" value={editForm.agency} onChange={e=>setEditForm({...editForm, agency: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Cylinder #</span><input type="text" value={editForm.cylinder_number} onChange={e=>setEditForm({...editForm, cylinder_number: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Registered Name</span><input type="text" value={editForm.registered_name} onChange={e=>setEditForm({...editForm, registered_name: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Agency Location</span><input type="text" value={editForm.agency_location} onChange={e=>setEditForm({...editForm, agency_location: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Agency Number</span><input type="text" value={editForm.agency_number} onChange={e=>setEditForm({...editForm, agency_number: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Delivery Boy</span><input type="text" value={editForm.delivery_boy_name} onChange={e=>setEditForm({...editForm, delivery_boy_name: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Delivery Boy #</span><input type="text" value={editForm.delivery_boy_number} onChange={e=>setEditForm({...editForm, delivery_boy_number: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                          <div><span className="text-[10px] uppercase font-bold text-slate-500">Notes / Remarks</span><input type="text" value={editForm.notes} onChange={e=>setEditForm({...editForm, notes: e.target.value})} className="bg-[#080C10] text-xs p-2 rounded w-full border border-slate-700 outline-none mt-1" /></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>updateEntry(entry.id, editForm)} className="bg-[#00D4FF] text-black px-4 py-2 rounded text-xs font-bold hover:bg-cyan-400">Save Data</button>
                          <button onClick={()=>setInfoRowId(null)} className="bg-slate-800 text-white px-4 py-2 rounded text-xs hover:bg-slate-700">Close</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
