import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  BrainCircuit,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  // Interactive Wilson Simulator State
  const [simPositive, setSimPositive] = useState<number>(90);
  const [simTotal, setSimTotal] = useState<number>(100);

  // Wilson Score Lower Bound Calculation (z = 1.96 for 95% confidence)
  const z = 1.96;
  const z2 = z * z;
  const n = Math.max(1, simTotal);
  const p = Math.min(1, Math.max(0, simPositive / n));

  const numerator = p + (z2 / (2 * n)) - z * Math.sqrt((p * (1 - p) + (z2 / (4 * n))) / n);
  const denominator = 1 + (z2 / n);
  const wilsonLowerBound = Math.max(0, Math.min(1, numerator / denominator));

  // TrueSpec Confidence Score formula:
  // Combines Wilson lower bound (70% weight) with volume/cleanliness factor (30% weight)
  const volumeFactor = Math.min(1.0, Math.log(n + 1) / Math.log(101));
  const simConfidenceScore = Math.min(100, Math.round((wilsonLowerBound * 70) + (volumeFactor * 30)));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-truespec-50 text-truespec-700 text-xs font-bold border border-truespec-200">
          <BrainCircuit className="w-3.5 h-3.5 text-truespec-600" />
          <span>TrueSpec Research & ML Whitepaper</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Algorithmic Transparency & Scoring Methodology
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          How TrueSpec replaces subjective star ratings with statistical confidence intervals,
          multi-heuristic fraud filtering, and aspect-level NLP sentiment models.
        </p>
      </div>

      {/* 1. Interactive Wilson Score Simulator */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-truespec-100 text-truespec-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Simulator: Wilson Score Lower Bound
            </h2>
            <p className="text-xs text-slate-500">
              Adjust positive and total reviews to see why 2/2 five-star reviews is mathematically riskier than 180/200 90% reviews.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Controls */}
          <div className="space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Total Clean Reviews (N)</span>
                <span className="text-truespec-700">{simTotal} reviews</span>
              </div>
              <input
                type="range"
                min={2}
                max={300}
                value={simTotal}
                onChange={(e) => {
                  const newTotal = parseInt(e.target.value, 10);
                  setSimTotal(newTotal);
                  if (simPositive > newTotal) setSimPositive(newTotal);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-truespec-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Positive Reviews Count</span>
                <span className="text-emerald-700">{simPositive} positive ({((simPositive / n) * 100).toFixed(0)}%)</span>
              </div>
              <input
                type="range"
                min={0}
                max={simTotal}
                value={simPositive}
                onChange={(e) => setSimPositive(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Quick Test Presets */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 self-center">Presets:</span>
              <button
                onClick={() => { setSimTotal(2); setSimPositive(2); }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                2 / 2 (100% Raw - High Risk)
              </button>
              <button
                onClick={() => { setSimTotal(200); setSimPositive(180); }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                180 / 200 (90% Raw - High Trust)
              </button>
              <button
                onClick={() => { setSimTotal(50); setSimPositive(45); }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                45 / 50 (90% Mid-Volume)
              </button>
            </div>
          </div>

          {/* Computed Math Output */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-sky-400 font-bold">
                Computed TrueSpec Score
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                α = 0.05 (95% CI)
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{simConfidenceScore}</span>
              <span className="text-lg font-bold text-slate-400">/ 100</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Raw Positive Ratio:</span>
                <span className="font-bold text-white">{((simPositive / n) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wilson 95% Lower Bound:</span>
                <span className="font-bold text-emerald-400">{(wilsonLowerBound * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sample Size Penalty:</span>
                <span className="font-bold text-amber-400">
                  {n < 10 ? 'Severe (Under 10 reviews)' : n < 50 ? 'Moderate (10-50 reviews)' : 'Minimal (50+ reviews)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The 6 Fake Review Heuristics */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              The 6 Multi-Heuristic Fraud Detection Rules
            </h2>
            <p className="text-xs text-slate-500">
              TrueSpec flags and filters suspicious reviews when 2 or more heuristics trigger simultaneously.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {[
            {
              id: '1',
              title: 'Duplicate Copy Hash (O(N))',
              desc: 'Identifies copy-pasted bot spam across multiple models using precomputed text hash lookups.',
              badge: 'Structural'
            },
            {
              id: '2',
              title: 'Excessive All-Caps & Exclamations',
              desc: 'Detects artificial promotional shouting or hyper-enthusiastic text with >4 exclamation points.',
              badge: 'Formatting'
            },
            {
              id: '3',
              title: 'Promotional Keyword Patterns',
              desc: 'Flags promotional jargon like "100% free", "discount code", "click link", and affiliate redirects.',
              badge: 'Spam Pattern'
            },
            {
              id: '4',
              title: 'Extreme Rating + Generic Stub',
              desc: 'Flags 5-star or 1-star reviews that contain under 4 words (e.g. "great", "worst ever", "buy it").',
              badge: 'Content Depth'
            },
            {
              id: '5',
              title: 'Unverified Buyer Discrepancy',
              desc: 'Flags reviews from accounts without authenticated purchase receipts on that retailer.',
              badge: 'Account Trust'
            },
            {
              id: '6',
              title: 'Burst Velocity Anomaly',
              desc: 'Detects unnatural clusters of 5-star submissions in under 60-minute windows for the same SKU.',
              badge: 'Temporal'
            }
          ].map((h) => (
            <div key={h.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-[10px]">
                  {h.id}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {h.badge}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs">{h.title}</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. NLP Aspect Model Report */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              NLP Sentiment Model Architecture & Benchmarks
            </h2>
            <p className="text-xs text-slate-500">
              Trained on laptop review datasets with scikit-learn TF-IDF n-grams (1, 2) and token normalization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Model Comparison (Holdout Set)</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-indigo-100">
                <span className="font-semibold text-slate-800">Multinomial Naive Bayes (Champion)</span>
                <span className="font-bold text-indigo-700">F1: 0.942 • Acc: 94.5%</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-600">Logistic Regression</span>
                <span className="font-bold text-slate-700">F1: 0.928 • Acc: 93.0%</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Exported as a serialized champion model (`ml/models/sentiment_model.pkl`) and loaded directly in the batch pipeline.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-truespec-600" />
              <span>Offline Batch Database Architecture</span>
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              TrueSpec executes ML model scoring offline, storing calculated Wilson lower bounds and confidence scores
              directly into MySQL tables (`laptop_scores`, `reviews`, `laptops`). The Express.js backend delivers sub-10ms
              response times without runtime Python latency or external cloud service bottlenecks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
