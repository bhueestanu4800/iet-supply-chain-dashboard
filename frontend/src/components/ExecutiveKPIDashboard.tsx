import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { ShieldAlert, BarChart3, Filter, Globe } from 'lucide-react';
import { Supplier } from '../types';

interface ExecutiveKPIDashboardProps {
  apiBase: string;
}

export default function ExecutiveKPIDashboard({ apiBase }: ExecutiveKPIDashboardProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cross-filtering States
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');

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
        console.error('Failed to fetch suppliers:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Generate mock fallback suppliers
        const countries = ["USA", "Germany", "UAE", "Saudi Arabia", "India", "China", "Japan", "South Korea", "Singapore", "United Kingdom", "Canada", "Brazil"];
        const categories = ["Power Electronics", "Control Valves", "PLC Systems", "Gas Turbine Parts", "Industrial Semiconductors"];
        const fallbacks: Supplier[] = Array.from({ length: 100 }, (_, idx) => ({
          supplier_id: `SUP${idx + 1:03d}`,
          name: `Supplier ${idx + 1}`,
          country: countries[idx % countries.length],
          category: categories[idx % categories.length],
          base_lead_time_days: 15 + (idx * 6) % 150,
          historic_defect_rate: 0.01,
          spend_usd: 150000 + (idx * 27000) % 2500000,
          risk_score: 30 + (idx * 3) % 50
        }));
        setSuppliers(fallbacks);
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [apiBase]);

  const categories = ['ALL', ...Array.from(new Set(suppliers.map(s => s.category)))];
  const countries = ['ALL', ...Array.from(new Set(suppliers.map(s => s.country)))];

  // Apply filters
  const filtered = suppliers.filter(s => {
    return (filterCategory === 'ALL' || s.category === filterCategory) &&
           (filterCountry === 'ALL' || s.country === filterCountry);
  });

  // Calculate stats based on filtered data
  const totalSpend = filtered.reduce((acc, curr) => acc + curr.spend_usd, 0);
  const avgRisk = filtered.length > 0 
    ? filtered.reduce((acc, curr) => acc + curr.risk_score, 0) / filtered.length 
    : 0;
  const avgLeadTime = filtered.length > 0
    ? filtered.reduce((acc, curr) => acc + curr.base_lead_time_days * curr.spend_usd, 0) / (totalSpend || 1)
    : 0;

  // Build Waterfall spend distribution chart data by category
  const getSpendDistributionData = () => {
    const dataMap: Record<string, number> = {};
    filtered.forEach(s => {
      dataMap[s.category] = (dataMap[s.category] || 0) + s.spend_usd;
    });

    let runningSum = 0;
    return Object.entries(dataMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, spend]) => {
        const base = runningSum;
        runningSum += spend;
        return {
          name: cat.slice(0, 12),
          base: base,
          value: spend,
          total: runningSum
        };
      });
  };

  const spendDistData = getSpendDistributionData();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Cross-Filter Bar */}
      <div className="card-industrial flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cross Filters:</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Category:</span>
          <select
            className="py-1 px-2 rounded bg-slate-950 border border-slate-850 text-slate-350 focus:outline-none focus:border-brand-steel"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Country:</span>
          <select
            className="py-1 px-2 rounded bg-slate-950 border border-slate-850 text-slate-350 focus:outline-none focus:border-brand-steel"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            {countries.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-[9px] font-mono text-slate-450">
          Filtered Profiles: {filtered.length} / {suppliers.length}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-industrial">
          <span className="metric-header">Filtered Spend Allocation</span>
          <span className="metric-large">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="metric-desc">Proportional cumulative spend under current filters</span>
        </div>
        <div className="card-industrial">
          <span className="metric-header">Local Risk Profile</span>
          <span className={`metric-large ${
            avgRisk < 30 ? 'text-status-optimal' : avgRisk < 50 ? 'text-status-caution' : 'text-status-critical'
          }`}>{avgRisk.toFixed(1)}</span>
          <span className="metric-desc">Average supplier risk rating</span>
        </div>
        <div className="card-industrial">
          <span className="metric-header">Weighted Lead Time</span>
          <span className="metric-large">{avgLeadTime.toFixed(1)} days</span>
          <span className="metric-desc">Spend-weighted delivery latency</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading Analytics Insights...</div>
      ) : (
        <div className="card-industrial h-[320px] flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Category Spend Waterfall Breakdown</h3>
            <p className="text-[10px] text-slate-400 font-mono">Running total spend accumulation by industrial component category</p>
          </div>

          <div className="w-full flex-grow h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendDistData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3,3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${(val / 1e6).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Incremental') return [`$${value.toLocaleString()}`, 'Spent'];
                    return [`$${value.toLocaleString()}`, 'Cumulative Total'];
                  }}
                />
                {/* Floating bar offset */}
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="value" name="Incremental" stackId="a" fill="#4682b4" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
