'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { HoSo, ExtendedUser } from '@/types';
import { getTrangThaiConfig, timeAgo, apiGet } from '@/lib/utils';
import Link from 'next/link';
import { 
  Plus, 
  ArrowRight,
  Zap,
  FileText,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

// Components
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardFilter } from '@/components/dashboard/DashboardFilter';
import { ApprovalRateChart } from '@/components/dashboard/ApprovalRateChart';
import { TrendChart } from '@/components/dashboard/TrendChart';

export function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser | undefined;

  const [hoSoList, setHoSoList] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    apiGet<HoSo[]>('/api/sheets/ho-so')
      .then((data) => {
        setHoSoList(data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const projectList = useMemo(() => {
    const projectsMap = new Map<string, string>();
    hoSoList.forEach(hs => {
      if (hs.MaDA && hs.TenDuan) projectsMap.set(hs.MaDA, hs.TenDuan);
    });
    return Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [hoSoList]);

  const filteredHoSo = useMemo(() => {
    return hoSoList.filter(hs => {
      if (!hs.NgayTrinh) return false;
      const date = hs.NgayTrinh.split('T')[0];
      const isInTimeRange = date >= startDate && date <= endDate;
      const isInProject = selectedProject ? hs.MaDA === selectedProject : true;
      return isInTimeRange && isInProject;
    });
  }, [hoSoList, startDate, endDate, selectedProject]);

  const trendData = useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentYear = new Date().getFullYear();
    return months.map((m, idx) => {
      const monthStr = (idx + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear}-${monthStr}`;
      const docsInMonth = hoSoList.filter(hs => {
        if (!hs.NgayTrinh) return false;
        return hs.NgayTrinh.startsWith(yearMonth) && (selectedProject ? hs.MaDA === selectedProject : true);
      });
      return {
        month: m,
        total: docsInMonth.length,
        approved: docsInMonth.filter(h => ['da_duyet', 'da_ky', 'hoan_thanh'].includes(h.TrangThai)).length
      };
    });
  }, [hoSoList, selectedProject]);

  const stats = useMemo(() => {
    const total = filteredHoSo.length;
    const da_duyet = filteredHoSo.filter(h => ['da_duyet', 'da_ky', 'hoan_thanh'].includes(h.TrangThai)).length;
    const tu_choi = filteredHoSo.filter(h => h.TrangThai === 'tu_choi').length;
    const dang_xu_ly = filteredHoSo.filter(h => ['cho_trinh', 'dang_duyet'].includes(h.TrangThai)).length;
    return { total, da_duyet, tu_choi, dang_xu_ly };
  }, [filteredHoSo]);

  const pieData = useMemo(() => [
    { name: 'Đã duyệt', value: stats.da_duyet, color: '#10b981' },
    { name: 'Bị từ chối', value: stats.tu_choi, color: '#ef4444' },
    { name: 'Đang xử lý', value: stats.dang_xu_ly, color: '#3b82f6' },
  ], [stats]);

  const handleClearFilter = () => {
    const now = new Date();
    setStartDate(`${now.getFullYear()}-01-01`);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedProject('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Header & Filter Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                Cơ quan <span className="text-blue-500">Số</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">Hệ thống điều hành PM3N</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Chào buổi sáng, <span className="text-white font-bold">{user?.name}</span>. 
            Bạn đang có <span className="text-blue-400 font-bold">{stats.dang_xu_ly} hồ sơ</span> cần xử lý.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-2xl">
          <DashboardFilter 
            startDate={startDate} 
            endDate={endDate} 
            projects={projectList}
            selectedProject={selectedProject}
            onFilterChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            onProjectChange={setSelectedProject}
            onClear={handleClearFilter}
          />
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Tổng hồ sơ" value={stats.total} icon="FileText" color="blue" loading={loading} />
        <StatCard label="Đang chờ" value={stats.dang_xu_ly} icon="Clock" color="amber" loading={loading} />
        <StatCard label="Thành công" value={stats.da_duyet} icon="CheckCircle2" color="emerald" loading={loading} />
        <StatCard label="Quay lại" value={stats.tu_choi} icon="XCircle" color="red" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Zap size={100} />
            </div>
            <TrendChart title="Hiệu suất xử lý" data={trendData} loading={loading} />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-blue-500/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Luồng văn bản</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Danh sách hồ sơ mới nhất</p>
                </div>
              </div>
              <Link href="/ho-so" className="btn-secondary !text-[10px] !px-4 !py-2 uppercase font-black tracking-widest flex items-center gap-1">
                Tất cả <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Đang đồng bộ dữ liệu...</p>
                </div>
              ) : filteredHoSo.length === 0 ? (
                <div className="py-24 text-center opacity-30">
                  <FileText size={64} className="mx-auto mb-4 text-slate-600" />
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Phòng làm việc đang trống</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Định danh</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Văn bản</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Thời gian</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredHoSo.slice(0, 8).map((hs) => {
                      const cfg = getTrangThaiConfig(hs.TrangThai);
                      return (
                        <tr key={hs.MaHoSo} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-8 py-6">
                            <span className="font-mono text-blue-400 text-sm font-bold bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10">
                              {hs.MaHoSo}
                            </span>
                          </td>
                          <td className="px-8 py-6 max-w-[280px]">
                            <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate mb-1">{hs.TenTaiLieu}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate italic">{hs.TenDuan}</p>
                          </td>
                          <td className="px-8 py-6 text-xs text-slate-400 font-medium italic">
                            {timeAgo(hs.NgayTrinh)}
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className={`inline-flex items-center px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.color} ring-1 ring-inset ring-current/10 border-none font-bold text-[10px] uppercase tracking-wider`}>
                               {cfg.label}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <Link 
                               href={hs.TrangThai === 'da_ky' ? `/van-thu/dong-dau/${hs.MaHoSo}` : `/ho-so`}
                               className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 hover:text-white text-slate-400 transition-all inline-flex items-center shadow-inner active:scale-90"
                             >
                               <ArrowRight size={16} />
                             </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Action */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              <h4 className="text-2xl font-black tracking-tighter mb-4 uppercase leading-none">Quick<br/>Submission</h4>
              <p className="text-sm text-blue-100 font-medium mb-8 leading-relaxed opacity-80">Trình hồ sơ nhanh cho dự án của bạn chỉ với một click.</p>
              <Link href="/ho-so" className="flex items-center justify-between w-full bg-white text-blue-700 font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95">
                Bắt đầu ngay <Plus size={20} />
              </Link>
           </div>

           <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
              <ApprovalRateChart title="Tỉ lệ hồ sơ" data={pieData} loading={loading} />
           </div>

           <div className="p-8 rounded-[2rem] border border-dashed border-white/10 flex items-center gap-4 group hover:border-blue-500/30 transition-all cursor-help">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-amber-400 transition-colors">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h5 className="text-[11px] font-black text-white uppercase tracking-wider">Hỗ trợ kỹ thuật</h5>
                 <p className="text-[10px] text-slate-500 font-medium">Hệ thống bảo mật bởi PM3N.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
