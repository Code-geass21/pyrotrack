import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GasConnectionInfo({ isOpen, onClose, token }) {
  const [formData, setFormData] = useState({
    brand: "", agency: "", cylinder_number: "", registered_name: "",
    agency_location: "", agency_number: "", delivery_boy_name: "",
    delivery_boy_number: "", notes: ""
  });
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen && token) {
      fetch("/api/v1/users/me", { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          setFormData({
            brand: data.brand || "", agency: data.agency || "",
            cylinder_number: data.cylinder_number || "", registered_name: data.registered_name || "",
            agency_location: data.agency_location || "", agency_number: data.agency_number || "",
            delivery_boy_name: data.delivery_boy_name || "", delivery_boy_number: data.delivery_boy_number || "",
            notes: data.notes || ""
          });
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Connection info saved securely!" });
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ type: "error", text: "Failed to save data." });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }} 
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }} 
            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-black text-[#00D4FF] tracking-wide">GAS CONNECTION DETAILS</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {statusMsg && (
                <div className={`p-3 rounded mb-4 text-sm border ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {statusMsg.text}
                </div>
              )}
              
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">BRAND</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">AGENCY NAME</label><input type="text" name="agency" value={formData.agency} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">CYLINDER / CONSUMER #</label><input type="text" name="cylinder_number" value={formData.cylinder_number} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">REGISTERED NAME</label><input type="text" name="registered_name" value={formData.registered_name} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">AGENCY LOCATION</label><input type="text" name="agency_location" value={formData.agency_location} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">AGENCY NUMBER</label><input type="text" name="agency_number" value={formData.agency_number} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">DELIVERY BOY NAME</label><input type="text" name="delivery_boy_name" value={formData.delivery_boy_name} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1">DELIVERY BOY NUMBER</label><input type="text" name="delivery_boy_number" value={formData.delivery_boy_number} onChange={handleChange} className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1">NOTES / REMARKS</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" /></div>
                </div>
                <button type="submit" className="w-full bg-[#00D4FF] text-black font-bold py-2 rounded shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:bg-cyan-400 transition-colors">SAVE CONNECTION DETAILS</button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
