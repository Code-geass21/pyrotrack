import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function Insights({ entries }) {
  const chartData = useMemo(() => {
    // Filter only finished cylinders and reverse so the oldest is on the left
    const finished = [...entries].filter(e => e.started && e.finished).reverse();
    
    return finished.map(e => {
      const start = new Date(e.started);
      const end = new Date(e.finished);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      return {
        name: e.started,
        days: days > 0 ? days : 0,
        cost: e.paid || 0
      };
    });
  }, [entries]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl mt-8">
      <h2 className="text-[#00D4FF] font-black tracking-widest text-sm mb-6">INTELLIGENCE & TRENDS</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Short Term: Burn Rate */}
        <div className="bg-[#080C10] p-4 rounded-lg border border-slate-800">
          <h3 className="text-xs text-slate-500 font-bold mb-4">CYLINDER LIFESPAN (DAYS)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer>
              <BarChart data={chartData.slice(-12)}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#00D4FF' }} />
                <Bar dataKey="days" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Long Term: Cost Trends */}
        <div className="bg-[#080C10] p-4 rounded-lg border border-slate-800">
          <h3 className="text-xs text-slate-500 font-bold mb-4">PRICE INFLATION TRACKER (₹)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#ff3366' }} />
                <Line type="monotone" dataKey="cost" stroke="#ff3366" strokeWidth={3} dot={{ fill: '#ff3366', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
