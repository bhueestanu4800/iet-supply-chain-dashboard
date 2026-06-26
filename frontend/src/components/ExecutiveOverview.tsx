import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  DollarSign, 
  Activity, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { ExecutiveSummary, AIInsightsResponse } from '../types';

// Mock sparkline data for trends
const spendTrend = [{ v: 50 }, { v: 52 }, { v: 49 }, { v: 55 }, { v: 58 }, { v: 60.1 }];
const otifTrend = [{ v: 88.5 }, { v: 87.2 }, { v: 86.9 }, { v: 87.5 }, { v: 86.4 }, { v: 86.9 }];
const ltTrend = [{ v: 62 }, { v: 64 }, { v: 66 }, { v: 65 }, { v: 63.8 }, { v: 64.9 }];
const riskTrend = [{ v: 1 }, { v: 2 }, { v: 4 }, { v: 3 }, { v: 2 }, { v: 3 }];

interface ExecutiveOverviewProps {
  apiBase: string;
}

export default function ExecutiveOverview({ apiBase }: ExecutiveOverviewProps) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [insightsData, setInsightsData] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [sumRes, insRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/executive/summary`),
          fetch(`${apiBase}/api/v1/ai-insights`)
        ]);

        if (!sumRes.ok || !insRes.ok) {
          throw new Error('API server returned error code');
        }

        const sumData = await sumRes.json();
        const insData = await insRes.json();

        setSummary(sumData);
        setInsightsData(insData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch executive data:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        // Set fallback data
        setSummary({
          total_active_suppliers: 100,
          spend_sums_usd: 60175400.0,
          weighted_average_lead_time_days: 64.9,
          system_wide_otif_pct: 86.9,
          critical_suppliers_count: 3,
          operational_threshold_alerts: [
            { id: 'ALT-001', severity: 'CRITICAL', category: 'Supplier Risk', message: 'Critical Exposure: 3 key suppliers exceed risk score threshold of 65.' },
            { id: 'ALT-002', severity: 'WARNING', category: 'Delivery Performance', message: 'System-Wide OTIF levels have fallen below target to 86.9%.' }
          ]
        });
        setInsightsData({
          insights_count: 2,
          insights: [
            { id: 'INS-GEO-001', type: 'CONCENTRATION_RISK', severity: 'WARNING', anomaly: 'Geographic concentration in USA: controls 28.5% of total supply chain spend.', recommendation: 'Diversify parts sourcing from alternative logistics nodes to insulate operations from regional shocks.' },
            { id: 'INS-MON-SUP045', type: 'MONOPOLY_RISK', severity: 'WARNING', anomaly: 'Single point of failure in Power Electronics: Vertex Solutions Inc. represents 58.2% of procurement spend.', recommendation: 'Qualify secondary supplier channels for Power Electronics to build resiliency.' }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [apiBase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="animate-spin mr-2" size={20} /> Loading Executive Analytics...
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Procurement Spend',
      value: `$${((summary?.spend_sums_usd ?? 0) / 1e6).toFixed(2)}M`,
      desc: 'Cumulative 24-month spend volume',
      icon: DollarSign,
      color: 'text-slate-100',
      trend: spendTrend,
      sparkColor: '#4682b4'
    },
    {
      title: 'Global OTIF Delivery Rate',
      value: `${summary?.system_wide_otif_pct.toFixed(1)}%`,
      desc: 'On-Time In-Full performance limits',
      icon: Activity,
      color: (summary?.system_wide_otif_pct ?? 0) > 85 ? 'text-status-optimal' : 'text-status-caution',
      trend: otifTrend,
      sparkColor: (summary?.system_wide_otif_pct ?? 0) > 85 ? '#10b981' : '#f59e0b'
    },
    {
      title: 'Weighted Avg Lead Time',
      value: `${summary?.weighted_average_lead_time_days.toFixed(1)} days`,
      desc: 'Spend-weighted material delivery latency',
      icon: Clock,
      color: 'text-slate-100',
      trend: ltTrend,
      sparkColor: '#94a3b8'
    },
    {
      title: 'Critical Risk Bottlenecks',
      value: `${summary?.critical_suppliers_count}`,
      desc: 'Suppliers with risk score > 65',
      icon: AlertTriangle,
      color: (summary?.critical_suppliers_count ?? 0) > 0 ? 'text-status-critical' : 'text-status-optimal',
      trend: riskTrend,
      sparkColor: (summary?.critical_suppliers_count ?? 0) > 0 ? '#ef4444' : '#10b981'
    }
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="card-industrial flex flex-col justify-between h-28">
            <div className="flex items-start justify-between">
              <div>
                <span className="metric-header">{kpi.title}</span>
                <span className={`metric-large ${kpi.color}`}>{kpi.value}</span>
              </div>
              <kpi.icon size={18} className="text-slate-500 mt-1" />
            </div>
            
            <div className="flex items-end justify-between mt-2">
              <span className="metric-desc">{kpi.desc}</span>
              <div className="w-20 h-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.trend}>
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke={kpi.sparkColor} 
                      strokeWidth={1.5} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Feed and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Operational Alerts */}
        <div className="card-industrial space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Operational Alerts</h3>
            <span className="bg-slate-950 text-[10px] px-2 py-0.5 rounded font-mono text-slate-400">
              {summary?.operational_threshold_alerts.length ?? 0} Alerts Active
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
            {summary?.operational_threshold_alerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              return (
                <div 
                  key={alert.id} 
                  className={`p-2.5 rounded text-xs flex items-start gap-2.5 bg-slate-950/60 border ${
                    isCrit ? 'border-status-critical/30 text-status-critical/90' : 
                    isWarn ? 'border-status-caution/30 text-status-caution/90' : 
                    'border-slate-850 text-slate-300'
                  }`}
                >
                  {isCrit ? <AlertCircle className="mt-0.5 flex-shrink-0" size={14} /> : 
                   isWarn ? <AlertTriangle className="mt-0.5 flex-shrink-0" size={14} /> : 
                   <Info className="mt-0.5 flex-shrink-0" size={14} />}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-400">
                      <span>{alert.category}</span>
                      <span>•</span>
                      <span>{alert.id}</span>
                    </div>
                    <p className="leading-relaxed text-slate-200">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card-industrial space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Prescriptive Supply Chain Insights</h3>
            <span className="bg-slate-950 text-[10px] px-2 py-0.5 rounded font-mono text-status-optimal">
              AI Engines Active
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
            {insightsData?.insights.slice(0, 3).map((insight) => (
              <div 
                key={insight.id} 
                className="p-2.5 rounded text-xs bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                    {insight.type.replace('_', ' ')}
                  </span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    insight.severity === 'CRITICAL' ? 'bg-status-critical/15 text-status-critical' : 'bg-status-caution/15 text-status-caution'
                  }`}>
                    {insight.severity}
                  </span>
                </div>
                <p className="text-slate-300 font-semibold mb-2">{insight.anomaly}</p>
                
                <div className="bg-slate-950/80 p-2 border-l border-status-optimal rounded-r text-[11px] text-slate-400 flex items-start gap-2">
                  <ArrowRight className="text-status-optimal mt-0.5 flex-shrink-0" size={12} />
                  <div>
                    <span className="text-status-optimal font-bold text-[9px] uppercase tracking-wider block mb-0.5">Recommendation</span>
                    {insight.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
