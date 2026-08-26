import React from 'react';
import { Link } from 'react-router-dom';
import { Laptop } from '../types';
import { Scale, X, ArrowRight } from 'lucide-react';

interface CompareTrayProps {
  laptops: Laptop[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

export const CompareTray: React.FC<CompareTrayProps> = ({ laptops, onRemove, onClear }) => {
  if (laptops.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
        {/* Laptops badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mr-2 shrink-0">
            <Scale className="w-4 h-4" />
            <span>{laptops.length}/4 Selected</span>
          </div>

          {laptops.map((lap) => (
            <div
              key={lap.id}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs shrink-0"
            >
              <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                {lap.brand} {lap.model_name}
              </span>
              <button
                onClick={() => onRemove(lap.id)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Remove from comparison"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors"
          >
            Clear
          </button>

          <Link
            to={`/compare?ids=${laptops.map(l => l.id).join(',')}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              laptops.length >= 2
                ? 'bg-truespec-500 hover:bg-truespec-400 text-white shadow-truespec-500/20'
                : 'bg-slate-700 text-slate-400 pointer-events-none'
            }`}
          >
            <span>Compare ({laptops.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
