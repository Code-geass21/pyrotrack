import { useState } from 'react';
import { CheckCircle2, PlayCircle, Plus } from 'lucide-react';

export default function DataGrid({ entries, refreshData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ ordered: '', paid: 0 });

  const handleUpdate = async (id, updatePayload) => {
    try {
      const res = await fetch(`/api/v1/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordered: newEntry.ordered || new Date().toISOString().split('T')[0],
          paid: parseFloat(newEntry.paid),
          received: null, 
          commission: 0,
        })
      });
      if (res.ok) {
        setIsAdding(false);
        refreshData();
      }
    } catch (err) {
      console.error("Failed to add:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h2 className="text-lg font-bold text-white tracking-wide">CYLINDER LOG</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-[#00D4FF]/10 text-[#00D4FF] px-4 py-2 rounded-lg border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20 transition-colors text-sm font-mono"
        >
          <Plus size={16} /> NEW ORDER
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-900 border-b border-slate-800 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-mono text-slate-400 mb-1">Order Date</label>
            <input 
              type="date" 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4FF]"
              onChange={e => setNewEntry({...newEntry, ordered: e.target.value})}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-mono text-slate-400 mb-1">Amount Paid (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 950"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00D4FF]"
              onChange={e => setNewEntry({...newEntry, paid: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="bg-[#00E5A0]/20 text-[#00E5A0] px-6 py-2 rounded-lg border border-[#00E5A0]/30 hover:bg-[#00E5A0]/30 transition-colors text-sm font-bold">
            SAVE
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/50 text-slate-400 font-mono text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Ordered</th>
              <th className="px-6 py-4">Cost (₹)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 text-slate-300">
                  {entry.ordered ? new Date(entry.ordered).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-[#00D4FF] font-mono">
                  {entry.paid ? `₹${entry.paid}` : '—'}
                </td>
                <td className="px-6 py-4">
                  {entry.finished ? (
                    <span className="text-slate-500 bg-slate-800 px-2 py-1 rounded text-xs">Finished</span>
                  ) : entry.started ? (
                    <span className="text-[#00E5A0] bg-[#00E5A0]/10 px-2 py-1 rounded text-xs animate-pulse">Active</span>
                  ) : (
                    <span className="text-[#FFB400] bg-[#FFB400]/10 px-2 py-1 rounded text-xs">In Reserve</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {!entry.started && (
                    <button 
                      onClick={() => handleUpdate(entry.id, { started: new Date().toISOString().split('T')[0] })}
                      className="text-xs flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <PlayCircle size={14} className="text-[#00E5A0]" /> Connect
                    </button>
                  )}
                  {entry.started && !entry.finished && (
                    <button 
                      onClick={() => handleUpdate(entry.id, { finished: new Date().toISOString().split('T')[0] })}
                      className="text-xs flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <CheckCircle2 size={14} className="text-[#FF5C5C]" /> Empty
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
