import React, { useState, useEffect } from 'react';
import { fetchLaptops, fetchPlatformStats } from '../services/api';
import { Laptop, PlatformStats } from '../types';
import { LaptopCard } from '../components/LaptopCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  X,
  Laptop as LaptopIcon,
  ShieldCheck
} from 'lucide-react';

interface BrowsePageProps {
  comparedLaptops: Laptop[];
  onToggleCompare: (laptop: Laptop) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ comparedLaptops, onToggleCompare }) => {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('confidence_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load stats
  useEffect(() => {
    fetchPlatformStats().then(setStats).catch(() => null);
  }, []);

  // Load laptops on filter change
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchLaptops({
          brand: selectedBrand,
          category: selectedCategory,
          minPrice,
          maxPrice,
          search,
          sortBy,
          sortOrder,
          page,
          limit: 12
        });
        setLaptops(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch laptop catalog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedBrand, selectedCategory, minPrice, maxPrice, search, sortBy, sortOrder, page]);

  const comparedIds = new Set(comparedLaptops.map(l => l.id));

  const resetFilters = () => {
    setSearch('');
    setSelectedBrand('all');
    setSelectedCategory('all');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy('confidence_score');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters =
    search !== '' ||
    selectedBrand !== 'all' ||
    selectedCategory !== 'all' ||
    minPrice != null ||
    maxPrice != null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-truespec-700 uppercase tracking-wider mb-1">
            <LaptopIcon className="w-4 h-4" />
            <span>Complete Database Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse All Scored Laptops
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Explore {totalCount} laptop models with precomputed TrueSpec confidence ratings and specs.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search model, brand, processor, GPU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-truespec-500/20 focus:border-truespec-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-truespec-500/20 text-slate-800"
            >
              <option value="all">All Brands</option>
              {(stats?.brands || ['Apple', 'Dell', 'Lenovo', 'HP', 'ASUS', 'Acer', 'MSI', 'Razer', 'Microsoft', 'Samsung']).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-truespec-500/20 text-slate-800"
            >
              <option value="all">All Categories</option>
              {(stats?.categories || ['Ultrabook', 'Gaming', 'Productivity', 'Creator', 'Business', 'Budget']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-truespec-500/20 text-slate-800"
              >
                <option value="confidence_score">TrueSpec Confidence (High to Low)</option>
                <option value="price">Price</option>
                <option value="battery_wh">Battery Capacity</option>
                <option value="weight_kg">Weight (Portability)</option>
                <option value="cpu_score">CPU Power</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Laptops Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse p-5 space-y-4" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
          <p className="font-bold">Error loading laptops</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : laptops.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-base font-bold text-slate-900">No laptops matched your active filters</p>
          <p className="text-xs text-slate-500">Try changing your search terms or clearing price and brand filters.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-truespec-600 text-white text-xs font-bold hover:bg-truespec-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laptops.map(laptop => (
              <LaptopCard
                key={laptop.id}
                laptop={laptop}
                isCompared={comparedIds.has(laptop.id)}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    p === page
                      ? 'bg-truespec-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
