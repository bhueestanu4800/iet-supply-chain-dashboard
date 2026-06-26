import { useState, useEffect, useRef } from 'react';
import { Sliders, ShieldAlert, AlertTriangle, RefreshCw, HelpCircle, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { SimulationPayload, SimulationResults } from '../types';

interface OTIFSimulatorProps {
  apiBase: string;
}

export default function OTIFSimulator({ apiBase }: OTIFSimulatorProps) {
  // Input parameters state
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
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Trigger evaluation fetch
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
      
      // Perform local offline simulation fallback math matching backend model
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
      const rFactor = Math.max(0.0, Math.min(1.0, (payload.supplier_delay / 30 * 0.20 + payload.port_congestion / 15 * 0.15 + payload.demand_increase * 0.10 + payload.material_shortage * 0.25 + payload.weather_impact * 0.15 + payload.geopolitical_risk * 0.15)));
      
      setResults({
        forecasted_otif_pct: parseFloat(forecastedOtif.toFixed(2)),
        production_delays_days: parseFloat(delays.toFixed(1)),
        inventory_impact_ratio: parseFloat(invRatio.toFixed(2)),
        revenue_risk_usd: parseFloat((totalOpen * rFactor).toFixed(2)),
        open_po_pool_value_usd: totalOpen
      });
    } finally {
      setLoading(false);
    }
  };

  // Run on input change with small debouncer (250ms) to prevent slamming backend
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      evaluateSimulation(inputs);
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputs]);

  // Reset inputs
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

  // Helper for rendering OTIF color classes
  const getOTIFColor = (otif: number) => {
    if (otif > 85) return 'text-status-optimal';
    if (otif > 70) return 'text-status-caution';
    return 'text-status-critical';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sliders Input Panel */}
        <div className="lg:col-span-1 card-industrial space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-slate-350 text-[11px] font-bold uppercase tracking-wider">
                <Sliders size={14} className="text-brand-steel" />
                <span>Simulation Parameters</span>
              </div>
              <button 
                onClick={handleReset}
                className="text-[9px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400 hover:text-slate-200"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {/* Supplier Delay slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Supplier Latency</span>
                  <span className="font-mono font-bold text-brand-steel">{inputs.supplier_delay} Days</span>
                </div>
                <input 
                  type="range" min="0" max="30" step="1"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.supplier_delay}
                  onChange={(e) => setInputs({ ...inputs, supplier_delay: parseInt(e.target.value) })}
                />
              </div>

              {/* Port Congestion slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Port Congestion Delay</span>
                  <span className="font-mono font-bold text-brand-steel">{inputs.port_congestion} Days</span>
                </div>
                <input 
                  type="range" min="0" max="15" step="1"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.port_congestion}
                  onChange={(e) => setInputs({ ...inputs, port_congestion: parseInt(e.target.value) })}
                />
              </div>

              {/* Demand Surge Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Demand Increase</span>
                  <span className="font-mono font-bold text-brand-steel">+{Math.round(inputs.demand_increase * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.0" max="1.0" step="0.05"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.demand_increase}
                  onChange={(e) => setInputs({ ...inputs, demand_increase: parseFloat(e.target.value) })}
                />
              </div>

              {/* Material Shortage Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Material Shortage</span>
                  <span className="font-mono font-bold text-brand-steel">{Math.round(inputs.material_shortage * 100)}% Index</span>
                </div>
                <input 
                  type="range" min="0.0" max="1.0" step="0.05"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.material_shortage}
                  onChange={(e) => setInputs({ ...inputs, material_shortage: parseFloat(e.target.value) })}
                />
              </div>

              {/* Weather Impact Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Weather Severity</span>
                  <span className="font-mono font-bold text-brand-steel">{Math.round(inputs.weather_impact * 100)}% severity</span>
                </div>
                <input 
                  type="range" min="0.0" max="1.0" step="0.05"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.weather_impact}
                  onChange={(e) => setInputs({ ...inputs, weather_impact: parseFloat(e.target.value) })}
                />
              </div>

              {/* Geopolitical Risk Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Geopolitical Friction</span>
                  <span className="font-mono font-bold text-brand-steel">{Math.round(inputs.geopolitical_risk * 100)}% Friction</span>
                </div>
                <input 
                  type="range" min="0.0" max="1.0" step="0.05"
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-steel border border-slate-850"
                  value={inputs.geopolitical_risk}
                  onChange={(e) => setInputs({ ...inputs, geopolitical_risk: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-550 border-t border-slate-900 pt-3">
            Simulates sensitivity matrices modeling risk impacts on global logistics pathways.
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 card-industrial flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Sensitivity Analysis Outputs</h3>
              <p className="text-[10px] text-slate-400">Predicted system changes matching parameters</p>
            </div>
            
            {loading && (
              <RefreshCw size={14} className="animate-spin text-brand-steel" />
            )}
          </div>

          {results ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow mt-4">
              {/* Circular Gauge for Predicted OTIF */}
              <div className="bg-slate-950/60 p-4 rounded border border-slate-850 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Predicted OTIF Score</span>
                
                {/* SVG Dial */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                    {/* Foreground progress circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke={results.forecasted_otif_pct > 80 ? '#10b981' : results.forecasted_otif_pct > 65 ? '#f59e0b' : '#ef4444'} 
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * results.forecasted_otif_pct) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${getOTIFColor(results.forecasted_otif_pct)}`}>
                      {results.forecasted_otif_pct}%
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Delivery Rate</span>
                  </div>
                </div>
              </div>

              {/* Grid of details stats */}
              <div className="flex flex-col justify-between space-y-3">
                {/* Latency card */}
                <div className="bg-slate-950/60 p-3 rounded border border-slate-850 flex items-center gap-3">
                  <Clock className="text-brand-steel flex-shrink-0" size={18} />
                  <div>
                    <span className="metric-header font-bold">Production Latency</span>
                    <span className="text-base font-bold text-slate-200">{results.production_delays_days} Days</span>
                    <span className="text-[9px] text-slate-450 block">Cumulative delays in operations pipeline</span>
                  </div>
                </div>

                {/* Inventory card */}
                <div className="bg-slate-950/60 p-3 rounded border border-slate-850 flex items-center gap-3">
                  <Sliders className="text-status-caution flex-shrink-0" size={18} />
                  <div>
                    <span className="metric-header font-bold">Safety Stock depletion</span>
                    <span className="text-base font-bold text-slate-200">
                      {Math.round((1.0 - results.inventory_impact_ratio) * 100)}% Decrease
                    </span>
                    <span className="text-[9px] text-slate-450 block">Inventory level multiplier: {results.inventory_impact_ratio}x</span>
                  </div>
                </div>

                {/* Revenue at Risk card */}
                <div className={`p-3 rounded border flex items-center gap-3 ${
                  results.revenue_risk_usd > 1000000 
                    ? 'bg-status-critical/5 border-status-critical/20' 
                    : 'bg-slate-950/60 border-slate-850'
                }`}>
                  <DollarSign className={results.revenue_risk_usd > 1000000 ? 'text-status-critical' : 'text-status-optimal'} size={18} />
                  <div>
                    <span className="metric-header font-bold">Revenue At Risk (Open POs)</span>
                    <span className={`text-base font-bold ${
                      results.revenue_risk_usd > 1000000 ? 'text-status-critical' : 'text-status-optimal'
                    }`}>
                      ${results.revenue_risk_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-450 block">Open PO value: ${results.open_po_pool_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Warning flags */}
              <div className="md:col-span-2 bg-slate-950/20 p-3 rounded border border-slate-850/60 text-xs text-slate-400">
                {results.forecasted_otif_pct < 75.0 ? (
                  <div className="flex items-start gap-2 text-status-critical">
                    <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[10px] uppercase tracking-wider block">Critical Disruption Risk</span>
                      Predicted OTIF values fell below critical targets. Supplier congestion and component shortages represent severe blockages. Immediate logistics rerouting advised.
                    </div>
                  </div>
                ) : results.forecasted_otif_pct < 83.0 ? (
                  <div className="flex items-start gap-2 text-status-caution">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[10px] uppercase tracking-wider block">Operational Warning</span>
                      Production pipeline margins are narrow. Watch lead times and material inventory capacity in power electronics and gas turbine parts.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-status-optimal">
                    <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[10px] uppercase tracking-wider block">Operational Stability Secure</span>
                      SLA thresholds indicate high safety margins. Inventory replenishment is balanced, and forecasted delivery targets will maintain on-time rates.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-grow text-slate-550 text-xs">
              Waiting for simulation parameters to resolve...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
