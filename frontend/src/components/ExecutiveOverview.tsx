import React, { useEffect, useState } from 'react';
import { ShieldAlert, Zap, Layers, AlertTriangle, ArrowRight } from 'lucide-react';
import { ExecutiveSummary, AIInsightsResponse } from '../types';

interface ExecutiveOverviewProps {
  apiBase: string;
}

export default function ExecutiveOverview({ apiBase }: ExecutiveOverviewProps) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [insights, setInsights] = useState<AIInsightsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/v1/executive/summary`).then(res => res.json()),
      fetch(`${apiBase}/api/v1/ai-insights`).then(res => res.json())
    ])
      .then(([summaryData, insightsData]) => {
        setSummary(summaryData);
        setInsights(insightsData);
      })
      .catch(err => {
        console.error(err);
        // Clean fallback structures matching our explicit interfaces
        setSummary({
          total_active_suppliers: 100,
          critical_suppliers: 14,
          average_lead_time_days: 34.2,
          global_otif_percentage: 88.42,
          procurement_spend_usd: 124892300,
          composite_risk_score: 41.5,
          co2_footprint_estimate_mt: 4892.4,
          open_purchase_orders: 142,
          recent_alerts: [
            { id: 1, severity: "CRITICAL", message: "East Asia Logistics Delay index escalated over threshold. Strategic dual-sourcing required.", timestamp: "10 mins ago" }
          ]
        });
        setInsights([
          { id: "INS-001", type: "CRITICAL", text: "Concentration exposure detected: Tier-1 suppliers exhibit combined structural risk indices exceeding critical threshold (70/100).", action: "Initiate dual-sourcing onboarding protocols." }
        ]);
      })
      .finally(() => setLoading(false));
  }, [apiBase]);

  if (loading) return <div className="text-xs font-mono text-slate-500">Hydrating Enterprise Control Telemetry...</div>;

  return (
    <div className="space-y-6 font-sans">
      {/* KPI Display Metrics Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Total Managed Capitalization</div>
          <div className="text-2xl font-bold font-mono text-white">${((summary?.procurement_spend_usd || 0) / 1e6).toFixed(1)}M</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Global Structural OTIF</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{summary?.global_otif_percentage}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Composite System Risk Index</div>
          <div className="text-2xl font-bold font-mono text-amber-500">{summary?.composite_risk_score}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Operational Bottlenecks</div>
          <div className="text-2xl font-bold font-mono text-red-400">{summary?.critical_suppliers} <span className="text-xs text-slate-500 font-normal">Nodes</span></div>
        </div>
      </div>

      {/* Analytical Viewport Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Real-Time Operation Logistics Feed</span>
          </h3>
          <div className="space-y-3">
            {summary?.recent_alerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex gap-3 text-xs font-mono">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-bold">[{alert.severity}]</span> <span className="text-slate-400">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Automated AI Advisory Guidance</span>
          </h3>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                <span className="text-red-400 font-bold block">// {insight.type}</span>
                <p className="text-slate-300 leading-normal font-sans">{insight.text}</p>
                <div className="pt-2 border-t border-slate-800/60 flex items-center text-slate-400 gap-1.5">
                  <ArrowRight className="h-3 w-3 text-emerald-500" />
                  <span>{insight.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}