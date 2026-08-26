import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchLaptopComparison, fetchLaptops } from '../services/api';
import { Laptop } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import {
  Scale,
  X,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  ShieldCheck,
  Search,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface ComparePageProps {
  comparedLaptops: Laptop[];
  onRemoveCompare: (id: number) => void;
  onAddCompare: (laptop: Laptop) => void;
  onClearCompare: () => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  comparedLaptops,
  onRemoveCompare,
  onAddCompare,
  onClearCompare
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add laptop modal/popover search
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Laptop[]>([]);

  // Sync with URL or state
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const urlIds = searchParams.get('ids');
        let idsToFetch: number[] = [];

        if (urlIds) {
          idsToFetch = urlIds
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id) && id > 0);
        } else if (comparedLaptops.length > 0) {
          idsToFetch = comparedLaptops.map(l => l.id);
        }

        if (idsToFetch.length === 0) {
          // Default to top 2 laptops for comparison if empty
          const fallback = await fetchLaptops({ limit: 2 });
          setLaptops(fallback.data);
          setSearchParams({ ids: fallback.data.map(l => l.id).join(',') });
          return;
        }

        const res = await fetchLaptopComparison(idsToFetch);
        setLaptops(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to compare laptops');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  // Handle live search for adding laptops to comparison
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchLaptops({ search: searchQuery, limit: 5 });
        setSearchResults(res.data.filter(l => !laptops.some(existing => existing.id === l.id)));
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, laptops]);

  const handleRemove = (id: number) => {
    const next = laptops.filter(l => l.id !== id);
    setLaptops(next);
    onRemoveCompare(id);
    setSearchParams({ ids: next.map(l => l.id).join(',') });
  };

  const handleAdd = (laptop: Laptop) => {
    if (laptops.length >= 4) return;
    const next = [...laptops, laptop];
    setLaptops(next);
    onAddCompare(laptop);
    setSearchParams({ ids: next.map(l => l.id).join(',') });
    setIsSearching(false);
    setSearchQuery('');
  };

  // Compute best in category
  const bestCpu = laptops.length > 0 ? Math.max(...laptops.map(l => l.cpu_score)) : 0;
  const bestGpu = laptops.length > 0 ? Math.max(...laptops.map(l => l.gpu_score)) : 0;
  const bestBattery = laptops.length > 0 ? Math.max(...laptops.map(l => l.battery_wh)) : 0;
  const bestWeight = laptops.length > 0 ? Math.min(...laptops.map(l => l.weight_kg)) : 0;
  const bestConfidence = laptops.length > 0 ? Math.max(...laptops.map(l => l.confidence_score)) : 0;
  const bestPrice = laptops.length > 0 ? Math.min(...laptops.map(l => l.price)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/laptops"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Browse</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-truespec-600" />
            <span>Side-by-Side Laptop Comparison</span>
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Compare specifications, TrueSpec confidence scores, and real user review distributions in INR (₹).
          </p>
        </div>

        {laptops.length < 4 && (
          <div className="relative">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-truespec-600 text-white text-xs font-bold hover:bg-truespec-700 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Model ({laptops.length}/4)</span>
            </button>

            {isSearching && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Add to Comparison</span>
                  <button onClick={() => setIsSearching(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search model name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-truespec-500/20"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleAdd(result)}
                      className="w-full p-2 rounded-lg text-left text-xs hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{result.brand} {result.model_name}</p>
                        <p className="text-[10px] text-slate-500">{formatINR(result.price)} • {result.confidence_score}/100 Conf.</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-truespec-600" />
                    </button>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">No matching laptops found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-truespec-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading comparison metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-xs">
          {error}
        </div>
      ) : laptops.length < 2 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Select At Least 2 Laptops to Compare</h2>
          <p className="text-xs text-slate-500">Browse the catalog and click "Compare" on any model to see them side-by-side.</p>
          <Link to="/laptops" className="inline-block px-4 py-2 bg-truespec-600 text-white rounded-xl text-xs font-bold">
            Browse Laptop Catalog
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* Table Header: Models & Actions */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="p-4 sm:p-5 w-48 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Specification
                </th>
                {laptops.map((lap) => (
                  <th key={lap.id} className="p-4 sm:p-5 text-left align-top">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-truespec-700 uppercase tracking-wider">
                          {lap.brand}
                        </span>
                        <button
                          onClick={() => handleRemove(lap.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        to={`/laptops/${lap.id}`}
                        className="text-base font-bold text-slate-900 hover:text-truespec-600 transition-colors block line-clamp-2"
                      >
                        {lap.model_name}
                      </Link>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-xl font-black text-slate-900">
                          {formatINR(lap.price)}
                        </span>
                        {lap.price === bestPrice && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1">
                            Best Value Price
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Spec Matrix Rows */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row: Confidence Score */}
              <tr className="hover:bg-slate-50/50 transition-colors bg-sky-50/30">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>TrueSpec Confidence</span>
                </td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4">
                    <div className="space-y-1">
                      <ConfidenceBadge
                        score={lap.confidence_score}
                        wilsonLowerBound={lap.wilson_lower_bound}
                        size="sm"
                      />
                      {lap.confidence_score === bestConfidence && (
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3" /> Top Confidence Rating
                        </p>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Processor */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Processor (CPU)</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-1">
                    <p className="font-bold text-slate-900">{lap.cpu_name}</p>
                    <p className="text-[11px] text-slate-500">Benchmark Tier: {lap.cpu_score}/100</p>
                    {lap.cpu_score === bestCpu && (
                      <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                        Fastest CPU
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Graphics */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Graphics (GPU)</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-1">
                    <p className="font-bold text-slate-900">{lap.gpu_name}</p>
                    <p className="text-[11px] text-slate-500">GPU Tier: {lap.gpu_score}/100</p>
                    {lap.gpu_score === bestGpu && lap.gpu_score >= 60 && (
                      <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                        Most Powerful GPU
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: RAM & Storage */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">RAM & Storage</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-0.5">
                    <p className="font-bold text-slate-900">{lap.ram_gb}GB RAM</p>
                    <p className="text-slate-600">{lap.storage_gb}GB {lap.storage_type}</p>
                  </td>
                ))}
              </tr>

              {/* Row: Display */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Display Size & Hz</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-0.5">
                    <p className="font-bold text-slate-900">{lap.display_size}" Display</p>
                    <p className="text-slate-600">{lap.refresh_rate}Hz Refresh Rate</p>
                  </td>
                ))}
              </tr>

              {/* Row: Battery */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Battery Capacity</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-1">
                    <p className="font-bold text-slate-900">{lap.battery_wh} Watt-Hours</p>
                    {lap.battery_wh === bestBattery && (
                      <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        Largest Battery
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Weight */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Weight & Portability</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-1">
                    <p className="font-bold text-slate-900">{lap.weight_kg} kg</p>
                    {lap.weight_kg === bestWeight && (
                      <span className="inline-block text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">
                        Lightest Build
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: OS & Category */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">Ecosystem & Form</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4 space-y-0.5">
                    <p className="font-semibold text-slate-800">{lap.os}</p>
                    <p className="text-slate-500">{lap.category}</p>
                  </td>
                ))}
              </tr>

              {/* Row: Actions */}
              <tr className="bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700">Action</td>
                {laptops.map((lap) => (
                  <td key={lap.id} className="p-4">
                    <Link
                      to={`/laptops/${lap.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-truespec-600 hover:text-truespec-700 hover:underline"
                    >
                      <span>Read Reviews & Deep Dive →</span>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
