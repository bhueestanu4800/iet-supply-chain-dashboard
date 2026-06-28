import React, { useEffect, useState } from 'react';

interface SupplierPerformanceProps {
  apiBase: string;
}

export default function SupplierPerformance({ apiBase }: SupplierPerformanceProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/api/v1/suppliers`)
      .then(res => res.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching suppliers ledger:", err));
  }, [apiBase]);

  // Safe filtering loop with dynamic property fallbacks and null safety guards
  const filtered = (suppliers || []).filter(s => {
    if (!s) return false;
    const name = s.name || s.supplier_name || '';
    const country = s.country || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      country.toLowerCase().includes(search.toLowerCase())
    );
  });

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
              <th className="p-3 text-right">SPEND</th>
              <th className="p-3 text-right">LEAD TIME</th>
              <th className="p-3 text-right">DEFECT RATE</th>
              <th className="p-3 text-right">RISK SCORE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.slice(0, 15).map((sup: any) => {
              const riskVal = Number(sup.risk_score || sup.risk_score_index || 0);
              const defectRate = Number(sup.historic_defect_rate || sup.defect_rate || 0);
              const leadTime = sup.base_lead_time_days || sup.lead_time_days || 0;
              const spendVal = sup.spend_usd || 0;

              return (
                <tr key={sup.supplier_id || sup.name} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="p-3 font-semibold text-white max-w-[180px] truncate">
                    {sup.name || sup.supplier_name || 'Unknown Node'}
                  </td>
                  <td className="p-3">{sup.country || 'N/A'}</td>
                  <td className="p-3 text-slate-400">{sup.category || 'N/A'}</td>
                  <td className="p-3 text-right font-mono text-slate-400">
                    ${(spendVal / 1e6).toFixed(1)}M
                  </td>
                  <td className="p-3 text-right">{leadTime}d</td>
                  <td className="p-3 text-right text-red-400">
                    {(defectRate * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskVal > 60
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                      {riskVal}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                  No tracking ledger entries localized matching search parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}