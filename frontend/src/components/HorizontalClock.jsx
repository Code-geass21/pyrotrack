import React, { useState, useEffect } from "react";

export default function HorizontalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const istTime = currentTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <div className="flex items-center drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]" title="Indian Standard Time">
      {/* 1. Base Foot Ring (Left side) */}
      <div className="w-2 h-7 border-2 border-slate-700 border-r-0 rounded-l-md bg-[#080C10] z-10"></div>
      
      {/* 2. Main Horizontal Body */}
      <div className="h-10 bg-[#0a0f16] border-2 border-slate-700 rounded-[10px_20px_20px_10px] flex items-center justify-center px-4 relative overflow-hidden z-20 shadow-[0_0_15px_rgba(0,0,0,0.8)_inset]">
        <span className="text-xs font-black text-[#00D4FF] tracking-widest z-10 drop-shadow-md">
          {istTime} IST
        </span>
      </div>

      {/* 3. Neck Support (Right side) */}
      <div className="flex flex-col justify-between h-4 w-2 z-10 -ml-[2px] bg-[#080C10]">
        <div className="w-full h-[2px] bg-slate-700"></div>
        <div className="w-full h-[2px] bg-slate-700"></div>
      </div>
      
      {/* 4. Top Guard Ring / Valve (Far Right) */}
      <div className="w-3 h-7 border-2 border-slate-700 border-l-0 rounded-r-full bg-[#080C10] z-10 -ml-[2px]"></div>
    </div>
  );
}
