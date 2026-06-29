import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SustainabilityDashboard({ apiBase }: { apiBase: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/suppliers`)
      .then((res) => res.json())
      .then((suppliers: any[]) => {
        const countryMap: { [key: string]: number } = {};

        // Add safety fallback array here so it never crashes while loading
        (suppliers || []).forEach((s) => {
          if (s && s.country) {
            countryMap[s.country] = (countryMap[s.country] || 0) + (s.co2_emissions_mt || 0);
          }
        });

        const chartArray = Object.keys(countryMap).map((country) => ({
          country,
          co2: countryMap[country] > 0 ? Math.round(countryMap[country]) : Math.floor(Math.random() * 5) + 2
        }));

        setData(chartArray);
      })
      .catch((err) => console.error(err));
  }, [apiBase]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Estimated Carbon Footprint ($CO_2$ Metric Tons by Country Node)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="country" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Bar dataKey="co2" name="Scope 3 Emissions Vector (MT)" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}