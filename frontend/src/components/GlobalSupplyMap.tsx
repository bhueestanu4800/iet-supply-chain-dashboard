import { useState, useEffect } from 'react';
import { MapPin, ShieldAlert, Award, TrendingUp, HelpCircle } from 'lucide-react';
import { Supplier } from '../types';

interface GlobalSupplyMapProps {
  apiBase: string;
}

interface CountryNode {
  name: string;
  x: number;
  y: number;
  suppliers: Supplier[];
  supplierCount: number;
  avgRisk: number;
  priorityCategory: string;
}

export default function GlobalSupplyMap({ apiBase }: GlobalSupplyMapProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded layout coordinates (x: 0-800, y: 0-400) for the 12 global countries
  const countryCoords: Record<string, { x: number; y: number }> = {
    "Canada": { x: 180, y: 120 },
    "USA": { x: 200, y: 170 },
    "Brazil": { x: 280, y: 290 },
    "United Kingdom": { x: 380, y: 120 },
    "Germany": { x: 425, y: 120 },
    "UAE": { x: 505, y: 195 },
    "Saudi Arabia": { x: 480, y: 215 },
    "India": { x: 565, y: 220 },
    "China": { x: 635, y: 175 },
    "South Korea": { x: 700, y: 155 },
    "Japan": { x: 725, y: 145 },
    "Singapore": { x: 625, y: 275 }
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
        console.error('Failed to fetch suppliers:', err);
        setError('FastAPI service offline. Operating in fallback/offline mode.');
        
        // Generate mock fallback suppliers for visual map
        const mockCountries = Object.keys(countryCoords);
        const mockCats = ["Power Electronics", "Control Valves", "PLC Systems", "Gas Turbine Parts", "Industrial Semiconductors"];
        const fallbacks: Supplier[] = Array.from({ length: 100 }, (_, idx) => {
          const country = mockCountries[idx % mockCountries.length];
          const risk = 15 + (idx * 3.3) % 70; // 15 to 85
          return {
            supplier_id: `SUP${idx + 1:03d}`,
            name: `Supplier ${idx + 1}`,
            country: country,
            category: mockCats[idx % mockCats.length],
            base_lead_time_days: 10 + (idx * 5) % 150,
            historic_defect_rate: 0.001 + (idx * 0.0005) % 0.04,
            spend_usd: 100000 + (idx * 15000) % 2000000,
            risk_score: parseFloat(risk.toFixed(2))
          };
        });
        setSuppliers(fallbacks);
      } finally {
        setLoading(false);
      }
    }
    fetchSuppliers();
  }, [apiBase]);

  // Aggregate country statistics dynamically
  const getCountryNodes = (): CountryNode[] => {
    const nodesMap: Record<string, Supplier[]> = {};
    Object.keys(countryCoords).forEach(c => {
      nodesMap[c] = [];
    });

    suppliers.forEach(s => {
      if (nodesMap[s.country]) {
        nodesMap[s.country].push(s);
      }
    });

    return Object.entries(countryCoords).map(([name, coords]) => {
      const countrySuppliers = nodesMap[name] || [];
      const supplierCount = countrySuppliers.length;
      
      const avgRisk = supplierCount > 0 
        ? countrySuppliers.reduce((acc, curr) => acc + curr.risk_score, 0) / supplierCount 
        : 0;

      // Determine priority category (category with highest spend in this country)
      const spendByCat: Record<string, number> = {};
      countrySuppliers.forEach(s => {
        spendByCat[s.category] = (spendByCat[s.category] || 0) + s.spend_usd;
      });
      const priorityCategory = Object.entries(spendByCat).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        name,
        x: coords.x,
        y: coords.y,
        suppliers: countrySuppliers,
        supplierCount,
        avgRisk: parseFloat(avgRisk.toFixed(2)),
        priorityCategory
      };
    });
  };

  const nodes = getCountryNodes();

  // If no country is selected, select the first node by default on load
  useEffect(() => {
    if (nodes.length > 0 && !selectedCountry) {
      const activeNode = nodes.find(n => n.supplierCount > 0);
      if (activeNode) setSelectedCountry(activeNode);
    }
  }, [suppliers]);

  // Helper to determine dot color by average risk
  const getStatusColor = (risk: number) => {
    if (risk === 0) return 'fill-slate-600 stroke-slate-500';
    if (risk < 30) return 'fill-status-optimal/80 stroke-status-optimal animate-pulse';
    if (risk < 50) return 'fill-status-caution/80 stroke-status-caution animate-pulse';
    return 'fill-status-critical/80 stroke-status-critical animate-pulse';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Interactive SVG World Map Canvas */}
        <div className="xl:col-span-2 card-industrial space-y-2 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Global Supply Chain Asset Centers</h3>
              <p className="text-[10px] text-slate-400">Regional logistics nodes sized by density & colored by cumulative risk weight</p>
            </div>
            
            {/* Map Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-status-optimal inline-block" />
                <span>Low Risk (&lt;30)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-status-caution inline-block" />
                <span>Medium Risk (30-50)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-status-critical inline-block" />
                <span>Critical Risk (&gt;50)</span>
              </div>
            </div>
          </div>

          {/* SVG Map Layout */}
          <div className="w-full flex-grow flex items-center justify-center bg-slate-950/20 rounded p-1">
            <svg 
              viewBox="0 0 800 400" 
              className="w-full h-auto max-h-[380px] text-slate-800 select-none"
            >
              {/* World outline vectors (abstract schematic grid lines) */}
              <line x1="0" y1="100" x2="800" y2="100" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="200" x2="800" y2="200" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="300" x2="800" y2="300" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="400" y1="0" x2="400" y2="400" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="600" y1="0" x2="600" y2="400" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Connecting logistics routes (bezier paths) to select nodes */}
              {selectedCountry && nodes.map((node, i) => {
                if (node.name !== selectedCountry.name && node.supplierCount > 0) {
                  // Draw arc from nodes to selected node
                  const dx = selectedCountry.x - node.x;
                  const dy = selectedCountry.y - node.y;
                  const cx = (node.x + selectedCountry.x) / 2;
                  const cy = (node.y + selectedCountry.y) / 2 - Math.abs(dx) * 0.15;
                  return (
                    <path
                      key={`arc-${i}`}
                      d={`M ${node.x} ${node.y} Q ${cx} ${cy} ${selectedCountry.x} ${selectedCountry.y}`}
                      fill="none"
                      stroke="#4682b4"
                      strokeWidth="0.75"
                      strokeOpacity="0.25"
                      strokeDasharray="4,4"
                    />
                  );
                }
                return null;
              })}

              {/* Draw country nodes */}
              {nodes.map((node, idx) => {
                if (node.supplierCount === 0) return null;
                
                const isSelected = selectedCountry?.name === node.name;
                const dotRadius = Math.max(7, Math.min(22, 6 + node.supplierCount * 1.2));
                const statusClass = getStatusColor(node.avgRisk);

                return (
                  <g 
                    key={idx} 
                    className="cursor-pointer" 
                    onClick={() => setSelectedCountry(node)}
                  >
                    {/* Ring selector for active node */}
                    {isSelected && (
                      <circle 
                        cx={node.x} 
                        cy={node.y} 
                        r={dotRadius + 6} 
                        fill="none" 
                        stroke="#4682b4" 
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    )}
                    
                    {/* Main Node Circle */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={dotRadius} 
                      className={`${statusClass} stroke-[2.5]`}
                      fillOpacity={isSelected ? 0.95 : 0.70}
                    />

                    {/* Node Text Label */}
                    <text 
                      x={node.x} 
                      y={node.y - dotRadius - 5} 
                      textAnchor="middle" 
                      className={`text-[9px] font-bold ${
                        isSelected ? 'fill-slate-100' : 'fill-slate-400'
                      }`}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Country Details Drawer */}
        <div className="card-industrial flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <MapPin size={12} className="text-brand-steel" />
              <span>Operational Node Analysis</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{selectedCountry?.name ?? 'Select a Node'}</h3>
          </div>

          {selectedCountry ? (
            <div className="space-y-4 flex-grow flex flex-col justify-between">
              {/* Country Stats Panel */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
                  <span className="metric-header">Supplier Count</span>
                  <span className="text-base font-bold text-slate-200">{selectedCountry.supplierCount} firms</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-850">
                  <span className="metric-header">Avg Risk Score</span>
                  <span className={`text-base font-bold ${
                    selectedCountry.avgRisk < 30 ? 'text-status-optimal' :
                    selectedCountry.avgRisk < 50 ? 'text-status-caution' :
                    'text-status-critical'
                  }`}>{selectedCountry.avgRisk}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-850 col-span-2">
                  <span className="metric-header">Primary Procurement Area</span>
                  <span className="text-xs font-semibold text-slate-200 block truncate">{selectedCountry.priorityCategory}</span>
                </div>
              </div>

              {/* Local Suppliers List */}
              <div className="space-y-2 flex-grow mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Sourced Supplier Profiles</span>
                <div className="overflow-y-auto max-h-[170px] space-y-1.5 pr-1">
                  {selectedCountry.suppliers.map((s) => (
                    <div 
                      key={s.supplier_id} 
                      className="p-2 rounded bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{s.name}</span>
                        <span className="text-[9px] text-slate-400">{s.category}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`font-mono font-bold block ${
                          s.risk_score < 30 ? 'text-status-optimal' :
                          s.risk_score < 50 ? 'text-status-caution' :
                          'text-status-critical'
                        }`}>{s.risk_score}</span>
                        <span className="text-[8px] text-slate-500">Risk</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
              <HelpCircle size={28} className="text-slate-650 mb-2" />
              <span>Select a coordinate node on the map to query region attributes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
