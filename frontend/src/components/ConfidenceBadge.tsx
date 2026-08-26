import React from 'react';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  wilsonLowerBound?: number;
  cleanReviewCount?: number;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  wilsonLowerBound,
  cleanReviewCount,
  size = 'md'
}) => {
  let colorTheme = {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
    label: 'High Confidence',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600'
  };

  if (score < 40) {
    colorTheme = {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      label: 'Developing Trust',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    };
  } else if (score < 25) {
    colorTheme = {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      bar: 'bg-rose-500',
      label: 'Low Confidence',
      icon: AlertTriangle,
      iconColor: 'text-rose-600'
    };
  }

  const Icon = colorTheme.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${colorTheme.bg}`}
        title={`TrueSpec Confidence Score: ${score}/100 based on Wilson Lower Bound`}
      >
        <Icon className={`w-3.5 h-3.5 ${colorTheme.iconColor}`} />
        <span>{score}</span>
        <span className="text-[10px] text-slate-500 font-normal">/100</span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-xl border ${colorTheme.bg} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colorTheme.iconColor}`} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">TrueSpec Confidence</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{score}</span>
                <span className="text-sm font-semibold text-slate-500">/ 100</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/80 border border-slate-200 shadow-xs">
            {colorTheme.label}
          </span>
        </div>

        {/* Meter progress */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorTheme.bar}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <span>Wilson 95% Bound: <strong>{wilsonLowerBound ? (wilsonLowerBound * 100).toFixed(1) + '%' : 'Calculated'}</strong></span>
          {cleanReviewCount != null && (
            <span>Clean Reviews: <strong>{cleanReviewCount}</strong></span>
          )}
        </div>
      </div>
    );
  }

  // Medium (Default)
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${colorTheme.bg}`}>
      <Icon className={`w-4 h-4 ${colorTheme.iconColor}`} />
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-900 text-sm">{score}</span>
        <span className="text-slate-500 font-normal">/100 Confidence</span>
      </div>
    </div>
  );
};
