import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getRecommendations } from '../services/api';
import { RecommendationPayload, RecommendedLaptop, Laptop } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Battery,
  Sliders,
  DollarSign,
  Scale,
  RefreshCw,
  Monitor,
  HardDrive,
  Check,
  AlertCircle,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';

interface RecommendPageProps {
  comparedLaptops: Laptop[];
  onToggleCompare: (laptop: Laptop) => void;
}

export const RecommendPage: React.FC<RecommendPageProps> = ({
  comparedLaptops,
  onToggleCompare
}) => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedLaptop[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Form State
  const [budgetMax, setBudgetMax] = useState<number>(() => {
    const b = searchParams.get('budget');
    return b ? parseInt(b, 10) : 1500;
  });

  const [useCase, setUseCase] = useState<RecommendationPayload['useCase']>(() => {
    const uc = searchParams.get('useCase') as RecommendationPayload['useCase'];
    return uc || 'everyday';
  });

  const [priorityWeights, setPriorityWeights] = useState({
    performance: 3,
    batteryLife: 4,
    portability: 3,
    display: 3,
    sentimentConfidence: 5,
    valueForMoney: 4
  });

  const [preferredOs, setPreferredOs] = useState<'any' | 'macos' | 'windows'>('any');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [screenPreference, setScreenPreference] = useState<'any' | 'compact' | 'standard' | 'large'>('any');

  const useCaseOptions = [
    {
      id: 'everyday',
      title: 'Everyday & Office',
      desc: 'Web browsing, docs, Zoom meetings, spreadsheets & media streaming.',
      icon: ThumbsUp,
      recommendedBudget: 900
    },
    {
      id: 'student',
      title: 'Student & Mobility',
      desc: 'All-day classroom battery, featherlight backpack weight, durable keyboard.',
      icon: Battery,
      recommendedBudget: 1100
    },
    {
      id: 'coding',
      title: 'Software Development',
      desc: 'Fast CPU compiling, 16GB-32GB RAM for containers & multiple IDEs.',
      icon: Cpu,
      recommendedBudget: 1600
    },
    {
      id: 'creative',
      title: 'Creative Workstation',
      desc: 'Color-accurate 2.8K/OLED display, 4K video editing & graphic design.',
      icon: Monitor,
      recommendedBudget: 1900
    },
    {
      id: 'gaming',
      title: 'High-FPS Gaming',
      desc: 'Dedicated NVIDIA RTX GPU, high refresh rate display, advanced cooling.',
      icon: Sparkles,
      recommendedBudget: 1700
    },
    {
      id: 'business',
      title: 'Business & Travel',
      desc: 'Enterprise security, ultra-thin chassis, Thunderbolt docks, reliable support.',
      icon: Sliders,
      recommendedBudget: 1400
    }
  ];

  const brandList = ['Apple', 'Dell', 'Lenovo', 'HP', 'ASUS', 'Acer', 'MSI', 'Razer', 'Microsoft', 'Samsung'];

  // Handle URL params prefill
  useEffect(() => {
    const uc = searchParams.get('useCase') as RecommendationPayload['useCase'];
    const b = searchParams.get('budget');
    if (uc && useCaseOptions.some(o => o.id === uc)) {
      setUseCase(uc);
    }
    if (b) {
      setBudgetMax(parseInt(b, 10));
    }
  }, [searchParams]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleFetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      let minScreenSize: number | undefined;
      let maxScreenSize: number | undefined;
      if (screenPreference === 'compact') maxScreenSize = 13.9;
      if (screenPreference === 'standard') { minScreenSize = 14.0; maxScreenSize = 15.6; }
      if (screenPreference === 'large') minScreenSize = 15.7;

      const payload: RecommendationPayload = {
        budgetMax,
        useCase,
        priorityWeights,
        preferredOs,
        preferredBrands: selectedBrands.length > 0 ? selectedBrands : undefined,
        minScreenSize,
        maxScreenSize
      };

      const result = await getRecommendations(payload);
      setRecommendations(result.recommendations);
      setHasSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to compute recommendations');
    } finally {
      setLoading(false);
    }
  };

  const comparedIds = new Set(comparedLaptops.map(l => l.id));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-truespec-50 text-truespec-700 text-xs font-bold border border-truespec-200">
          <Sparkles className="w-3.5 h-3.5 text-truespec-600" />
          <span>Interactive TrueSpec Wizard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Guided Laptop Advisor
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Tell us about your budget, daily routine, and priorities. We will rank models using
          hardware capability and ML-verified customer reviews.
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Step Progress Header */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-truespec-600 text-white text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {step === 1 && 'Step 1: Primary Goal'}
                {step === 2 && 'Step 2: Budget Range'}
                {step === 3 && 'Step 3: What Matters Most'}
                {step === 4 && 'Step 4: Preferences & Brands'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">Step {step} of 4</span>
          </div>

          <div className="p-6 sm:p-8">
            {/* Step 1: Use Case */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">What will you primarily use this laptop for?</h2>
                  <p className="text-xs text-slate-500">This helps us weight CPU power, GPU acceleration, and portability balance.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {useCaseOptions.map((opt) => {
                    const isSelected = useCase === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setUseCase(opt.id as any);
                          if (budgetMax === 1500) {
                            setBudgetMax(opt.recommendedBudget);
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-truespec-50/60 border-truespec-600 ring-2 ring-truespec-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-truespec-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-truespec-600" />}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">{opt.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Budget */}
            {step === 2 && (
              <div className="space-y-6 max-w-xl mx-auto py-2">
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-bold text-slate-900">What is your maximum target budget?</h2>
                  <p className="text-xs text-slate-500">We will find laptops that deliver the best value and sentiment under this ceiling.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="text-4xl font-extrabold text-truespec-700">
                    ${budgetMax.toLocaleString()}
                  </div>
                  
                  <input
                    type="range"
                    min={450}
                    max={3500}
                    step={50}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-truespec-600"
                  />

                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>$450 (Budget)</span>
                    <span>$1,500 (Mid-Range)</span>
                    <span>$2,500 (Pro)</span>
                    <span>$3,500+ (Flagship)</span>
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {[600, 900, 1200, 1600, 2000, 2500].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudgetMax(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        budgetMax === b
                          ? 'bg-truespec-600 text-white border-truespec-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ${b.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Priority Weights */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Fine-tune your hardware & review priorities</h2>
                  <p className="text-xs text-slate-500">Adjust the sliders (1 = Low Priority, 5 = Essential Must-Have).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'batteryLife', label: 'All-Day Battery Life', desc: 'Prioritize runtime away from power outlets.' },
                    { key: 'performance', label: 'Processing & Graphics Speed', desc: 'Faster compilation, rendering & frame rates.' },
                    { key: 'portability', label: 'Featherlight Portability', desc: 'Ultra-thin, lightweight under 1.4kg chassis.' },
                    { key: 'display', label: 'Screen & Display Quality', desc: 'Vibrant OLED/Retina resolution & 120Hz refresh.' },
                    { key: 'sentimentConfidence', label: 'ML Verified Review Confidence', desc: 'Heavier weight on clean, positive user sentiment.' },
                    { key: 'valueForMoney', label: 'Value Per Dollar', desc: 'Maximize hardware power relative to selling price.' },
                  ].map((item) => (
                    <div key={item.key} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">{item.label}</h3>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                        <span className="w-7 h-7 rounded-lg bg-truespec-600 text-white text-xs font-bold flex items-center justify-center">
                          {(priorityWeights as any)[item.key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={(priorityWeights as any)[item.key]}
                        onChange={(e) =>
                          setPriorityWeights({
                            ...priorityWeights,
                            [item.key]: parseInt(e.target.value, 10)
                          })
                        }
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-truespec-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Minor</span>
                        <span>Balanced</span>
                        <span>Critical</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Operating System & Brand Preferences</h2>
                  <p className="text-xs text-slate-500">Optional filters to restrict or prioritize specific ecosystems.</p>
                </div>

                <div className="space-y-4">
                  {/* OS Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Operating System</label>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                      {[
                        { id: 'any', label: 'Any OS (Windows / macOS)' },
                        { id: 'windows', label: 'Windows 11' },
                        { id: 'macos', label: 'macOS (Apple)' }
                      ].map((os) => (
                        <button
                          key={os.id}
                          type="button"
                          onClick={() => setPreferredOs(os.id as any)}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                            preferredOs === os.id
                              ? 'bg-truespec-600 text-white border-truespec-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {os.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screen Size Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Screen Size Preference</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'any', label: 'Any Size' },
                        { id: 'compact', label: 'Compact (<14")' },
                        { id: 'standard', label: 'Standard (14"-15.6")' },
                        { id: 'large', label: 'Large (16"+)' }
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setScreenPreference(sz.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                            screenPreference === sz.id
                              ? 'bg-truespec-600 text-white border-truespec-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brands Multi-Select */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Filter by Brands (Optional)
                      </label>
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {brandList.map((brand) => {
                        const isChecked = selectedBrands.includes(brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => toggleBrand(brand)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isChecked
                                ? 'bg-truespec-100 text-truespec-800 border-truespec-300 font-bold'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isChecked && <Check className="inline w-3 h-3 mr-1 text-truespec-700" />}
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer Nav */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFetchRecommendations}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-md shadow-truespec-600/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Reviews & Specs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Calculate My Laptop Matches</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Recommendation Results View */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-truespec-700">
                  Custom Results
                </span>
                <span className="text-xs text-slate-500">
                  • Budget: ${budgetMax} • Goal: {useCase.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Top {recommendations.length} Recommended Laptops
              </h2>
            </div>

            <button
              onClick={() => setHasSubmitted(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Modify Preferences</span>
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {recommendations.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No Laptops Matched Your Exact Constraints</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try slightly increasing your budget cap or relaxing brand/screen filters to discover top-rated machines.
                </p>
              </div>
              <button
                onClick={() => {
                  setBudgetMax(2000);
                  setSelectedBrands([]);
                  setPreferredOs('any');
                  setHasSubmitted(false);
                }}
                className="px-4 py-2 rounded-xl bg-truespec-600 text-white text-xs font-bold hover:bg-truespec-700"
              >
                Reset Filters & Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {recommendations.map((rec, index) => {
                const isCompared = comparedIds.has(rec.id);
                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-6 space-y-4"
                  >
                    {/* Top Row: Rank, Match %, Model, Price */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-truespec-700 uppercase tracking-wider">
                              {rec.brand}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {rec.category}
                            </span>
                          </div>
                          <Link
                            to={`/laptops/${rec.id}`}
                            className="text-lg font-bold text-slate-900 hover:text-truespec-600 transition-colors"
                          >
                            {rec.model_name}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center sm:items-end flex-row sm:flex-col justify-between sm:justify-start gap-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <span>{rec.matchPercentage}% Match</span>
                        </div>
                        <span className="text-2xl font-extrabold text-slate-900">
                          ${rec.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* TrueSpec Plain-English Recommendation Explanation */}
                    <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-100 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-truespec-800">
                        <Sparkles className="w-4 h-4 text-truespec-600" />
                        <span>Why TrueSpec Recommends This:</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        {rec.plainEnglishExplanation}
                      </p>
                    </div>

                    {/* Pros and Tradeoffs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {rec.pros.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                          <span className="font-bold text-emerald-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Key Strengths:
                          </span>
                          <ul className="space-y-1 text-slate-700">
                            {rec.pros.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rec.tradeoffs.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Trade-offs to Consider:
                          </span>
                          <ul className="space-y-1 text-slate-700">
                            {rec.tradeoffs.map((t, i) => (
                              <li key={i}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Spec badges and footer actions */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge
                          score={rec.confidence_score}
                          wilsonLowerBound={rec.wilson_lower_bound}
                          size="sm"
                        />
                        <span className="text-slate-500">
                          {rec.clean_review_count ?? 0} authentic reviews
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                          onClick={() => onToggleCompare(rec)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            isCompared
                              ? 'bg-truespec-600 text-white border-truespec-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isCompared ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Compare</span>
                            </>
                          ) : (
                            <>
                              <Scale className="w-3.5 h-3.5 text-slate-500" />
                              <span>Compare</span>
                            </>
                          )}
                        </button>

                        <Link
                          to={`/laptops/${rec.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-truespec-50 text-truespec-700 font-bold hover:bg-truespec-100 transition-colors"
                        >
                          <span>Full Breakdown & Sentiment →</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
