import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ShieldAlert, TrendingUp, TrendingDown, Layers, BarChart } from 'lucide-react';
import { CommodityMatrix } from '../types';

interface MaterialIntelligenceProps {
  apiBase: string;
}

export default function MaterialIntelligence({ apiBase }: MaterialIntelligenceProps) {
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
        
        // Default to first commodity in returned keys if any
        const keys = Object.keys(data);
        if (keys.length > 0) setActiveComm(keys[0]);
      } catch (err) {
        console.error('Failed to fetch commodities:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Generate mock fallback commodities trends
        const fallbacks: CommodityMatrix = {};
        const commodities = ["Copper", "Nickel", "Aluminum", "Steel", "Rare Earth Metals", "Lithium"];
        const prices = [8500, 17500, 2200, 750, 140000, 13500];
        const drifts = [0.015, 0.008, 0.005, 0.003, 0.022, 0.028];

        commodities.forEach((c, idx) => {
          let curr = prices[idx];
          const history = [];
          for (let m = 0; m < 24; m++) {
            curr = curr * (1.0 + drifts[idx] + (Math.sin(m) * 0.04));
            const date = new Date(2024, 6 + m, 1).toISOString().slice(0, 10);
            history.append ? null : history.push({
              month: date,
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

  // Helper to map historical prices and inject a synthetic supply risk score (0-100) 
  // that mirrors raw price fluctuations (volatility increases risk index).
  const getChartData = () => {
    if (!activeData) return [];
    const prices = activeData.history.map(h => h.price_usd);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pRange = maxP - minP || 1;

    return activeData.history.map((h, i) => {
      // Risk index scale overlays price trajectory + sin fluctuation for market stress
      const normalizedPrice = (h.price_usd - minP) / pRange;
      const riskIndex = Math.min(99, Math.max(10, Math.round(
        35 + (normalizedPrice * 45) + (Math.sin(i * 1.5) * 12)
      )));
      return {
        month: h.month.slice(0, 7), // YYYY-MM
        Price: h.price_usd,
        RiskIndex: riskIndex
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading Commodity Trends...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Commodity Selector Side Tabs */}
          <div className="card-industrial flex flex-col space-y-1.5 h-fit">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Select Market Feed
            </span>
            {trends && Object.keys(trends).map((comm) => {
              const data = trends[comm];
              const isSelected = activeComm === comm;
              const isUp = data.delta_30d_pct >= 0;
              return (
                <button
                  key={comm}
                  onClick={() => setActiveComm(comm)}
                  className={`w-full text-left p-2.5 rounded text-xs flex items-center justify-between border transition-all ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-sm' 
                      : 'bg-slate-950/20 border-slate-850 text-slate-400 hover:bg-slate-900/35 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">{comm}</span>
                  <div className="text-right">
                    <span className="font-mono font-bold block">${data.current_price_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={`text-[9px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      isUp ? 'text-status-optimal' : 'text-status-critical'
                    }`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{data.delta_30d_pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dual Axis Price & Risk Curve Chart */}
          <div className="lg:col-span-3 card-industrial flex flex-col justify-between min-h-[380px]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-950 rounded border border-slate-850">
                  <Layers size={16} className="text-brand-steel" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{activeComm} Spot Market Trends</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Price index overlaying synthetic procurement risk metrics</p>
                </div>
              </div>

              {/* Price Delta Stats */}
              {activeData && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">30d Delta</span>
                    <span className={`font-bold ${activeData.delta_30d_pct >= 0 ? 'text-status-optimal' : 'text-status-critical'}`}>
                      {activeData.delta_30d_pct >= 0 ? '+' : ''}{activeData.delta_30d_pct}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">90d Delta</span>
                    <span className={`font-bold ${activeData.delta_90d_pct >= 0 ? 'text-status-optimal' : 'text-status-critical'}`}>
                      {activeData.delta_90d_pct >= 0 ? '+' : ''}{activeData.delta_90d_pct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recharts Render Container */}
            <div className="w-full flex-grow h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3,3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                  />
                  {/* Left Y Axis for Spot Price */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#4682b4" 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                  {/* Right Y Axis for Risk Index */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#ef4444" 
                    fontSize={10} 
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Price') return [`$${value.toLocaleString()}`, 'Spot Price (USD)'];
                      return [`${value}%`, 'Supply Risk Score'];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  
                  {/* Area representing spot prices */}
                  <Area 
                    yAxisId="left"
                    name="Price"
                    type="monotone" 
                    dataKey="Price" 
                    stroke="#4682b4" 
                    fill="url(#colorPrice)" 
                    strokeWidth={2}
                  />
                  {/* Line representing risk index */}
                  <Line 
                    yAxisId="right"
                    name="Supply Risk Index"
                    type="monotone" 
                    dataKey="RiskIndex" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4682b4" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4682b4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
