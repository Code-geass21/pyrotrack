import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditLogViewer({ isOpen, onClose, token }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isOpen && token) {
      fetch("/api/v1/audit", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then(data => {
        // Ensure data is an array before trying to map it
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
        }
      })
      .catch(err => {
        console.error("Audit log error:", err);
        setLogs([]);
      });
    }
  }, [isOpen, token]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          
          {/* Sliding Drawer */}
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-black text-[#00D4FF] tracking-wide">SYSTEM AUDIT LOG</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {logs.length === 0 && <p className="text-slate-500 italic text-center">No audit logs found.</p>}
              
              {logs.map(log => {
                let badgeColor = "bg-slate-700 text-white";
                if (log.action === "CREATE") badgeColor = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                if (log.action === "UPDATE") badgeColor = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
                if (log.action === "DELETE") badgeColor = "bg-red-500/20 text-red-400 border border-red-500/30";

                return (
                  <div key={log.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase ${badgeColor}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Target ID: {log.entry_id}</p>
                    <pre className="text-[10px] text-slate-300 bg-[#080C10] p-2 rounded overflow-x-auto border border-slate-800">
                      {JSON.stringify(JSON.parse(log.details), null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
