import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { ShieldAlert, Truck, Anchor, Navigation, Calendar } from 'lucide-react';
import { Supplier } from '../types';

interface LogisticsDashboardProps {
  apiBase: string;
}

export default function LogisticsDashboard({ apiBase }: LogisticsDashboardProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/v1/suppliers`);
        if (!res.ok) throw new Error('API server returned error');
        const data = await res.json();
        setSuppliers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch suppliers for logistics:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Mock fallback suppliers
        const countries = ["USA", "Germany", "UAE", "Saudi Arabia", "India", "China", "Japan", "South Korea", "Singapore", "United Kingdom", "Canada", "Brazil"];
        const categories = ["Power Electronics", "Control Valves", "PLC Systems", "Gas Turbine Parts", "Industrial Semiconductors"];
        const fallbacks: Supplier[] = Array.from({ length: 100 }, (_, idx) => ({
          supplier_id: `SUP${idx + 1:03d}`,
          name: `Supplier ${idx + 1}`,
          country: countries[idx % countries.length],
          category: categories[idx % categories.length],
          base_lead_time_days: 15 + (idx * 6) % 150,
          historic_defect_rate: 0.01,
          spend_usd: 50000 + (idx * 27000) % 2500000,
          risk_score: 30 + (idx * 3) % 50
        }));
        setSuppliers(fallbacks);
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [apiBase]);

  // Aggregate logistics metrics dynamically
  // 1. Port Congestion Index by country (derived from lead times / country scores)
  const getPortCongestionData = () => {
    const countryStats: Record<string, { totalLT: number; count: number }> = {};
    suppliers.forEach(s => {
      if (!countryStats[s.country]) {
        countryStats[s.country] = { totalLT: 0, count: 0 };
      }
      countryStats[s.country].totalLT += s.base_lead_time_days;
      countryStats[s.country].count += 1;
    });

    return Object.entries(countryStats).map(([country, stats]) => {
      const avgLT = stats.totalLT / stats.count;
      
      // Congestion index (0-100) modeled as base average lead time scaled
      const congestionIndex = Math.min(95, Math.max(10, Math.round(
        avgLT / 180 * 75 + (country === "Brazil" ? 20 : country === "China" ? 15 : 0)
      )));

      return {
        Country: country,
        Congestion: congestionIndex
      };
    }).sort((a, b) => b.Congestion - a.Congestion);
  };

  // 2. Transport Mode Distribution: Model based on country geographies
  const getTransportModeData = () => {
    let sea = 0, air = 0, rail = 0, road = 0;
    suppliers.forEach(s => {
      // Landlocks or neighbors use road/rail, long haul use sea/air
      if (s.country === "USA" || s.country === "Canada") {
        rail += s.spend_usd * 0.40;
        road += s.spend_usd * 0.30;
        sea += s.spend_usd * 0.20;
        air += s.spend_usd * 0.10;
      } else if (s.country === "Germany" || s.country === "United Kingdom") {
        sea += s.spend_usd * 0.50;
        air += s.spend_usd * 0.30;
        rail += s.spend_usd * 0.20;
      } else {
        // Asian & Middle East suppliers to Western industrial sites
        sea += s.spend_usd * 0.85;
        air += s.spend_usd * 0.15;
      }
    });

    const total = sea + air + rail + road || 1;
    return [
      { name: 'Ocean Freight (Sea)', value: Math.round((sea / total) * 100), color: '#0b132b' },
      { name: 'Air Cargo (Express)', value: Math.round((air / total) * 100), color: '#4682b4' },
      { name: 'Rail Logistics', value: Math.round((rail / total) * 100), color: '#10b981' },
      { name: 'Road Transport', value: Math.round((road / total) * 100), color: '#f59e0b' }
    ];
  };

  const congestionData = getPortCongestionData();
  const transportData = getTransportModeData();

  // Summary Metrics
  const totalContainers = Math.round(suppliers.reduce((acc, s) => acc + s.spend_usd, 0) / 450000) || 120;
  const avgTransitDelay = (suppliers.reduce((acc, s) => acc + s.risk_score, 0) / (suppliers.length || 1) / 14).toFixed(1);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Anchor size={18} className="text-brand-steel" />
          </div>
          <div>
            <span className="metric-header">Active Containers in Transit</span>
            <span className="metric-large">{totalContainers} TEUs</span>
          </div>
        </div>
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Truck size={18} className="text-status-caution" />
          </div>
          <div>
            <span className="metric-header">Avg Transit Delay</span>
            <span className="metric-large">{avgTransitDelay} Days</span>
          </div>
        </div>
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Navigation size={18} className="text-status-optimal" />
          </div>
          <div>
            <span className="metric-header">Active Shipping Lanes</span>
            <span className="metric-large">24 Routes</span>
          </div>
        </div>
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Calendar size={18} className="text-slate-500" />
          </div>
          <div>
            <span className="metric-header">Logistics SLA Adherence</span>
            <span className="metric-large">91.4%</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading Logistics Analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut Chart: Transport Mode Split */}
          <div className="card-industrial flex flex-col justify-between h-[340px]">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Procurement Logistics Transport Split</h3>
              <p className="text-[10px] text-slate-400 font-mono">Percentage distribution of tonnage spend across shipment modes</p>
            </div>
            
            <div className="w-full flex-grow flex items-center justify-center h-48">
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={transportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {transportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#1e293b" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                    formatter={(value: any) => [`${value}%`, 'Volume Share']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Port Congestion Ratio */}
          <div className="card-industrial flex flex-col justify-between h-[340px]">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Geographic Port Congestion Index</h3>
              <p className="text-[10px] text-slate-400 font-mono">Simulated vessel holdover metrics (0-100) based on regional node latency</p>
            </div>
            
            <div className="w-full flex-grow h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={congestionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis 
                    dataKey="Country" 
                    stroke="#475569" 
                    fontSize={8} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                    formatter={(value: any) => [`${value}%`, 'Vessel Congestion Index']}
                  />
                  <Bar 
                    dataKey="Congestion" 
                    fill="#4682b4" 
                    radius={[2, 2, 0, 0]}
                  >
                    {congestionData.map((entry, index) => {
                      const color = entry.Congestion > 60 ? '#ef4444' : entry.Congestion > 35 ? '#f59e0b' : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
