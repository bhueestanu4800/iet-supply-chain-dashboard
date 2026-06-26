import { useState, useEffect } from 'react';
import { Search, Download, ArrowUpDown, ShieldAlert, Check } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierPerformanceProps {
  apiBase: string;
}

export default function SupplierPerformance({ apiBase }: SupplierPerformanceProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [sortField, setSortField] = useState<keyof Supplier>('supplier_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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
        const fallbacks: Supplier[] = Array.from({ length: 100 }, (_, idx) => {
          const country = countries[idx % countries.length];
          const category = categories[idx % categories.length];
          const risk = 15 + (idx * 3.3) % 70;
          return {
            supplier_id: `SUP${idx + 1:03d}`,
            name: `Supplier ${idx + 1} Corp`,
            country: country,
            category: category,
            base_lead_time_days: 15 + (idx * 7) % 150,
            historic_defect_rate: 0.001 + (idx * 0.0004) % 0.045,
            spend_usd: 50000 + (idx * 27000) % 2500000,
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

  // Handle headers sorting
  const requestSort = (field: keyof Supplier) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Compile filter lists
  const categories = ['ALL', ...Array.from(new Set(suppliers.map(s => s.category)))];
  const countries = ['ALL', ...Array.from(new Set(suppliers.map(s => s.country)))];

  // Process filters and sorts
  const filteredSuppliers = suppliers
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.supplier_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchCountry = selectedCountry === 'ALL' || s.country === selectedCountry;
      return matchSearch && matchCategory && matchCountry;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  // Risk Rating Colors Class mapping
  const getRiskBadge = (score: number) => {
    if (score < 25) {
      return { label: 'Optimal', style: 'bg-status-optimal/15 text-status-optimal border-status-optimal/25' };
    }
    if (score < 40) {
      return { label: 'Low', style: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
    if (score < 60) {
      return { label: 'Caution', style: 'bg-status-caution/15 text-status-caution border-status-caution/25' };
    }
    return { label: 'Critical', style: 'bg-status-critical/15 text-status-critical border-status-critical/25' };
  };

  // Functional CSV Export
  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = ['Supplier ID', 'Name', 'Country', 'Category', 'Base Lead Time (Days)', 'Defect Rate', 'Spend (USD)', 'Risk Score'];
      const rows = filteredSuppliers.map(s => [
        s.supplier_id,
        s.name,
        s.country,
        s.category,
        s.base_lead_time_days,
        (s.historic_defect_rate * 100).toFixed(2) + '%',
        s.spend_usd.toFixed(2),
        s.risk_score
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `iet_supplier_performance_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export failure:', err);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-slate-900/80 border-l-2 border-status-caution px-3 py-2 text-xs text-status-caution flex items-center gap-2 rounded-r">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Control Actions & Filter Panel */}
      <div className="card-industrial grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Supplier name/ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded text-xs bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-550 focus:outline-none focus:border-brand-steel focus:ring-1 focus:ring-brand-steel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</span>
          <select
            className="flex-grow py-1.5 px-2 rounded text-xs bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none focus:border-brand-steel"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Country</span>
          <select
            className="flex-grow py-1.5 px-2 rounded text-xs bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none focus:border-brand-steel"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {countries.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Export Action */}
        <div className="flex justify-end">
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="interactive-btn flex items-center gap-1.5 text-xs text-brand-steel bg-brand-steel/10 hover:bg-brand-steel/20 border-brand-steel/20"
          >
            {exporting ? <Check size={12} className="text-status-optimal" /> : <Download size={12} />}
            <span>{exporting ? 'Exported' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Database Table Container */}
      <div className="card-industrial overflow-x-auto min-h-[350px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-xs">Loading Suppliers Database...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-550 text-xs">No records found matching search filters.</div>
        ) : (
          <table className="table-dense">
            <thead>
              <tr>
                <th onClick={() => requestSort('supplier_id')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1">ID <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('name')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1">Supplier <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('category')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1">Category <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('country')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1">Country <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('base_lead_time_days')} className="cursor-pointer select-none text-right">
                  <div className="flex items-center gap-1 justify-end">Lead Time <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('historic_defect_rate')} className="cursor-pointer select-none text-right">
                  <div className="flex items-center gap-1 justify-end">Defect Rate <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('spend_usd')} className="cursor-pointer select-none text-right">
                  <div className="flex items-center gap-1 justify-end">Spend (USD) <ArrowUpDown size={10} /></div>
                </th>
                <th onClick={() => requestSort('risk_score')} className="cursor-pointer select-none text-right">
                  <div className="flex items-center gap-1 justify-end">Risk Score <ArrowUpDown size={10} /></div>
                </th>
                <th className="text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => {
                const badge = getRiskBadge(supplier.risk_score);
                return (
                  <tr key={supplier.supplier_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="font-mono text-[10px] text-slate-400 font-bold">{supplier.supplier_id}</td>
                    <td className="font-bold text-slate-200">{supplier.name}</td>
                    <td>{supplier.category}</td>
                    <td>{supplier.country}</td>
                    <td className="text-right font-mono font-medium">{supplier.base_lead_time_days} days</td>
                    <td className="text-right font-mono font-medium text-slate-350">
                      {(supplier.historic_defect_rate * 100).toFixed(2)}%
                    </td>
                    <td className="text-right font-mono font-bold text-slate-250">
                      ${supplier.spend_usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right font-mono font-bold text-slate-200">{supplier.risk_score}</td>
                    <td className="text-right">
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
