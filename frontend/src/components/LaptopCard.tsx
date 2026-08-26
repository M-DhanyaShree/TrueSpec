import React from 'react';
import { Link } from 'react-router-dom';
import { Laptop } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Battery, Cpu, HardDrive, Monitor, Scale, Sparkles, Check, Info } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface LaptopCardProps {
  laptop: Laptop;
  isCompared?: boolean;
  onToggleCompare?: (laptop: Laptop) => void;
  highlightWhy?: string;
}

export const LaptopCard: React.FC<LaptopCardProps> = ({
  laptop,
  isCompared = false,
  onToggleCompare,
  highlightWhy
}) => {
  // Plain-English badges derived from hardware specs
  const badges: { text: string; color: string }[] = [];

  if (laptop.battery_wh >= 70) {
    badges.push({ text: '🔋 All-Day Battery', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' });
  }
  if (laptop.weight_kg <= 1.35) {
    badges.push({ text: '🪶 Featherlight (<1.35kg)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
  }
  if (laptop.gpu_score >= 75) {
    badges.push({ text: '⚡ Dedicated GPU', color: 'bg-purple-50 text-purple-700 border-purple-200' });
  }
  if (laptop.refresh_rate >= 120) {
    badges.push({ text: `✨ Smooth ${laptop.refresh_rate}Hz Screen`, color: 'bg-sky-50 text-sky-700 border-sky-200' });
  }
  if (laptop.ram_gb >= 32) {
    badges.push({ text: '🚀 32GB Heavy Multitasking', color: 'bg-amber-50 text-amber-700 border-amber-200' });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Card Header */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-truespec-700 uppercase tracking-wider">
                {laptop.brand}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {laptop.category}
              </span>
            </div>
            <Link
              to={`/laptops/${laptop.id}`}
              className="text-lg font-bold text-slate-900 group-hover:text-truespec-600 transition-colors line-clamp-1 mt-0.5"
            >
              {laptop.model_name}
            </Link>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatINR(laptop.price)}
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center justify-between pt-1">
          <ConfidenceBadge
            score={laptop.confidence_score}
            wilsonLowerBound={laptop.wilson_lower_bound}
            size="sm"
          />
          <span className="text-xs text-slate-500 font-medium">
            {laptop.clean_review_count ?? 0} verified reviews
          </span>
        </div>

        {/* Plain-English Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {badges.slice(0, 3).map((b, i) => (
            <span
              key={i}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${b.color}`}
            >
              {b.text}
            </span>
          ))}
        </div>

        {/* Why this laptop note (if provided) */}
        {highlightWhy && (
          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700 leading-relaxed">
            <div className="flex items-center gap-1.5 text-sky-800 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Why This Fits You:</span>
            </div>
            <p className="line-clamp-3">{highlightWhy}</p>
          </div>
        )}

        {/* Key Hardware Specs for Normal Users */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5" title={`Processor: ${laptop.cpu_name}`}>
            <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{laptop.cpu_name}</span>
          </div>
          <div className="flex items-center gap-1.5" title={`Memory: ${laptop.ram_gb}GB, Storage: ${laptop.storage_gb}GB SSD`}>
            <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{laptop.ram_gb}GB • {laptop.storage_gb}GB SSD</span>
          </div>
          <div className="flex items-center gap-1.5" title={`Display: ${laptop.display_size} inches`}>
            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{laptop.display_size}" Display ({laptop.refresh_rate}Hz)</span>
          </div>
          <div className="flex items-center gap-1.5" title={`Battery: ${laptop.battery_wh}Wh, Weight: ${laptop.weight_kg}kg`}>
            <Battery className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{laptop.battery_wh}Wh • {laptop.weight_kg}kg</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        {onToggleCompare && (
          <button
            onClick={() => onToggleCompare(laptop)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isCompared
                ? 'bg-truespec-600 text-white border-truespec-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added to Compare</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>Compare</span>
              </>
            )}
          </button>
        )}

        <Link
          to={`/laptops/${laptop.id}`}
          className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-truespec-600 hover:text-truespec-700 px-3 py-1.5 hover:bg-white rounded-lg transition-colors"
        >
          <span>View Details & Reviews →</span>
        </Link>
      </div>
    </div>
  );
};
