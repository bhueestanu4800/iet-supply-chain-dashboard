import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { ShieldAlert, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { CommodityMatrix } from '../types';

interface MaterialIntelligenceProps {
  apiBase: string;
}

export default function MaterialIntelligence({ apiBase }: { apiBase: string }) {
  const [trends, setTrends] = useState<CommodityMatrix | null>(null);
  const [activeComm, setActiveComm] = useState<string>('Copper');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/v1/commodities/trends`);
        if (!res.ok) throw new Error('API server returned error');
        const data = await res.json();
        setTrends(data);
        setError(null);

        const keys = Object.keys(data);
        if (keys.length > 0) setActiveComm(keys[0]);
      } catch (err) {
        console.error('Failed to fetch commodities:', err);
        setError('FastAPI service offline. Operating in fallback execution mode.');

        // Native JavaScript .push array handling initialization mapping
        const fallbacks: CommodityMatrix = {};
        const commodities = ["Copper", "Nickel", "Aluminum", "Steel", "Rare Earth Metals", "Lithium"];
        const prices = [8500, 17500, 2200, 750, 140000, 13500];
        const drifts = [0.015, 0.008, 0.005, 0.003, 0.022, 0.028];

        commodities.forEach((c, idx) => {
          let curr = prices[idx];
          const history: any[] = [];
          for (let m = 0; m < 24; m++) {
            curr = curr * (1.0 + drifts[idx] + Math.sin(m) * 0.04);
            const mockDate = `2024-${String(6 + (m % 12)).padStart(2, '0')}`;
            // Swapped Python .append layout natively for .push array alignment
            history.push({
              month: mockDate,
              commodity: c,
              price_usd: parseFloat(curr.toFixed(2))
            });
          }

          const latest = history[history.length - 1].price_usd;
          const prev30d = history[history.length - 2].price_usd;
          const prev90d = history[history.length - 4].price_usd;

          fallbacks[c] = {
            current_price_usd: latest,
            delta_30d_pct: parseFloat(((latest - prev30d) / prev30d * 100).toFixed(2)),
            delta_90d_pct: parseFloat(((latest - prev90d) / prev90d * 100).toFixed(2)),
            history: history
          };
        });
        setTrends(fallbacks);
        setActiveComm("Copper");
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [apiBase]);

  const activeData = trends?.[activeComm];

  const getChartData = () => {
    if (!activeData) return [];
    const pricesArray = activeData.history.map((h: any) => h.price_usd);
    const minP = Math.min(...pricesArray);
    const maxP = Math.max(...pricesArray);
    const pRange = maxP - minP || 1;

    return activeData.history.map((h: any) => {
      const normalizedPrice = (h.price_usd - minP) / pRange;
      const riskIndex = Math.min(99, Math.max(10, Math.round(35 + (normalizedPrice * 45))));
      return {
        month: h.month.slice(0, 7),
        Price: h.price_usd,
        RiskIndex: riskIndex
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-amber-500 px-3 py-2 text-xs text-amber-500 flex items-center gap-2 rounded-r font-mono">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs font-mono">Loading Market Intelligence Feeds...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Side Selector Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1 font-mono">
              Select Market Feed
            </span>
            {trends && Object.keys(trends).map((comm) => {
              const data = trends[comm];
              const isSelected = activeComm === comm;
              const isUp = data.delta_30d_pct >= 0;
              return (
                <button key={comm} onClick={() => setActiveComm(comm)}
                  className={`w-full text-left p-2.5 rounded text-xs flex items-center justify-between border transition-all ${isSelected ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-950/20 border-slate-850 text-slate-400 hover:bg-slate-800/40'
                    }`}>
                  <span className="font-bold">{comm}</span>
                  <div className="text-right font-mono">
                    <span className="block font-bold">${data.current_price_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={`text-[9px] flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{data.delta_30d_pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Core Visualizer Panel Container */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between min-h-[380px]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                  <Layers size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{activeComm} Spot Market Trends</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Procurement pricing overlays structural supply-risk matrices</p>
                </div>
              </div>

              {activeData && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">30d Delta</span>
                    <span className={`font-bold ${activeData.delta_30d_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activeData.delta_30d_pct >= 0 ? '+' : ''}{activeData.delta_30d_pct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recharts Container Render mapping block */}
            <div className="w-full flex-grow h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#0284c7" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  <Area yAxisId="left" name="Spot Price (USD)" type="monotone" dataKey="Price" stroke="#0284c7" fill="url(#colorPrice)" strokeWidth={2} />
                  <Line yAxisId="right" name="Procurement Risk Index" type="monotone" dataKey="RiskIndex" stroke="#ef4444" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}