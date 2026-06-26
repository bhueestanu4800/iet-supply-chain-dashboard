import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function GlobalSupplyMap({ apiBase }: { apiBase: string }) {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/suppliers`)
      .then(res => res.json())
      .then((data: any[]) => {
        const map: { [key: string]: any } = {};
        data.forEach(sup => {
          if (!map[sup.country]) {
            map[sup.country] = { name: sup.country, suppliers: 0, totalSpend: 0, totalRisk: 0 };
          }
          map[sup.country].suppliers += 1;
          map[sup.country].totalSpend += sup.spend_usd;
          map[sup.country].totalRisk += sup.risk_score;
        });

        const formatted = Object.values(map).map((r: any) => ({
          ...r,
          avgRisk: Math.round((r.totalRisk / r.suppliers) * 10) / 10
        }));
        setRegions(formatted);
        if (formatted.length > 0) setSelectedRegion(formatted[0]);
      })
      .catch(err => console.error(err));
  }, [apiBase]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-6">Active Regional Logistics Infrastructure Nodes</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {regions.map((reg) => (
            <button
              key={reg.name}
              onClick={() => setSelectedRegion(reg)}
              className={`p-4 rounded-xl border text-left transition-all ${selectedRegion?.name === reg.name ? 'bg-slate-800 border-emerald-500' : 'bg-slate-950 border-slate-800'
                }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white">{reg.name}</span>
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{reg.suppliers} Nodes</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Node Telemetry Analysis</h3>
        {selectedRegion && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block mb-1">SELECTED TERRITORY</span>
              <span className="text-sm font-bold text-white">{selectedRegion.name}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block mb-1">TOTAL REGIONAL CAPITAL SPEND</span>
              <span className="text-sm font-bold text-emerald-400">${(selectedRegion.totalSpend / 1e6).toFixed(2)}M</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block mb-1">AGGREGATE NODE RISK RATIO</span>
              <span className="text-sm font-bold text-amber-500">{selectedRegion.avgRisk} / 100</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}