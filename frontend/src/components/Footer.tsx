import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Database, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-truespec-600 flex items-center justify-center text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <span>TrueSpec Laptop Advisor</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Translating raw specifications and real user review sentiment into explainable,
              confidence-weighted laptop recommendations. Built for non-technical buyers who want
              authentic insights without promotional bias or fragmented forum research.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                <Database className="w-3.5 h-3.5 text-sky-400" /> MySQL + Node.js
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Wilson Score 95% CI
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Offline NLP Pipeline
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/recommend" className="hover:text-white transition-colors">Guided Laptop Matcher</Link>
              </li>
              <li>
                <Link to="/laptops" className="hover:text-white transition-colors">Browse 36+ Top Laptops</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">Side-by-Side Comparison</Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-white transition-colors">Fake Review Detection Engine</Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Methodology</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Multi-Heuristic Fake Filter (O(N))</li>
              <li>• TF-IDF Aspect Sentiment Model</li>
              <li>• Wilson Score Lower Bound Math</li>
              <li>• Hardware Normalization Weighting</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TrueSpec. Purely data-driven & review-backed recommendations.</p>
          <p>Local MySQL Architecture • Offline ML Batch Scoring</p>
        </div>
      </div>
    </footer>
  );
};
