import { useState } from "react";

export default function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        const res = await fetch("/api/v1/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });
        if (!res.ok) throw new Error("Invalid credentials");
        const data = await res.json();
        setToken(data.access_token);
      } else {
        const res = await fetch("/api/v1/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Registration failed");
        }
        alert("Account created! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C10] flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-[#00D4FF] tracking-widest text-center mb-2">PYROTRACK</h1>
        <p className="text-slate-500 text-center text-sm mb-8">Secure Vault Access</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">USERNAME</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#080C10] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#00D4FF]" />
          </div>
          <button type="submit" className="w-full bg-[#00D4FF] text-black font-bold py-2 rounded shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:bg-cyan-400 transition-colors mt-4">
            {isLogin ? "ENTER VAULT" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-slate-500 hover:text-white transition-colors">
            {isLogin ? "Need a family account? Register here." : "Already have an account? Log in."}
          </button>
        </div>
      </div>
    </div>
  );
}
