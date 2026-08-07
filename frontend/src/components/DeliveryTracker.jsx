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

        {/* The Animated SVG Truck */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2 z-20 text-[#00D4FF] drop-shadow-[0_0_10px_rgba(0,212,255,0.8)]"
          initial={{ left: "5%" }}
          animate={{ left: "85%" }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          {/* Using a pure SVG that naturally faces right! No CSS flipping required. */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
