import React, { useState, useEffect } from 'react';
import { Layers, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { ComponentMatrix } from '../types';

interface ComponentTrackerProps {
  apiBase: string;
}

export default function ComponentTracker({ apiBase }: ComponentTrackerProps) {
  const [components, setComponents] = useState<ComponentMatrix>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/v1/components`)
      .then(res => {
        if (!res.ok) throw new Error('API server returned error');
        return res.json();
      })
      .then(data => {
        setComponents(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('FastAPI service offline. Operating in static data visualization fallback.');
        // Fallback array utilizing the correct type shapes explicitly mapping ComponentMetricItem
        const fallbackMatrix: ComponentMatrix = [
          { component: "Industrial Semiconductors", inventory_on_hand: 340, average_lead_time_days: 52.5, current_demand: 410, forecast_demand: 580, aggregate_risk: 72.1, supplier_count: 4 },
          { component: "Power Electronics", inventory_on_hand: 210, average_lead_time_days: 41.2, current_demand: 290, forecast_demand: 420, aggregate_risk: 65.4, supplier_count: 6 },
          { component: "Control Valves", inventory_on_hand: 450, average_lead_time_days: 28.0, current_demand: 380, forecast_demand: 490, aggregate_risk: 31.8, supplier_count: 8 },
          { component: "Gas Turbine Parts", inventory_on_hand: 180, average_lead_time_days: 62.1, current_demand: 220, forecast_demand: 310, aggregate_risk: 78.4, supplier_count: 3 }
        ];
        setComponents(fallbackMatrix);
      })
      .finally(() => setLoading(false));
  }, [apiBase]);

  return (
    <div className="space-y-6 font-sans">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-amber-500 px-3 py-2 text-xs text-amber-500 flex items-center gap-2 rounded-r font-mono">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs font-mono">
          <RefreshCw className="animate-spin text-emerald-500 h-4 w-4 mr-2" />
          Resolving Component Allocation Pipeline...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(components || []).map((item) => (
            <div key={item.component} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-xs font-bold truncate max-w-[180px] font-mono uppercase tracking-wider">{item.component}</span>
                  <Cpu className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">{item.inventory_on_hand} <span className="text-[10px] text-slate-500 font-normal">Units Stocked</span></div>
              </div>

              <div className="space-y-2 border-t border-slate-800/80 pt-3 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Avg Lead Time:</span>
                  <span className="text-slate-200 font-bold">{item.average_lead_time_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Pipelines:</span>
                  <span className="text-slate-200 font-bold">{item.supplier_count} Global Nodes</span>
                </div>
                <div className="flex justify-between">
                  <span>Current / Forecast:</span>
                  <span className="text-slate-200 font-bold">{item.current_demand} / {item.forecast_demand}</span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span>Allocated Risk Index:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.aggregate_risk > 60 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>{item.aggregate_risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}