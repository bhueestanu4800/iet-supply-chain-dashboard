import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ShieldAlert, Cpu, Settings, Zap, Compass, Activity } from 'lucide-react';
import { ComponentMatrix } from '../types';

interface ComponentTrackerProps {
  apiBase: string;
}

export default function ComponentTracker({ apiBase }: ComponentTrackerProps) {
  const [components, setComponents] = useState<ComponentMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComponents() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/v1/components`);
        if (!res.ok) throw new Error('API server returned error');
        const data = await res.json();
        setComponents(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch components:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Define fallback components data
        setComponents({
          "Industrial Semiconductors": {
            supplier_count: 8,
            total_spend_usd: 8400000.0,
            inventory_value_usd: 1260000.0,
            localized_risk_weight: 42.5,
            growth_rate_pct: 12.4,
            forecast_demand_trajectory: [350000, 365000, 380000, 400000, 415000, 430000]
          },
          "Power Electronics": {
            supplier_count: 5,
            total_spend_usd: 7200000.0,
            inventory_value_usd: 1080000.0,
            localized_risk_weight: 55.4,
            growth_rate_pct: 8.5,
            forecast_demand_trajectory: [300000, 308000, 316000, 325000, 333000, 342000]
          },
          "Control Valves": {
            supplier_count: 10,
            total_spend_usd: 4800000.0,
            inventory_value_usd: 720000.0,
            localized_risk_weight: 28.3,
            growth_rate_pct: 3.2,
            forecast_demand_trajectory: [200000, 201000, 202000, 203000, 204000, 205000]
          },
          "Gas Turbine Parts": {
            supplier_count: 6,
            total_spend_usd: 12000000.0,
            inventory_value_usd: 1800000.0,
            localized_risk_weight: 62.1,
            growth_rate_pct: 2.1,
            forecast_demand_trajectory: [500000, 502000, 504000, 506000, 508000, 510000]
          }
        });
      } finally {
        setLoading(false);
      }
    }
    fetchComponents();
  }, [apiBase]);

  // Select icon based on component category
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('semiconductor')) return Cpu;
    if (c.includes('valves') || c.includes('piping') || c.includes('pumps')) return Settings;
    if (c.includes('power') || c.includes('switchgear')) return Zap;
    if (c.includes('turbine') || c.includes('castings')) return Compass;
    return Activity;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading Component Trajectory Grid...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {components && Object.entries(components).map(([category, data]) => {
            const Icon = getCategoryIcon(category);
            const nextMonthDemand = data.forecast_demand_trajectory[0] || 1;
            
            // Coverage ratio = Current Inventory / Next Month's demand (Assuming 1 month lead supply coverage)
            const coverageRatio = data.inventory_value_usd / nextMonthDemand;
            
            // Coverage percentage (capped at 100 for display bar)
            const coveragePct = Math.min(100, Math.round((data.inventory_value_usd / nextMonthDemand) * 100));

            // Status color based on ratio
            const isCritical = coverageRatio < 2.0;
            const isCaution = coverageRatio >= 2.0 && coverageRatio < 3.0;
            const statusLabel = isCritical ? 'Critical Stock' : isCaution ? 'Sufficient' : 'Optimal Surplus';
            const statusColor = isCritical ? 'text-status-critical bg-status-critical/10 border-status-critical/20' : 
                               isCaution ? 'text-status-caution bg-status-caution/10 border-status-caution/20' : 
                               'text-status-optimal bg-status-optimal/10 border-status-optimal/20';

            // Chart data preparation
            const chartData = data.forecast_demand_trajectory.map((val, idx) => ({
              month: `M+${idx + 1}`,
              Demand: val
            }));

            return (
              <div key={category} className="card-industrial flex flex-col justify-between space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-850">
                      <Icon size={16} className="text-brand-steel" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">{category}</h3>
                      <span className="text-[9px] text-slate-400 font-mono">Sourced across {data.supplier_count} suppliers</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
                    <span className="metric-header">Stock On Hand</span>
                    <span className="text-xs font-bold text-slate-200">
                      ${data.inventory_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
                    <span className="metric-header">Next Month Demand</span>
                    <span className="text-xs font-bold text-slate-200">
                      ${nextMonthDemand.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
                    <span className="metric-header">Supply Coverage</span>
                    <span className="text-xs font-bold text-slate-200">
                      {coverageRatio.toFixed(1)}x Months
                    </span>
                  </div>
                </div>

                {/* Inventory Stock vs Forecast Demand Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Safety Coverage Ratio (Inventory vs Next Month Demand)</span>
                    <span className="font-mono font-bold text-slate-200">{coveragePct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-status-critical' : isCaution ? 'bg-status-caution' : 'bg-status-optimal'
                      }`}
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                </div>

                {/* 6-Month Trajectory Spark Chart */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Projected 6-Month Demand Curve</span>
                  <div className="w-full h-28 bg-slate-950/30 rounded p-1 border border-slate-850/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis 
                          dataKey="month" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false}
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                        />
                        <Tooltip 
                          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, 'Projected Demand']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Demand" 
                          stroke="#4682b4" 
                          fill="url(#colorDemand)" 
                          strokeWidth={1.5}
                        />
                        <defs>
                          <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4682b4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4682b4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
