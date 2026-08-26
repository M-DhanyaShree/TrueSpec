import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLaptopDetail, fetchLaptopReviews } from '../services/api';
import { Laptop, Review } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import {
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Star,
  CheckCircle2,
  Filter,
  ArrowLeft,
  Check,
  Info,
  ShieldAlert,
  Calendar,
  UserCheck,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { formatINR, SPEC_EXPLANATIONS } from '../utils/formatters';

interface LaptopDetailPageProps {
  comparedLaptops: Laptop[];
  onToggleCompare: (laptop: Laptop) => void;
}

export const LaptopDetailPage: React.FC<LaptopDetailPageProps> = ({
  comparedLaptops,
  onToggleCompare
}) => {
  const { id } = useParams<{ id: string }>();
  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Filters
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [totalReviewPages, setTotalReviewPages] = useState<number>(1);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await fetchLaptopDetail(id!);
        setLaptop(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load laptop');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function loadReviews() {
      try {
        setReviewsLoading(true);
        const res = await fetchLaptopReviews(id!, {
          page: reviewPage,
          limit: 10,
          filter: reviewFilter
        });
        setReviews(res.data);
        setTotalReviewPages(res.pagination.totalPages);
        setTotalReviewsCount(res.pagination.total);
      } catch (err: any) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    loadReviews();
  }, [id, reviewPage, reviewFilter]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-truespec-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading laptop specifications & ML sentiment data...</p>
      </div>
    );
  }

  if (error || !laptop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
          <h2 className="text-lg font-bold">Laptop Not Found</h2>
          <p className="text-xs">{error || 'The requested laptop does not exist in the database.'}</p>
          <Link to="/laptops" className="inline-block px-4 py-2 bg-truespec-600 text-white rounded-xl text-xs font-bold">
            Back to Laptop Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isCompared = comparedLaptops.some(l => l.id === laptop.id);
  const summary = laptop.sentimentSummary;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/laptops"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Laptops</span>
        </Link>

        <button
          onClick={() => onToggleCompare(laptop)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            isCompared
              ? 'bg-truespec-600 text-white border-truespec-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isCompared ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>In Comparison Tray</span>
            </>
          ) : (
            <>
              <Scale className="w-4 h-4 text-slate-500" />
              <span>Add to Compare</span>
            </>
          )}
        </button>
      </div>

      {/* Main Spec & Confidence Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Title & Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-truespec-700 uppercase tracking-widest bg-truespec-50 px-2.5 py-1 rounded-md border border-truespec-200">
                {laptop.brand}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                {laptop.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                {laptop.os}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {laptop.model_name}
            </h1>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black text-slate-900">
                {formatINR(laptop.price)}
              </span>
              <span className="text-xs text-slate-500 font-medium">Estimated Retail Price (INR)</span>
            </div>
          </div>

          {/* Plain-English Spec Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-truespec-600" />
                <span>Plain-English Hardware Guide</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Simplified for everyone</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Cpu className="w-4 h-4 text-truespec-600" />
                  <span>Processor (CPU): {laptop.cpu_name}</span>
                </div>
                <p className="text-xs text-slate-600">{SPEC_EXPLANATIONS.cpu.simpleDesc}</p>
                <p className="text-[11px] font-semibold text-truespec-700 pt-1">Performance Tier: {laptop.cpu_score}/100</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span>Graphics (GPU): {laptop.gpu_name}</span>
                </div>
                <p className="text-xs text-slate-600">{SPEC_EXPLANATIONS.gpu.simpleDesc}</p>
                <p className="text-[11px] font-semibold text-purple-700 pt-1">3D Graphics Tier: {laptop.gpu_score}/100</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  <span>RAM & Storage: {laptop.ram_gb}GB • {laptop.storage_gb}GB</span>
                </div>
                <p className="text-xs text-slate-600">{SPEC_EXPLANATIONS.ram.simpleDesc}</p>
                <p className="text-[11px] text-slate-500 pt-1">Fast NVMe SSD storage for instant booting.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Monitor className="w-4 h-4 text-sky-600" />
                  <span>Display: {laptop.display_size}" @ {laptop.refresh_rate}Hz</span>
                </div>
                <p className="text-xs text-slate-600">
                  {laptop.refresh_rate >= 120 ? 'Ultra-fluid 120Hz+ screen with silk-smooth scrolling.' : 'Sharp standard 60Hz energy-efficient display.'}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">{laptop.display_size >= 15.6 ? 'Spacious desktop replacement' : 'Compact travel friendly'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  <span>Battery Capacity: {laptop.battery_wh} Wh</span>
                </div>
                <p className="text-xs text-slate-600">{SPEC_EXPLANATIONS.battery.simpleDesc}</p>
                <p className="text-[11px] font-semibold text-emerald-700 pt-1">{laptop.battery_wh >= 70 ? '🔋 Excellent All-Day Runtime' : 'Standard Full Workday Capacity'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <span>Chassis Weight: {laptop.weight_kg} kg</span>
                </div>
                <p className="text-xs text-slate-600">{SPEC_EXPLANATIONS.weight.simpleDesc}</p>
                <p className="text-[11px] font-semibold text-indigo-700 pt-1">{laptop.weight_kg <= 1.35 ? '🪶 Featherlight Backpack Fit' : 'Solid Workstation Build'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: TrueSpec Confidence Meter & Sentiment Distribution */}
        <div className="space-y-6">
          <ConfidenceBadge
            score={laptop.confidence_score}
            wilsonLowerBound={laptop.wilson_lower_bound}
            cleanReviewCount={laptop.clean_review_count}
            size="lg"
          />

          {/* Sentiment Breakdown Card */}
          {summary && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Review Sentiment Breakdown
                </h3>
                <span className="text-xs text-slate-500">
                  {summary.totalReviews} Total Scored
                </span>
              </div>

              {/* Progress Bar Stack */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${summary.positivePercent}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Positive: ${summary.positivePercent}%`}
                  />
                  <div
                    style={{ width: `${summary.neutralPercent}%` }}
                    className="bg-amber-400 h-full"
                    title={`Neutral: ${summary.neutralPercent}%`}
                  />
                  <div
                    style={{ width: `${summary.negativePercent}%` }}
                    className="bg-rose-500 h-full"
                    title={`Negative: ${summary.negativePercent}%`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pos: {summary.positiveCount} ({summary.positivePercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Neu: {summary.neutralCount} ({summary.neutralPercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Neg: {summary.negativeCount} ({summary.negativePercent}%)
                  </span>
                </div>
              </div>

              {/* Flagged Review Alert */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Filtered Fake Review Shield</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  TrueSpec detected and segregated <strong>{summary.flaggedReviews} suspicious reviews</strong> ({((summary.flaggedReviews / summary.totalReviews) * 100).toFixed(1)}%) from the final score to prevent rating distortion.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Authenticated User Reviews ({totalReviewsCount})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Read verified customer reviews with sentiment tags and flagged fake-detection notices.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'clean', label: 'Clean Only' },
              { id: 'positive', label: 'Positive' },
              { id: 'negative', label: 'Negative' },
              { id: 'flagged', label: 'Flagged (Spam/Fake)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setReviewFilter(f.id);
                  setReviewPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                  reviewFilter === f.id
                    ? 'bg-truespec-600 text-white border-truespec-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {reviewsLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No reviews found matching the "{reviewFilter}" filter.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const isFlagged = r.is_flagged;
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    isFlagged
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(r.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{r.rating}.0</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">{r.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sentiment Label Badge */}
                      {r.sentiment_label && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            r.sentiment_label === 'positive'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.sentiment_label === 'negative'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          NLP: {r.sentiment_label}
                        </span>
                      )}

                      {/* Flagged Badge with clear reasoning */}
                      {isFlagged ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Flagged Review (Filtered from Score)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    "{r.review_text}"
                  </p>

                  {isFlagged && (
                    <div className="text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>TrueSpec Shield Note:</strong> This review triggered spam/bot detection rules (duplicate text, unverified buyer, or promotional links) and was automatically excluded from the final TrueSpec score.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalReviewPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={reviewPage <= 1}
                  onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-semibold">
                  Page {reviewPage} of {totalReviewPages}
                </span>
                <button
                  disabled={reviewPage >= totalReviewPages}
                  onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
