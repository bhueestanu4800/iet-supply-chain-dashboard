import React, { useEffect, useState } from 'react';

export default function SupplierPerformance({ apiBase }: { apiBase: string }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/api/v1/suppliers`)
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(err => console.error(err));
  }, [apiBase]);

  const filtered = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <input
          type="text"
          placeholder="Filter core ledger records by node name or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
              <th className="p-3">SUPPLIER IDENTITY</th>
              <th className="p-3">COUNTRY</th>
              <th className="p-3">CATEGORY SEGMENT</th>
              <th className="p-3 text-right">LEAD TIME</th>
              <th className="p-3 text-right">OTIF %</th>
              <th className="p-3 text-right">DEFECT RATE</th>
              <th className="p-3 text-right">RISK SCORE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {(filtered || []).slice(0, 15).map((sup) => (
              <tr key={sup.supplier_id} className="hover:bg-slate-800/40 text-slate-300">
                <td className="p-3 font-semibold text-white max-w-[180px] truncate">{sup.supplier_name}</td>
                <td className="p-3">{sup.country}</td>
                <td className="p-3 text-slate-400">{sup.category}</td>
                <td className="p-3 text-right">{sup.lead_time_days}d</td>
                <td className="p-3 text-right text-emerald-400">{sup.otif_percentage}%</td>
                <td className="p-3 text-right text-red-400">{sup.defect_rate}%</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sup.risk_score > 60 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                    {sup.risk_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}