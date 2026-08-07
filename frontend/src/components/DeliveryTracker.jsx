import { motion } from "framer-motion";

export default function DeliveryTracker({ entries }) {
  const inTransit = entries.find(e => e.ordered && !e.received);
  
  if (!inTransit) return null;

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00D4FF] via-transparent to-transparent"></div>
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-[#00D4FF] font-black tracking-widest text-sm">INBOUND DELIVERY TRACKER</h2>
        <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
          Ordered: {inTransit.ordered}
        </span>
      </div>

      <div className="relative h-16 flex items-center justify-between mt-4">
        {/* The Road */}
        <div className="absolute w-full h-1 bg-slate-800 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-600 rounded"></div>
        
        {/* Checkpoints */}
        <div className="z-10 flex flex-col items-center bg-slate-900 px-2">
          <div className="w-3 h-3 bg-[#00D4FF] rounded-full shadow-[0_0_10px_#00D4FF]"></div>
          <span className="text-[10px] text-slate-400 mt-2 font-bold">DISPATCHED</span>
        </div>
        <div className="z-10 flex flex-col items-center bg-slate-900 px-2">
          <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
          <span className="text-[10px] text-slate-500 mt-2 font-bold">ARRIVING</span>
        </div>

        {/* The Animated Retro Truck */}
        <motion.div 
          className="absolute text-4xl top-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(0,212,255,0.3)]"
          initial={{ left: "5%" }}
          animate={{ left: "85%" }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          {/* Flipped the emoji to face right using scale-x-[-1] */}
          <span className="inline-block scale-x-[-1]">🚚</span>
        </motion.div>
      </div>
    </div>
  );
}
