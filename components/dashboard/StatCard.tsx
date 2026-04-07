import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof LucideIcons;
  color: 'blue' | 'amber' | 'emerald' | 'red' | 'violet' | 'cyan';
  trend?: {
    value: number;
    isUp: boolean;
  };
  loading?: boolean;
}

const colorConfig = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   glow: 'shadow-blue-500/20' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  glow: 'shadow-amber-500/20' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     glow: 'shadow-red-500/20' },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  glow: 'shadow-violet-500/20' },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    glow: 'shadow-cyan-500/20' },
};

export function StatCard({ label, value, icon, color, trend, loading }: StatCardProps) {
  const Icon = LucideIcons[icon] as LucideIcon;
  const cfg = colorConfig[color];

  return (
    <div className={`stat-card relative overflow-hidden group border ${cfg.border} hover:shadow-lg ${cfg.glow} transition-all duration-300`}>
      {/* Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${cfg.bg}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <h3 className={`text-2xl font-bold tracking-tight ${cfg.text}`}>
            {loading ? (
              <span className="inline-block w-12 h-6 bg-slate-800 animate-pulse rounded" />
            ) : (
              value
            )}
          </h3>
        </div>
        
        <div className={`p-2.5 rounded-xl ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.border}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>

      {trend && !loading && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`text-xs font-semibold flex items-center ${trend.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.isUp ? <LucideIcons.ArrowUpRight size={14} className="mr-0.5" /> : <LucideIcons.ArrowDownRight size={14} className="mr-0.5" />}
            {trend.value}%
          </span>
          <span className="text-[10px] text-slate-500">so với tháng trước</span>
        </div>
      )}
    </div>
  );
}
