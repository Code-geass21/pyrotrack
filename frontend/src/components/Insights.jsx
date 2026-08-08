import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Insights({ entries }) {
  // 1. CALCULATE HISTORICAL CHART DATA
  const chartData = useMemo(() => {
    const finished = [...entries].filter(e => e.started && e.finished).reverse();
    return finished.map(e => {
      const start = new Date(e.started);
      const end = new Date(e.finished);
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      return {
        name: e.started,
        days: days > 0 ? days : 0,
        cost: (e.paid || 0) + (e.commission || 0)
      };
    });
  }, [entries]);

  // 2. CALCULATE TOP-LEVEL KEY METRICS
  const metrics = useMemo(() => {
    const finishedCylinders = entries.filter(e => e.started && e.finished);
    const receivedCylinders = entries.filter(e => e.ordered && e.received);
    
    let totalDays = 0;
    let totalCost = 0;
    let totalLeadTime = 0;

    finishedCylinders.forEach(e => {
      const days = Math.max(1, Math.round((new Date(e.finished) - new Date(e.started)) / (1000 * 60 * 60 * 24)));
      totalDays += days;
      totalCost += (e.paid || 0) + (e.commission || 0);
    });

    receivedCylinders.forEach(e => {
      const leadDays = Math.max(0, Math.round((new Date(e.received) - new Date(e.ordered)) / (1000 * 60 * 60 * 24)));
      totalLeadTime += leadDays;
    });

    const avgUtilization = finishedCylinders.length ? (totalDays / finishedCylinders.length).toFixed(1) : 0;
    const avgCostPerDay = totalDays ? Math.round(totalCost / totalDays) : 0;
    const avgLeadTime = receivedCylinders.length ? (totalLeadTime / receivedCylinders.length).toFixed(1) : 0;

    return { avgUtilization, avgCostPerDay, avgLeadTime, totalCost, finishedCount: finishedCylinders.length, receivedCount: receivedCylinders.length };
  }, [entries]);

  // 3. CALCULATE COST BREAKDOWN (DONUT CHART)
  const costBreakdown = useMemo(() => {
    let paid = 0;
    let commission = 0;
    entries.forEach(e => {
      paid += (e.paid || 0);
      commission += (e.commission || 0);
    });
    return [
      { name: 'Agency Cost', value: paid },
      { name: 'Commission/Tip', value: commission }
    ];
  }, [entries]);

  const PIE_COLORS = ['#00D4FF', '#A855F7']; // Cyan and Purple

  return (
    <div className="mt-8 space-y-8">
      {/* 🚀 ROW 1: KEY METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Avg Utilization</h3>
          <div className="text-4xl font-black text-white">{metrics.avgUtilization} <span className="text-lg font-normal text-slate-500">days</span></div>
          <div className="mt-4 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded inline-block">
            ↑ Based on {metrics.finishedCount} cylinders
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Avg Cost / Day</h3>
          <div className="text-4xl font-black text-white">₹{metrics.avgCostPerDay}</div>
          <div className="mt-4 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded inline-block">
            ↑ ₹{metrics.totalCost.toLocaleString()} total spent
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Avg Lead Time</h3>
          <div className="text-4xl font-black text-white">{metrics.avgLeadTime} <span className="text-lg font-normal text-slate-500">days</span></div>
          <div className="mt-4 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded inline-block">
            ↑ {metrics.receivedCount} deliveries tracked
          </div>
        </div>
      </div>

      {/* 🚀 ROW 2: LIFESPAN BAR CHART & COST BREAKDOWN DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lifespan Bar Chart (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl">
          <h2 className="text-[#00D4FF] font-black tracking-widest text-sm mb-6 uppercase">Cylinder Lifespan (Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-12)}>
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                <Bar dataKey="days" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown Donut Chart (Takes up 1 column) */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
          <h2 className="text-[#00D4FF] font-black tracking-widest text-sm mb-2 uppercase">Cost Breakdown</h2>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 🚀 ROW 3: INFLATION TRACKER */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl">
        <h2 className="text-[#00D4FF] font-black tracking-widest text-sm mb-6 uppercase">Price Inflation Tracker (₹)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.slice(-24)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickMargin={10} />
              <YAxis stroke="#475569" fontSize={12} domain={['dataMin - 50', 'auto']} />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} formatter={(value) => [`₹${value}`, 'Cost']} />
              <Line type="monotone" dataKey="cost" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
