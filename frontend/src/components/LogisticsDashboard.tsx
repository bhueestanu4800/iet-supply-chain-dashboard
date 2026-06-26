import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function LogisticsDashboard({ apiBase }: { apiBase: string }) {
  const transitData = [
    { route: 'Trans-Pacific', delay: 14, cost: 4200 },
    { route: 'Asia-Europe', delay: 19, cost: 5800 },
    { route: 'Intra-Asia', delay: 5, cost: 1900 },
    { route: 'Trans-Atlantic', delay: 8, cost: 3100 }
  ];

  const modeData = [
    { name: 'Maritime', value: 65, color: '#0284c7' },
    { name: 'Air Freight', value: 15, color: '#f43f5e' },
    { name: 'Rail Logistics', value: 20, color: '#eab308' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Average Route Delay Days & Freight Cost</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="route" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Legend />
              <Bar dataKey="delay" name="Delay Duration (Days)" fill="#f43f5e" />
              <Bar dataKey="cost" name="Spot Rate per Container ($)" fill="#0284c7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Global Transport Modal Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={modeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {modeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}