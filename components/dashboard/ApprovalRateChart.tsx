import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ApprovalRateChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title?: string;
  loading?: boolean;
}

interface PayloadItem {
  name: string;
  value: number;
  payload: {
    color: string;
    name: string;
    value: number;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: PayloadItem[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 border border-white/10 p-2 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-white mb-1 uppercase tracking-wider">{payload[0].name}</p>
        <p className="text-sm font-semibold text-blue-400">
          Số lượng: <span className="text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ApprovalRateChart({ data, title, loading }: ApprovalRateChartProps) {
  if (loading) {
    return (
      <div className="card h-[320px] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-40 h-40 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Nếu không có dữ liệu (tất cả 0)
  const isEmpty = data.every(item => item.value === 0);

  return (
    <div className="card h-[320px] flex flex-col pt-4">
      {title && (
        <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-2 px-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          {title}
        </h3>
      )}
      
      <div className="flex-1 w-full flex items-center justify-center">
        {isEmpty ? (
          <div className="text-center py-10 opacity-30">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-xs font-medium uppercase tracking-tight">Chưa có dữ liệu thống kê</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer duration-300 outline-none"
                    style={{ filter: `drop-shadow(0 0 12px ${entry.color}40)` }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
