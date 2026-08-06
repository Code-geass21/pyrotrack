import { motion } from 'framer-motion';
import { Truck, Package, Home, CheckCircle2 } from 'lucide-react';

export default function DeliveryTracker({ entries, refreshData }) {
  if (!entries || entries.length === 0) return null;

  // The most recent entry dictates the logistics status
  const latestOrder = entries[0];
  const isDelivered = !!latestOrder.received;
  const isConnected = !!latestOrder.started;

  // If the newest cylinder is already connected, we don't need to track delivery!
  if (isConnected) return null; 

  const handleMarkDelivered = async () => {
    try {
      const res = await fetch(`/api/v1/entries/${latestOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: new Date().toISOString().split('T')[0] })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error("Error updating delivery:", err);
    }
  };

  // Determine truck position (0% to 100%)
  const truckPosition = isDelivered ? "100%" : "50%";

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-[#0D1117] border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10 flex justify-between items-end mb-8">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            {isDelivered ? <CheckCircle2 className="text-[#00E5A0]" /> : <div className="w-2 h-2 rounded-full bg-[#FFB400] animate-ping" />}
            {isDelivered ? "DELIVERED & IN RESERVE" : "LIVE LOGISTICS TRACKER"}
          </h2>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Order placed: {new Date(latestOrder.ordered).toLocaleDateString()}
          </p>
        </div>

        {!isDelivered && (
          <button 
            onClick={handleMarkDelivered}
            className="bg-[#00E5A0]/10 text-[#00E5A0] px-4 py-2 rounded-lg border border-[#00E5A0]/30 hover:bg-[#00E5A0]/20 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]"
          >
            MARK AS DELIVERED
          </button>
        )}
      </div>

      {/* The Arcade Track */}
      <div className="relative w-full h-24 flex items-center">
        
        {/* The Road (Base Line) */}
        <div className="absolute left-6 right-6 h-1 bg-slate-800 rounded-full" />
        
        {/* Animated Progress Line */}
        <motion.div 
          className="absolute left-6 h-1 bg-gradient-to-r from-[#00D4FF] to-[#00E5A0] rounded-full shadow-[0_0_10px_#00D4FF]"
          initial={{ width: "0%" }}
          animate={{ width: `calc(${truckPosition} - 48px)` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Nodes */}
        <div className="absolute w-full flex justify-between px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#00D4FF] flex items-center justify-center shadow-[0_0_10px_#00D4FF]">
              <Package size={12} className="text-[#080C10]" />
            </div>
            <span className="text-xs font-mono text-slate-400">Ordered</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-700 ${!isDelivered ? 'bg-[#FFB400] shadow-[0_0_10px_#FFB400]' : 'bg-slate-800'}`}>
              <div className="w-2 h-2 rounded-full bg-[#080C10]" />
            </div>
            <span className="text-xs font-mono text-slate-400">In Transit</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-700 ${isDelivered ? 'bg-[#00E5A0] shadow-[0_0_10px_#00E5A0]' : 'bg-slate-800'}`}>
              <Home size={12} className={isDelivered ? "text-[#080C10]" : "text-slate-500"} />
            </div>
            <span className="text-xs font-mono text-slate-400">Arrived</span>
          </div>
        </div>

        {/* The Animated Truck */}
        <motion.div 
          className="absolute left-6 text-white drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]"
          initial={{ left: "0%" }}
          animate={{ 
            left: truckPosition,
            y: isDelivered ? 0 : [-2, 2, -2] // Bounces slightly if driving
          }}
          transition={{ 
            left: { duration: 1.5, ease: "easeInOut" },
            y: { repeat: isDelivered ? 0 : Infinity, duration: 0.5 }
          }}
          style={{ x: "-50%", y: "-50%", marginTop: "-16px" }}
        >
          <div className={`p-2 rounded-lg backdrop-blur-sm border ${isDelivered ? 'bg-[#00E5A0]/20 border-[#00E5A0]/50 text-[#00E5A0]' : 'bg-[#FFB400]/20 border-[#FFB400]/50 text-[#FFB400]'}`}>
             <Truck size={24} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
