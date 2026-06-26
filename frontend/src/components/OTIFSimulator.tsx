import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders, ShieldAlert, AlertTriangle, RefreshCw,
  Clock, ShieldCheck, DollarSign
} from 'lucide-react';
import { SimulationPayload, SimulationResults } from '../types';

interface OTIFSimulatorProps {
  apiBase: string;
}

export default function OTIFSimulator({ apiBase }: OTIFSimulatorProps) {
  // 1. Core Component Parameter States
  const [inputs, setInputs] = useState<SimulationPayload>({
    supplier_delay: 0,
    port_congestion: 0,
    demand_increase: 0.0,
    material_shortage: 0.0,
    weather_impact: 0.0,
    geopolitical_risk: 0.0
  });

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uses 'any' typing to cleanly bypass variable namespace collisions across deployment environments
  const debounceTimer = useRef<any>(null);

  // 2. Analytical Evaluation Microservice Handler
  const evaluateSimulation = async (payload: SimulationPayload) => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/v1/simulator/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();
      setResults(data);
      setError(null);
    } catch (err) {
      console.error('Failed to run simulation:', err);
      setError('FastAPI service offline. Running local client-side approximation.');

      // Fallback sensitivity matrices matching the backend risk distribution weights
      const baseOtif = 86.9;
      const penalty = (payload.supplier_delay * 0.35) +
        (payload.port_congestion * 0.45) +
        (payload.material_shortage * 12.0) +
        (payload.weather_impact * 8.0) +
        (payload.geopolitical_risk * 10.0);

      const forecastedOtif = Math.max(30.0, Math.min(100.0, baseOtif - penalty));

      const delays = payload.supplier_delay +
        payload.port_congestion +
        (payload.material_shortage * 22.0) +
        (payload.weather_impact * 6.5) +
        (payload.geopolitical_risk * 10.5);

      const invRatio = Math.max(0.05, 1.0 - (payload.demand_increase * 0.40 + payload.material_shortage * 0.50 + (payload.supplier_delay + payload.port_congestion) * 0.012));
      const totalOpen = 13188327.31;

      const rFactor = Math.max(0.0, Math.min(1.0,
        (payload.supplier_delay / 30) * 0.20 +
        (payload.port_congestion / 15) * 0.15 +
        payload.demand_increase * 0.25 +
        payload.weather_impact * 0.15 +
        payload.material_shortage * 0.10 +
        payload.geopolitical_risk * 0.15
      ));

      setResults({
        forecasted_otif_pct: parseFloat(forecastedOtif.toFixed(2)),
        production_delays_days: parseFloat(delays.toFixed(1)),
        inventory_impact_pct: parseFloat((invRatio * 100).toFixed(1)),
        revenue_risk_usd: parseFloat((totalOpen * rFactor).toFixed(2)),
        open_po_pool_value_usd: totalOpen
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Operational Telemetry Debouncer (250ms Target Window)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      evaluateSimulation(inputs);
    }, 250);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputs]);

  const handleReset = () => {
    setInputs({
      supplier_delay: 0,
      port_congestion: 0,
      demand_increase: 0.0,
      material_shortage: 0.0,
      weather_impact: 0.0,
      geopolitical_risk: 0.0
    });
  };

  const getOTIFColor = (otif: number) => {
    if (otif > 85) return 'text-emerald-400';
    if (otif > 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4 font-sans">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-amber-500 px-3 py-2 text-xs text-amber-500 flex items-center gap-2 rounded-r font-mono">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sliders Input Control Console */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold uppercase tracking-wider font-mono">
                <Sliders size={14} className="text-emerald-500" />
                <span>Simulation Configuration</span>
              </div>
              <button onClick={handleReset} className="text-[9px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-slate-200 uppercase tracking-wider font-mono">
                Reset Matrix
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Supplier Latency Override</span>
                  <span className="font-mono font-bold text-emerald-400">{inputs.supplier_delay} Days</span>
                </div>
                <input type="range" min="0" max="30" step="1" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.supplier_delay} onChange={(e) => setInputs({ ...inputs, supplier_delay: parseInt(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Port Congestion Overhead</span>
                  <span className="font-mono font-bold text-emerald-400">{inputs.port_congestion} Days</span>
                </div>
                <input type="range" min="0" max="15" step="1" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.port_congestion} onChange={(e) => setInputs({ ...inputs, port_congestion: parseInt(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Demand Surge Multiplier</span>
                  <span className="font-mono font-bold text-emerald-400">+{Math.round(inputs.demand_increase * 100)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.05" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.demand_increase} onChange={(e) => setInputs({ ...inputs, demand_increase: parseFloat(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Material Shortage Index</span>
                  <span className="font-mono font-bold text-emerald-400">{Math.round(inputs.material_shortage * 100)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.05" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.material_shortage} onChange={(e) => setInputs({ ...inputs, material_shortage: parseFloat(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Weather Severity Factor</span>
                  <span className="font-mono font-bold text-emerald-400">{Math.round(inputs.weather_impact * 100)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.05" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.weather_impact} onChange={(e) => setInputs({ ...inputs, weather_impact: parseFloat(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Geopolitical Friction Coeff.</span>
                  <span className="font-mono font-bold text-emerald-400">{Math.round(inputs.geopolitical_risk * 100)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.05" className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer border border-slate-800" value={inputs.geopolitical_risk} onChange={(e) => setInputs({ ...inputs, geopolitical_risk: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3 font-mono">
            // Models sensitivity disruptions across primary infrastructure pathways.
          </div>
        </div>

        {/* Dynamic Telemetry Metric Output Viewport */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Sensitivity Outputs</h3>
              <p className="text-[10px] text-slate-400 font-mono">Stochastic estimations corresponding to configured delta changes</p>
            </div>
            {loading && <RefreshCw size={14} className="animate-spin text-emerald-400" />}
          </div>

          {results ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow mt-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4 font-mono">Predicted System OTIF Rate</span>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" fill="none" stroke="#1e293b" strokeWidth="6" />
                    <circle cx="64" cy="64" r="50" fill="none"
                      stroke={results.forecasted_otif_pct > 80 ? '#10b981' : results.forecasted_otif_pct > 65 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="6"
                      strokeDasharray="314"
                      strokeDashoffset={314 - (314 * results.forecasted_otif_pct) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-300" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-xl font-black font-mono ${getOTIFColor(results.forecasted_otif_pct)}`}>
                      {results.forecasted_otif_pct}%
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-mono">SLA Delivery</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-3">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
                  <Clock className="text-emerald-400 flex-shrink-0" size={18} />
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-mono tracking-wider">Operational Delay Latency</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">+{results.production_delays_days} Operational Days</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
                  <Sliders className="text-amber-500 flex-shrink-0" size={18} />
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-mono tracking-wider">Safety Buffer Impact</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">{results.inventory_impact_pct}% Capital Depletion</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
                  <DollarSign className="text-red-400 flex-shrink-0" size={18} />
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase block font-mono tracking-wider">Backlog Capital Value Exposed</span>
                    <span className="text-sm font-bold text-red-400 font-mono">${results.revenue_risk_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Real-time System Threshold Warnings Block */}
              <div className="md:col-span-2 bg-slate-950/20 p-3 rounded-xl border border-slate-850/60 text-xs text-slate-400">
                {results.forecasted_otif_pct < 75.0 ? (
                  <div className="flex items-start gap-2 text-red-400 font-mono">
                    <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[9px] text-red-500">CRITICAL STRUCTURAL DISRUPTION RISK</span>
                      SLA allocation thresholds have dropped below enterprise safety limits. Immediate sourcing re-routing is required to protect the margin profile.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-emerald-400 font-mono">
                    <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[9px] text-emerald-500">OPERATIONAL MARGIN STABLE</span>
                      SLA delivery curves present safe parameter metrics across current asset network vectors.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-grow text-slate-500 text-xs font-mono">
              Resolving dependency graphs...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
