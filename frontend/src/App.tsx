import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Globe,
  Users,
  Cpu,
  BarChart3,
  Truck,
  ShieldAlert,
  ShieldCheck,
  Activity
} from 'lucide-react';

// Core Dashboard Component Imports
import ExecutiveOverview from './components/ExecutiveOverview';
import GlobalSupplyMap from './components/GlobalSupplyMap';
import SupplierPerformance from './components/SupplierPerformance';
import ComponentTracker from './components/ComponentTracker';
import MaterialIntelligence from './components/MaterialIntelligence';
import LogisticsDashboard from './components/LogisticsDashboard';
import OTIFSimulator from './components/OTIFSimulator';
import SustainabilityDashboard from './components/SustainabilityDashboard';
import ExecutiveKPIDashboard from './components/ExecutiveKPIDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const apiBase = "";

  const navigationItems = [
    { id: 'overview', name: 'Executive Overview', icon: LayoutDashboard },
    { id: 'kpis', name: 'Executive KPI Suite', icon: Activity },
    { id: 'map', name: 'Global Asset Risk Map', icon: Globe },
    { id: 'suppliers', name: 'Supplier Core Ledger', icon: Users },
    { id: 'components', name: 'Critical Component Tracker', icon: Cpu },
    { id: 'materials', name: 'Raw Material Intelligence', icon: BarChart3 },
    { id: 'logistics', name: 'Global Logistics Hub', icon: Truck },
    { id: 'simulator', name: 'OTIF Stress Simulator', icon: ShieldAlert },
    { id: 'sustainability', name: 'Decarbonization Tracking', icon: ShieldCheck }
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Industrial Side Command Panel */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-20">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="h-9 w-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-mono font-black text-slate-950 text-lg">BH</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white uppercase">Baker Hughes IET</h1>
              <p className="text-xs text-slate-400 font-mono">Supply Chain Intelligence</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-150 ${isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYSTEM STATUS: ONLINE (V2.0)</span>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <h2 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
            {navigationItems.find((n) => n.id === activeTab)?.name}
          </h2>
          <div className="flex items-center space-x-4 text-xs font-mono bg-slate-800/40 px-4 py-1.5 rounded border border-slate-700/60">
            <span className="text-slate-400">TENANT CLOUD NODE:</span>
            <span className="text-emerald-400 font-bold">VERCEL-SERVERLESS</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && <ExecutiveOverview apiBase={apiBase} />}
          {activeTab === 'kpis' && <ExecutiveKPIDashboard apiBase={apiBase} />}
          {activeTab === 'map' && <GlobalSupplyMap apiBase={apiBase} />}
          {activeTab === 'suppliers' && <SupplierPerformance apiBase={apiBase} />}
          {activeTab === 'components' && <ComponentTracker apiBase={apiBase} />}
          {activeTab === 'materials' && <MaterialIntelligence apiBase={apiBase} />}
          {activeTab === 'logistics' && <LogisticsDashboard apiBase={apiBase} />}
          {activeTab === 'simulator' && <OTIFSimulator apiBase={apiBase} />}
          {activeTab === 'sustainability' && <SustainabilityDashboard apiBase={apiBase} />}
        </div>
      </main>
    </div>
  );
}