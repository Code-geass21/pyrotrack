import { motion } from "framer-motion";

export default function LiquidTank({ entries }) {
  const finishedCylinders = entries.filter(e => e.started && e.finished);
  let totalDays = 0;
  finishedCylinders.forEach(e => {
    const start = new Date(e.started);
    const end = new Date(e.finished);
    totalDays += (end - start) / (1000 * 60 * 60 * 24);
  });

  let historicalAvg = 60;
  if (finishedCylinders.length > 0) {
    const calculatedAvg = Math.round(totalDays / finishedCylinders.length);
    historicalAvg = calculatedAvg > 0 ? calculatedAvg : 60;
  }

  const activeCylinder = entries.find(e => e.started && !e.finished);
  let daysUsed = 0;
  let percentage = 0;

  if (activeCylinder) {
    const start = new Date(activeCylinder.started);
    const today = new Date();
    daysUsed = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
    percentage = Math.max(0, 100 - Math.round((daysUsed / historicalAvg) * 100));
  }

  const liquidColor = percentage > 25 ? "#00D4FF" : "#FF3366"; 

  return (
    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold text-white mb-2 tracking-wide">ACTIVE CYLINDER</h2>
      <p className="text-slate-400 text-sm mb-8 h-4">
        {activeCylinder 
          ? `${daysUsed} days used (Avg: ${historicalAvg} days)` 
          : "No active cylinder currently connected."}
      </p>

      {/* 🇮🇳 AUTHENTIC INDIAN LPG CYLINDER SHAPE */}
      <div className="flex flex-col items-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        
        {/* 1. Top Guard Ring (Handle) */}
        <div className="w-24 h-5 border-4 border-slate-700 rounded-full mb-[-4px] z-10 bg-[#080C10]"></div>
        
        {/* 2. Vertical Support Plates (Neck) */}
        <div className="flex justify-between w-16 mb-[-4px] z-10 px-1">
          <div className="w-1.5 h-5 bg-slate-700 rounded-sm"></div>
          <div className="w-1.5 h-5 bg-slate-700 rounded-sm"></div>
          <div className="w-1.5 h-5 bg-slate-700 rounded-sm"></div>
        </div>

        {/* 3. Main Domed Body */}
        <div className="relative w-48 h-56 border-4 border-slate-700 rounded-[80px_80px_20px_20px] overflow-hidden bg-[#0a0f16] shadow-[0_0_30px_rgba(0,0,0,0.8)_inset]">
          
          {/* The Liquid Fill */}
          <motion.div
            className="absolute bottom-0 w-full opacity-90"
            style={{ backgroundColor: liquidColor, filter: "drop-shadow(0 -5px 15px currentColor)" }}
            initial={{ height: 0 }}
            animate={{ height: `${activeCylinder ? percentage : 0}%` }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
          >
            <motion.div className="absolute -top-4 w-[200%] h-8 opacity-40 rounded-[100%]" style={{ backgroundColor: liquidColor }} animate={{ x: ["-25%", "0%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatType: "mirror" }} />
            <motion.div className="absolute -top-3 w-[200%] h-6 opacity-60 rounded-[100%]" style={{ backgroundColor: liquidColor }} animate={{ x: ["0%", "-25%"] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatType: "mirror" }} />
          </motion.div>

          {/* Overlay % */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-white mix-blend-overlay drop-shadow-md">
              {activeCylinder ? `${percentage}%` : "0%"}
            </span>
          </div>
        </div>

        {/* 4. Base Foot Ring */}
        <div className="w-32 h-4 border-4 border-slate-700 border-t-0 rounded-b-xl mt-[-4px]"></div>
      </div>
    </div>
  );
}
