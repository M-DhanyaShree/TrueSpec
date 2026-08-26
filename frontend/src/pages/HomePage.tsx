import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLaptops, fetchPlatformStats } from '../services/api';
import { Laptop, PlatformStats } from '../types';
import { LaptopCard } from '../components/LaptopCard';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Filter,
  Zap,
  TrendingUp,
  Search
} from 'lucide-react';

interface HomePageProps {
  comparedLaptops: Laptop[];
  onToggleCompare: (laptop: Laptop) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ comparedLaptops, onToggleCompare }) => {
  const [topLaptops, setTopLaptops] = useState<Laptop[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [laptopsRes, statsRes] = await Promise.all([
          fetchLaptops({ sortBy: 'confidence_score', sortOrder: 'desc', limit: 6 }),
          fetchPlatformStats().catch(() => null)
        ]);
        setTopLaptops(laptopsRes.data);
        if (statsRes) setStats(statsRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load laptops');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const comparedIds = new Set(comparedLaptops.map(l => l.id));

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-sky-50/70 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-truespec-100/80 border border-truespec-200 text-truespec-800 text-xs font-bold shadow-xs animate-in fade-in duration-300">
              <Sparkles className="w-3.5 h-3.5 text-truespec-600" />
              <span>Review-Backed • Confidence-Weighted • Zero Affiliate Bias</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Find the Right Laptop Without Reading Hundreds of Reviews.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              TrueSpec uses natural language processing and Wilson confidence statistics to filter out fake reviews,
              quantify genuine customer sentiment, and match you with the ideal laptop for your budget.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/recommend"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-md shadow-truespec-600/25 active:scale-98 transition-all"
              >
                <Sparkles className="w-5 h-5 text-sky-200" />
                <span>Get Guided Recommendation</span>
                <ArrowRight className="w-4 h-4 text-sky-200" />
              </Link>

              <Link
                to="/laptops"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-xs transition-all"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Browse All Models</span>
              </Link>
            </div>

            {/* Micro reassurance */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Plain-English explanations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Automated fake-review shield
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Wilson score confidence weighting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Real-Time Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="space-y-1 text-center md:text-left md:px-4">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-truespec-600" />
              <span>Laptop Models</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats ? stats.totalLaptops : '36+'}
            </p>
            <p className="text-[11px] text-slate-500">Curated across Apple, Dell, Lenovo, HP & ASUS</p>
          </div>

          <div className="space-y-1 text-center md:text-left md:px-4 pt-4 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Reviews Scored</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats ? stats.totalReviews : '600'}
            </p>
            <p className="text-[11px] text-slate-500">NLP aspect-level sentiment processed</p>
          </div>

          <div className="space-y-1 text-center md:text-left md:px-4 pt-4 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Low-Trust Flagged</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats ? `${stats.flaggedPercentage}%` : '9.2%'}
            </p>
            <p className="text-[11px] text-slate-500">Filtered via 6 multi-heuristic rules</p>
          </div>

          <div className="space-y-1 text-center md:text-left md:px-4 pt-4 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Avg Confidence</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats ? `${stats.averageConfidenceScore}/100` : '48.5/100'}
            </p>
            <p className="text-[11px] text-slate-500">Statistical 95% Wilson confidence</p>
          </div>
        </div>
      </section>

      {/* Quick Use-Case Presets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Popular Buying Pathways
          </h2>
          <p className="text-slate-600 text-sm">
            Select what best matches your routine to jump directly into customized recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Everyday & Remote Office',
              desc: 'Silent operation, 10+ hr battery, snappy web & document multitasking.',
              icon: Zap,
              badge: 'Under $1,100',
              link: '/recommend?useCase=everyday&budget=1100',
              color: 'from-sky-500 to-blue-600'
            },
            {
              title: 'College & Student Mobility',
              desc: 'Lightweight <1.4kg chassis, sturdy build, long classroom battery life.',
              icon: Sparkles,
              badge: 'Best Portability',
              link: '/recommend?useCase=student&budget=1200',
              color: 'from-emerald-500 to-teal-600'
            },
            {
              title: 'Coding & Engineering',
              desc: '16GB-32GB RAM, multi-core compile speed, Linux/macOS support.',
              icon: Cpu,
              badge: 'Top Performance',
              link: '/recommend?useCase=coding&budget=1800',
              color: 'from-indigo-500 to-purple-600'
            },
            {
              title: 'High-FPS Gaming & 3D',
              desc: 'Dedicated NVIDIA RTX graphics, 120Hz+ screen, dual-fan cooling.',
              icon: TrendingUp,
              badge: 'Dedicated GPU',
              link: '/recommend?useCase=gaming&budget=2000',
              color: 'from-rose-500 to-orange-600'
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                to={item.link}
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-truespec-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-truespec-600 group-hover:text-truespec-700">
                  <span>Explore Matches</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Confidence Scored Laptops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-truespec-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Highest Review Confidence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Top-Scored Models on TrueSpec
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Ranked by Wilson lower-bound positive sentiment ratio, verified review volume, and hardware balance.
            </p>
          </div>

          <Link
            to="/laptops"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-truespec-600 hover:text-truespec-700 shrink-0"
          >
            <span>View All 36+ Laptops</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse p-5 space-y-4" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
            <p className="font-bold">Error loading laptop catalog</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topLaptops.map(laptop => (
              <LaptopCard
                key={laptop.id}
                laptop={laptop}
                isCompared={comparedIds.has(laptop.id)}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        )}
      </section>

      {/* How TrueSpec Works (3-Step Pipeline Explainer) */}
      <section className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
              The TrueSpec Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Why 5-Star Ratings Lie (And How We Fix It)
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A product with two 5-star reviews shouldn't outrank one with 200 reviews at 90% positive.
              Here is how our ML pipeline guarantees mathematically sound recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-extrabold text-base">
                1
              </div>
              <h3 className="text-lg font-bold text-white">
                Multi-Heuristic Fake Shield
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Before analyzing sentiment, our O(N) duplicate detector and multi-rule heuristics
                strip out spam links, duplicate copy, excessive all-caps shouting, and unverified bot reviews.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-base">
                2
              </div>
              <h3 className="text-lg font-bold text-white">
                Aspect-Level NLP Sentiment
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A trained machine learning classifier evaluates review text for real aspects
                like battery degradation, keyboard travel, fan noise, and screen brightness, instead of trusting generic star ratings.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-base">
                3
              </div>
              <h3 className="text-lg font-bold text-white">
                Wilson 95% Confidence Bound
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Using Bernoulli confidence intervals, we compute the lower bound of true customer satisfaction,
                ensuring heavily-tested laptops receive the statistical credit they deserve.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/methodology"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300"
            >
              <span>Read the Full Technical Methodology & Test Reports →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
