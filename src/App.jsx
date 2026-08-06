import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataGrid from './components/DataGrid';
import DeliveryTracker from './components/DeliveryTracker';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = () => {
    fetch('/api/v1/entries')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#00D4FF] animate-pulse bg-[#080C10]">Igniting Burners...</div>;

  const activeEntry = entries.find(e => e.started && !e.finished);
  const finishedEntries = entries.filter(e => e.started && e.finished);
  const avgDays = finishedEntries.length > 0 
    ? finishedEntries.reduce((acc, curr) => acc + ((new Date(curr.finished) - new Date(curr.started)) / (1000 * 60 * 60 * 24)), 0) / finishedEntries.length
    : 60; 

  const daysUsed = activeEntry 
    ? Math.floor((new Date() - new Date(activeEntry.started)) / (1000 * 60 * 60 * 24))
    : 0;

  const pctRemaining = Math.max(0, Math.min(100, 100 - (daysUsed / avgDays) * 100));
  const getGasColor = (pct) => {
    if (pct > 40) return '#00E5A0'; 
    if (pct > 15) return '#FFB400'; 
    return '#FF5C5C';              
  };
  const currentColor = getGasColor(pctRemaining);

  return (
    <div className="min-h-screen bg-[#080C10] text-[#E8EDF2] p-8 font-sans selection:bg-[#00D4FF]/30 pb-20">
      
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF] animate-pulse" />
          PYROTRACK
        </h1>
        <div className="text-sm font-mono text-slate-400">
          Historical Avg: <span className="text-white">{avgDays.toFixed(0)} days</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center mb-8">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-56 h-[400px] bg-slate-900/50 rounded-[40px] p-4 border border-slate-800 shadow-2xl flex flex-col items-center">
            <div className="absolute -top-6 w-16 h-8 bg-slate-700 rounded-t-lg border-b-4 border-slate-900" />
            <div className="relative w-full h-full border-4 border-slate-800 rounded-[28px] overflow-hidden bg-slate-950 flex flex-col justify-end">
              <motion.div
                className="w-full relative origin-bottom"
                initial={{ height: '0%' }}
                animate={{ height: `${pctRemaining}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ backgroundColor: currentColor, boxShadow: `0 -10px 40px ${currentColor}40` }}
              >
                <motion.div 
                  className="absolute -top-3 left-[-10%] right-[-10%] h-6 bg-white/20 rounded-[50%]"
                  animate={{ x: ['-5%', '5%', '-5%'], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                />
              </motion.div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                <span className="text-5xl font-black text-white mix-blend-overlay">
                  {pctRemaining.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-400 font-mono text-sm uppercase tracking-wider mb-2">Active Cylinder</h2>
            <div className="text-4xl font-bold text-white mb-1">{daysUsed} <span className="text-xl text-slate-500 font-normal">days used</span></div>
            <p className="text-sm text-slate-400">Connected on: {activeEntry ? new Date(activeEntry.started).toLocaleDateString() : 'N/A'}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-400 font-mono text-sm uppercase tracking-wider mb-2">Burn Rate Prediction</h2>
            <div className="text-2xl font-bold text-white mb-2">
              ~{Math.max(0, Math.round(avgDays - daysUsed))} <span className="text-lg text-slate-500 font-normal">days remaining</span>
            </div>
            {pctRemaining < 20 ? (
              <div className="text-sm text-[#FF5C5C] bg-[#FF5C5C]/10 py-2 px-3 rounded-lg border border-[#FF5C5C]/20">
                ⚠️ Warning: Gas running critically low. Book a refill soon!
              </div>
            ) : (
              <div className="text-sm text-[#00E5A0] bg-[#00E5A0]/10 py-2 px-3 rounded-lg border border-[#00E5A0]/20">
                ✓ Usage is tracking normally against your average.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* The Animated Truck Logistics! */}
      <DeliveryTracker entries={entries} refreshData={fetchEntries} />

      <DataGrid entries={entries} refreshData={fetchEntries} />
      
    </div>
  );
}
