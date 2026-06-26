import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { ShieldAlert, Leaf, Shield, HeartPulse, HelpCircle } from 'lucide-react';
import { Supplier } from '../types';

interface SustainabilityDashboardProps {
  apiBase: string;
}

export default function SustainabilityDashboard({ apiBase }: SustainabilityDashboardProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carbon coefficient mapping representing transport distances and factory fuel configurations
  const carbonFactors: Record<string, number> = {
    "China": 1.24,
    "India": 1.15,
    "Brazil": 0.98,
    "Singapore": 1.12,
    "Saudi Arabia": 0.88,
    "UAE": 0.85,
    "South Korea": 0.76,
    "Japan": 0.72,
    "United Kingdom": 0.44,
    "Germany": 0.46,
    "USA": 0.38,
    "Canada": 0.35
  };

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
        console.error('Failed to fetch suppliers for sustainability:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Mock fallback suppliers
        const countries = ["USA", "Germany", "UAE", "Saudi Arabia", "India", "China", "Japan", "South Korea", "Singapore", "United Kingdom", "Canada", "Brazil"];
        const categories = ["Power Electronics", "Control Valves", "PLC Systems", "Gas Turbine Parts", "Industrial Semiconductors"];
        const fallbacks: Supplier[] = Array.from({ length: 100 }, (_, idx) => ({
          supplier_id: `SUP${idx + 1:03d}`,
          name: `Supplier ${idx + 1}`,
          country: countries[idx % countries.length],
          category: categories[idx % categories.length],
          base_lead_time_days: 30,
          historic_defect_rate: 0.01,
          spend_usd: 100000 + (idx * 30000) % 2000000,
          risk_score: 30 + (idx * 2) % 40
        }));
        setSuppliers(fallbacks);
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [apiBase]);

  // Calculations
  // 1. Carbon Footprint (CO2 MT) = Spend in USD * Country Factor / 1000
  const getSupplierCarbonList = () => {
    return suppliers.map(s => {
      const factor = carbonFactors[s.country] || 0.50;
      const co2 = (s.spend_usd * factor) / 1000.0;
      
      // Sustainability score (0-100) modeled as inverse risk score with minor noise
      const sustainScore = Math.min(99, Math.max(30, Math.round(
        100 - s.risk_score - (s.historic_defect_rate * 250) + (s.supplier_id.charCodeAt(3) % 10)
      )));

      return {
        ...s,
        co2_mt: parseFloat(co2.toFixed(1)),
        sustain_score: sustainScore
      };
    }).sort((a, b) => b.co2_mt - a.co2_mt);
  };

  const supplierCarbonList = getSupplierCarbonList();
  
  // Aggregate carbon emissions by country
  const getCountryEmissionsData = () => {
    const emissionsMap: Record<string, number> = {};
    supplierCarbonList.forEach(s => {
      emissionsMap[s.country] = (emissionsMap[s.country] || 0) + s.co2_mt;
    });

    return Object.entries(emissionsMap).map(([country, emissions]) => ({
      Country: country,
      Emissions: Math.round(emissions)
    })).sort((a, b) => b.Emissions - a.Emissions);
  };

  const countryEmissionsData = getCountryEmissionsData();

  // Overall sums
  const totalEmissions = Math.round(supplierCarbonList.reduce((acc, s) => acc + s.co2_mt, 0));
  const avgSustainScore = Math.round(supplierCarbonList.reduce((acc, s) => acc + s.sustain_score, 0) / (supplierCarbonList.length || 1));

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Sustainability KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Leaf size={18} className="text-status-optimal" />
          </div>
          <div>
            <span className="metric-header">Total Carbon Footprint</span>
            <span className="metric-large">{totalEmissions.toLocaleString()} MT CO₂e</span>
          </div>
        </div>
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <Shield size={18} className="text-brand-steel" />
          </div>
          <div>
            <span className="metric-header">Average ESG Sustainability Index</span>
            <span className="metric-large">{avgSustainScore}/100</span>
          </div>
        </div>
        <div className="card-industrial flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-850">
            <HeartPulse size={18} className="text-status-caution" />
          </div>
          <div>
            <span className="metric-header">Low-Sustain Supplier Flag Count</span>
            <span className="metric-large">
              {supplierCarbonList.filter(s => s.sustain_score < 50).length} firms
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading ESG Dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Bar Chart: Carbon Emissions by Country */}
          <div className="lg:col-span-3 card-industrial flex flex-col justify-between h-[340px]">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Procurement Carbon Footprint Distribution</h3>
              <p className="text-[10px] text-slate-400 font-mono">Simulated cumulative emissions (Metric Tons CO₂e) by country nodes</p>
            </div>
            
            <div className="w-full flex-grow h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryEmissionsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                    tickFormatter={(val) => `${val}k`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', color: '#f8fafc' }}
                    formatter={(value: any) => [`${value.toLocaleString()} MT CO₂`, 'Emissions']}
                  />
                  <Bar 
                    dataKey="Emissions" 
                    fill="#10b981" 
                    radius={[2, 2, 0, 0]}
                  >
                    {countryEmissionsData.map((entry, index) => {
                      const color = entry.Emissions > 10000 ? '#ef4444' : entry.Emissions > 4000 ? '#f59e0b' : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Supplier Emissions Table */}
          <div className="lg:col-span-2 card-industrial flex flex-col justify-between h-[340px]">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Supplier Emissions & Score Ranking</h3>
              <p className="text-[10px] text-slate-400 font-mono">Firms ranked by CO₂ footprint intensity</p>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[220px] mt-3 space-y-1.5 pr-1">
              {supplierCarbonList.slice(0, 10).map((s, idx) => (
                <div 
                  key={s.supplier_id} 
                  className="p-2 rounded bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-200 block truncate">
                      {idx + 1}. {s.name}
                    </span>
                    <span className="text-[9px] text-slate-400">{s.country} • {s.category}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold block text-slate-200">
                      {s.co2_mt.toLocaleString()} MT
                    </span>
                    <span className={`text-[8px] font-bold px-1 rounded ${
                      s.sustain_score >= 70 ? 'bg-status-optimal/10 text-status-optimal' :
                      s.sustain_score >= 50 ? 'bg-status-caution/10 text-status-caution' :
                      'bg-status-critical/10 text-status-critical'
                    }`}>
                      ESG: {s.sustain_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
