import React from 'react';
import { Calendar, Filter, X, Briefcase } from 'lucide-react';

interface ProjectOption {
  id: string;
  name: string;
}

interface DashboardFilterProps {
  startDate: string;
  endDate: string;
  projects: ProjectOption[];
  selectedProject: string;
  onFilterChange: (start: string, end: string) => void;
  onProjectChange: (projectId: string) => void;
  onClear: () => void;
}

export function DashboardFilter({ 
  startDate, 
  endDate, 
  projects, 
  selectedProject, 
  onFilterChange, 
  onProjectChange,
  onClear 
}: DashboardFilterProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner group">
      <div className="flex items-center gap-2 text-slate-400 px-2 border-r border-white/10 hidden lg:flex font-medium text-xs">
        <Filter size={14} className="group-hover:text-blue-400 transition-colors" />
        <span>Bộ lọc</span>
      </div>

      {/* Project Selector */}
      <div className="relative group/input w-full lg:w-60">
        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors pointer-events-none" />
        <select
          value={selectedProject}
          onChange={(e) => onProjectChange(e.target.value)}
          title="Chọn dự án để lọc"
          className="input !pl-9 !py-1.5 !bg-slate-950/50 !border-transparent hover:!border-white/10 focus:!border-blue-500/50 transition-all text-xs appearance-none w-full cursor-pointer"
        >
          <option value="">Tất cả dự án</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.id}] {p.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
          <Filter size={10} />
        </div>
      </div>

      <div className="h-4 w-[1px] bg-white/10 hidden lg:block" />

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 w-full lg:w-auto">
        <div className="relative group/input flex-1 sm:w-40">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onFilterChange(e.target.value, endDate)}
            title="Từ ngày"
            className="input !pl-9 !py-1.5 !bg-slate-950/50 !border-transparent hover:!border-white/10 focus:!border-blue-500/50 transition-all text-xs"
          />
        </div>

        <span className="text-slate-600 text-xs">đến</span>

        <div className="relative group/input flex-1 sm:w-40">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onFilterChange(startDate, e.target.value)}
            title="Đến ngày"
            className="input !pl-9 !py-1.5 !bg-slate-950/50 !border-transparent hover:!border-white/10 focus:!border-blue-500/50 transition-all text-xs"
          />
        </div>
      </div>

      {(startDate || endDate || selectedProject) && (
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1 text-[10px] uppercase font-bold tracking-tight px-3 w-full lg:w-auto justify-center"
        >
          <X size={12} />
          Xóa lọc
        </button>
      )}
    </div>
  );
}
