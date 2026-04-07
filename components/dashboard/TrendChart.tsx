'use client';
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  month: string;
  total: number;
  approved: number;
}

interface TrendChartProps {
  title: string;
  data: TrendData[];
  loading?: boolean;
}

export function TrendChart({ title, data, loading }: TrendChartProps) {
  if (loading) {
    return (
      <div className="card h-[350px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Đang tải xu hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 h-[350px] overflow-hidden flex flex-col border-white/5 bg-slate-900/40 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
          Năm {new Date().getFullYear()}
        </div>
      </div>

      <div className="flex-1 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #ffffff10', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
              }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Area 
              name="Tổng cộng"
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
            <Area 
              name="Đã duyệt"
              type="monotone" 
              dataKey="approved" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorApproved)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
