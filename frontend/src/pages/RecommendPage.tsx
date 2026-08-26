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
  Scale,
  RefreshCw,
  Monitor,
  HardDrive,
  Check,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  IndianRupee,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

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
    return b ? parseInt(b, 10) : 100000;
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
      desc: 'Web browsing, video calls, office docs, spreadsheets & media streaming.',
      icon: ThumbsUp,
      recommendedBudget: 65000
    },
    {
      id: 'student',
      title: 'Student & Mobility',
      desc: 'All-day classroom battery, featherlight backpack weight, durable keyboard.',
      icon: Battery,
      recommendedBudget: 80000
    },
    {
      id: 'coding',
      title: 'Software Development',
      desc: 'Fast CPU compiling, 16GB-32GB RAM for containers, IDEs & multitasking.',
      icon: Cpu,
      recommendedBudget: 125000
    },
    {
      id: 'creative',
      title: 'Creative Workstation',
      desc: 'Color-accurate OLED display, 4K video editing, Photoshop & graphic design.',
      icon: Monitor,
      recommendedBudget: 160000
    },
    {
      id: 'gaming',
      title: 'High-FPS Gaming',
      desc: 'Dedicated NVIDIA RTX GPU, high refresh rate display, advanced cooling.',
      icon: Sparkles,
      recommendedBudget: 140000
    },
    {
      id: 'business',
      title: 'Business & Travel',
      desc: 'Enterprise security, ultra-thin chassis, Thunderbolt docks, reliable support.',
      icon: Sliders,
      recommendedBudget: 110000
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
          <span>Interactive TrueSpec Advisor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Your Perfect Laptop
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Tell us about your budget in INR (₹), your daily tasks, and what you care most about. We will match you with the best laptops backed by verified customer feedback.
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
                {step === 2 && 'Step 2: Budget (₹ INR)'}
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
                  <p className="text-xs text-slate-500">We will prioritize CPU speed, graphics capability, or battery life based on your answer.</p>
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
                          if (budgetMax === 100000) {
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

            {/* Step 2: Budget in INR */}
            {step === 2 && (
              <div className="space-y-6 max-w-xl mx-auto py-2">
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-bold text-slate-900">What is your maximum target budget?</h2>
                  <p className="text-xs text-slate-500">We will find laptops that deliver the best value and sentiment under this ceiling.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="text-4xl font-extrabold text-truespec-700">
                    {formatINR(budgetMax)}
                  </div>
                  
                  <input
                    type="range"
                    min={35000}
                    max={350000}
                    step={5000}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-truespec-600"
                  />

                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>₹35,000</span>
                    <span>₹1,50,000</span>
                    <span>₹3,50,000</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {[50000, 75000, 100000, 150000, 200000, 250000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudgetMax(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        budgetMax === val
                          ? 'bg-truespec-600 text-white border-truespec-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatINR(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Priority Weights */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">What features matter most to you?</h2>
                  <p className="text-xs text-slate-500">Rate the importance of each dimension from 1 (Low) to 5 (Critical).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'performance', label: 'Processing Speed & Power', desc: 'Faster app loading, instant multitasking, compiling.' },
                    { key: 'batteryLife', label: 'Battery Runtime', desc: 'Hours of cordless work away from wall sockets.' },
                    { key: 'portability', label: 'Lightweight Portability', desc: 'Easy to carry in your backpack or shoulder bag.' },
                    { key: 'display', label: 'Screen Sharpness & Smoothness', desc: 'High refresh rate (120Hz), vivid color and brightness.' },
                    { key: 'sentimentConfidence', label: 'Verified Real-User Satisfaction', desc: 'High percentage of positive, spam-free customer reviews.' },
                    { key: 'valueForMoney', label: 'Value for Money', desc: 'Maximum hardware capability per Rupee spent.' }
                  ].map((p) => {
                    const val = (priorityWeights as any)[p.key];
                    return (
                      <div key={p.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{p.label}</h4>
                            <p className="text-[11px] text-slate-500">{p.desc}</p>
                          </div>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-truespec-100 text-truespec-800">
                            {val}/5
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setPriorityWeights(prev => ({ ...prev, [p.key]: lvl }))}
                              className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                                lvl <= val
                                  ? 'bg-truespec-600 text-white'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Operating System, Brands & Screen */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Any operating system or brand preferences?</h2>
                  <p className="text-xs text-slate-500">Optional: refine your search if you prefer a specific ecosystem.</p>
                </div>

                <div className="space-y-5">
                  {/* OS */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Operating System
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'any', label: 'Any OS (Windows or macOS)' },
                        { id: 'windows', label: 'Windows 11 Only' },
                        { id: 'macos', label: 'macOS (Apple Mac) Only' }
                      ].map((os) => (
                        <button
                          key={os.id}
                          type="button"
                          onClick={() => setPreferredOs(os.id as any)}
                          className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                            preferredOs === os.id
                              ? 'bg-truespec-50 border-truespec-600 text-truespec-800 ring-2 ring-truespec-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {os.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screen Size */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Screen Size Preference
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { id: 'any', label: 'Any Size' },
                        { id: 'compact', label: 'Compact (<14")' },
                        { id: 'standard', label: 'Standard (14"–15.6")' },
                        { id: 'large', label: 'Large (16"+)' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setScreenPreference(s.id as any)}
                          className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                            screenPreference === s.id
                              ? 'bg-truespec-50 border-truespec-600 text-truespec-800 ring-2 ring-truespec-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brands */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Preferred Brands (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {brandList.map((brand) => {
                        const isSelected = selectedBrands.includes(brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => toggleBrand(brand)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-truespec-600 text-white border-truespec-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {brand} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Footers */}
            <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-sm transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFetchRecommendations}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-md shadow-truespec-600/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Matching Laptops...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-sky-200" />
                      <span>Find My Best Laptops</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Your Ranked Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by highest overall match percentage based on your {useCase} workflow and target budget of {formatINR(budgetMax)}.
              </p>
            </div>

            <button
              onClick={() => {
                setHasSubmitted(false);
                setStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Modify Advisor Criteria</span>
            </button>
          </div>

          {error ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
              <p className="font-bold">Error finding recommendations</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <p className="text-base font-bold text-slate-900">No laptops matched your exact constraints</p>
              <p className="text-xs text-slate-500">Try adjusting your budget slider or expanding brand preferences.</p>
              <button
                onClick={() => setHasSubmitted(false)}
                className="px-4 py-2 rounded-xl bg-truespec-600 text-white text-xs font-bold hover:bg-truespec-700"
              >
                Adjust Budget & Settings
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {recommendations.map((rec, index) => {
                const isCompared = comparedIds.has(rec.id);
                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden p-6 sm:p-7 shadow-xs hover:shadow-md ${
                      index === 0
                        ? 'border-truespec-500 ring-2 ring-truespec-500/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      {/* Left: Info & Plain Language Why */}
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {index === 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-truespec-600 text-white text-[11px] font-bold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" /> #1 Best Overall Match
                            </span>
                          )}
                          <span className="text-xs font-bold text-truespec-700 uppercase tracking-wider">
                            {rec.brand}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {rec.category}
                          </span>
                        </div>

                        <div>
                          <Link
                            to={`/laptops/${rec.id}`}
                            className="text-xl sm:text-2xl font-extrabold text-slate-900 hover:text-truespec-600 transition-colors"
                          >
                            {rec.model_name}
                          </Link>
                          <div className="text-2xl font-black text-slate-900 mt-1">
                            {formatINR(rec.price)}
                          </div>
                        </div>

                        {/* Plain English Why */}
                        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700 leading-relaxed space-y-1.5">
                          <div className="flex items-center gap-1.5 text-sky-900 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Why TrueSpec Recommends This:</span>
                          </div>
                          <p>{rec.plainEnglishExplanation}</p>
                        </div>

                        {/* Pros & Tradeoffs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                          <div className="space-y-1.5">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths:
                            </span>
                            <ul className="space-y-1 text-slate-600">
                              {rec.pros.map((p, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {rec.tradeoffs && rec.tradeoffs.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="font-bold text-amber-800 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Trade-offs to Note:
                              </span>
                              <ul className="space-y-1 text-slate-600">
                                {rec.tradeoffs.map((t, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Match Score & Action */}
                      <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between space-y-4 shrink-0">
                        <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Algorithm Match
                          </span>
                          <span className="text-3xl font-black text-truespec-700">
                            {rec.matchPercentage}%
                          </span>
                          <div className="pt-2">
                            <ConfidenceBadge
                              score={rec.confidence_score}
                              wilsonLowerBound={rec.wilson_lower_bound}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* Specs overview */}
                        <div className="text-xs text-slate-500 space-y-1.5 border-y border-slate-100 py-3">
                          <div className="flex justify-between">
                            <span>Processor:</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[120px]">{rec.cpu_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>RAM & SSD:</span>
                            <span className="font-semibold text-slate-800">{rec.ram_gb}GB • {rec.storage_gb}GB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Display:</span>
                            <span className="font-semibold text-slate-800">{rec.display_size}" @ {rec.refresh_rate}Hz</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Battery & Wt:</span>
                            <span className="font-semibold text-slate-800">{rec.battery_wh}Wh • {rec.weight_kg}kg</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-1">
                          <Link
                            to={`/laptops/${rec.id}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-truespec-600 text-white hover:bg-truespec-700 shadow-sm transition-all text-center"
                          >
                            <span>View Full Specs & Reviews</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => onToggleCompare(rec)}
                            className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              isCompared
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isCompared ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>In Comparison List</span>
                              </>
                            ) : (
                              <>
                                <Scale className="w-3.5 h-3.5 text-slate-500" />
                                <span>Add to Compare</span>
                              </>
                            )}
                          </button>
                        </div>
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
