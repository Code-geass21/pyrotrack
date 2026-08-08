import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountSettings({ isOpen, onClose, token, setToken }) {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {};
    if (newUsername.trim()) payload.username = newUsername.trim();
    if (newPassword.trim()) payload.password = newPassword.trim();

    if (Object.keys(payload).length === 0) {
      setError("Please fill out at least one field to update.");
      return;
    }

    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update credentials");
      }

      setSuccess("Account updated successfully! Please log in again with your new credentials.");
      
      // Force user to log in again to receive a fresh JWT and clear old state
      setTimeout(() => {
        setToken(null);
        onClose();
      }, 3000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }} 
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }} 
            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 w-full max-w-sm bg-slate-900 border border-slate-700 shadow-2xl z-50 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-black text-[#00D4FF] tracking-wide">ACCOUNT SETTINGS</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="p-6">
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
              {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded mb-4 text-sm">{success}</div>}
              
              <p className="text-xs text-slate-400 mb-6">Leave a field blank if you do not want to change it.</p>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">NEW USERNAME</label>
                  <input type="text" placeholder="e.g. tony" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">NEW PASSWORD</label>
                  <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" />
                </div>
                <button type="submit" className="w-full bg-[#00D4FF] text-black font-bold py-2 rounded shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:bg-cyan-400 transition-colors mt-4">
                  SAVE CHANGES
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
