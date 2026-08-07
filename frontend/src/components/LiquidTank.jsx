import { motion } from "framer-motion";

export default function LiquidTank({ entries }) {
  // 1. Calculate Historical Average (Days)
  const finishedCylinders = entries.filter(e => e.started && e.finished);
  let totalDays = 0;
  finishedCylinders.forEach(e => {
    const start = new Date(e.started);
    const end = new Date(e.finished);
    totalDays += (end - start) / (1000 * 60 * 60 * 24);
  });

  // BUGFIX: Prevent 0-day averages during rapid testing from crashing the app
  let historicalAvg = 60; // Default to 60 days
  if (finishedCylinders.length > 0) {
    const calculatedAvg = Math.round(totalDays / finishedCylinders.length);
    historicalAvg = calculatedAvg > 0 ? calculatedAvg : 60;
  }

  // 2. Find Active Cylinder
  const activeCylinder = entries.find(e => e.started && !e.finished);
  let daysUsed = 0;
  let percentage = 0;

  if (activeCylinder) {
    const start = new Date(activeCylinder.started);
    const today = new Date();
    daysUsed = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
    percentage = Math.max(0, 100 - Math.round((daysUsed / historicalAvg) * 100));
  }

  // Color changes from Neon Cyan to Warning Pink/Red when gas runs low
  const liquidColor = percentage > 25 ? "#00D4FF" : "#FF3366"; 

  return (
    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl flex flex-col items-center">
      <h2 className="text-xl font-bold text-white mb-2 tracking-wide">ACTIVE CYLINDER</h2>
      
      {/* Dynamic Status Text */}
      <p className="text-slate-400 text-sm mb-8 h-4">
        {activeCylinder 
          ? `${daysUsed} days used (Avg: ${historicalAvg} days)` 
          : "No active cylinder currently connected."}
      </p>

      {/* THE TANK HARDWARE */}
      <div className="relative w-48 h-64 border-4 border-slate-700 rounded-t-[100px] rounded-b-3xl overflow-hidden bg-[#0a0f16] shadow-[0_0_30px_rgba(0,0,0,0.8)_inset]">
        
        {/* THE LIQUID FILL */}
        <motion.div
          className="absolute bottom-0 w-full opacity-90"
          style={{ backgroundColor: liquidColor, filter: "drop-shadow(0 -5px 15px currentColor)" }}
          initial={{ height: 0 }}
          animate={{ height: `${activeCylinder ? percentage : 0}%` }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
        >
          {/* Sloshing Wave Layer 1 */}
          <motion.div
            className="absolute -top-4 w-[200%] h-8 opacity-40 rounded-[100%]"
            style={{ backgroundColor: liquidColor }}
            animate={{ x: ["-25%", "0%"] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatType: "mirror" }}
          />
          {/* Sloshing Wave Layer 2 */}
          <motion.div
            className="absolute -top-3 w-[200%] h-6 opacity-60 rounded-[100%]"
            style={{ backgroundColor: liquidColor }}
            animate={{ x: ["0%", "-25%"] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatType: "mirror" }}
          />
        </motion.div>

        {/* PERCENTAGE OVERLAY */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl font-black text-white mix-blend-overlay drop-shadow-md">
            {activeCylinder ? `${percentage}%` : "0%"}
          </span>
        </div>
      </div>
    </div>
  );
}
