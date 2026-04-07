'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { HoSo, ExtendedUser } from '@/types';
import { TRANG_THAI_CONFIG, timeAgo, apiGet } from '@/lib/utils';
import Link from 'next/link';

// Icons
import { 
  PenTool, 
  FileCheck, 
  Plus, 
  ArrowRight,
  LayoutDashboard
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

  // Trích xuất danh sách dự án duy nhất
  const projectList = useMemo(() => {
    const projectsMap = new Map<string, string>();
    hoSoList.forEach(hs => {
      if (hs.MaDA && hs.TenDuan) {
        projectsMap.set(hs.MaDA, hs.TenDuan);
      }
    });
    return Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [hoSoList]);

  // Lọc dữ liệu theo thời gian và dự án
  const filteredHoSo = useMemo(() => {
    return hoSoList.filter(hs => {
      // Lọc theo thời gian
      if (!hs.NgayTrinh) return false;
      const date = hs.NgayTrinh.split('T')[0];
      const isInTimeRange = date >= startDate && date <= endDate;
      
      // Lọc theo dự án
      const isInProject = selectedProject ? hs.MaDA === selectedProject : true;

      return isInTimeRange && isInProject;
    });
  }, [hoSoList, startDate, endDate, selectedProject]);

  // Tính toán dữ liệu xu hướng (Trend Data) theo tháng
  const trendData = useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentYear = new Date().getFullYear();
    
    const data = months.map((m, idx) => {
      const monthStr = (idx + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear}-${monthStr}`;
      
      const docsInMonth = hoSoList.filter(hs => {
        if (!hs.NgayTrinh) return false;
        const matchesMonth = hs.NgayTrinh.startsWith(yearMonth);
        const matchesProject = selectedProject ? hs.MaDA === selectedProject : true;
        return matchesMonth && matchesProject;
      });

      return {
        month: m,
        total: docsInMonth.length,
        approved: docsInMonth.filter(h => ['da_duyet', 'da_ky', 'hoan_thanh'].includes(h.TrangThai)).length
      };
    });

    return data;
  }, [hoSoList, selectedProject]);

  // Tính toán thống kê từ dữ liệu đã lọc
  const stats = useMemo(() => {
    const total = filteredHoSo.length;
    const da_duyet = filteredHoSo.filter(h => ['da_duyet', 'da_ky', 'hoan_thanh'].includes(h.TrangThai)).length;
    const tu_choi = filteredHoSo.filter(h => h.TrangThai === 'tu_choi').length;
    const dang_xu_ly = filteredHoSo.filter(h => ['cho_trinh', 'dang_duyet'].includes(h.TrangThai)).length;
    
    return { total, da_duyet, tu_choi, dang_xu_ly };
  }, [filteredHoSo]);

  // Dữ liệu biểu đồ tròn
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
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      {/* Header & Filter */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Bảng điều khiển
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Xin chào <span className="text-blue-400 font-semibold">{user?.name}</span>. 
            Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>

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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Tổng hồ sơ" 
          value={stats.total} 
          icon="FileText" 
          color="blue" 
          loading={loading}
        />
        <StatCard 
          label="Đang xử lý" 
          value={stats.dang_xu_ly} 
          icon="Clock" 
          color="amber" 
          loading={loading}
        />
        <StatCard 
          label="Đã phê duyệt" 
          value={stats.da_duyet} 
          icon="CheckCircle2" 
          color="emerald" 
          loading={loading}
        />
        <StatCard 
          label="Bị từ chối" 
          value={stats.tu_choi} 
          icon="XCircle" 
          color="red" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2">
          <TrendChart 
            title="Xu hướng xử lý hồ sơ" 
            data={trendData} 
            loading={loading}
          />
        </div>

        {/* Approval Rate Chart */}
        <div className="lg:col-span-1">
          <ApprovalRateChart 
            title="Tỉ lệ hồ sơ" 
            data={pieData} 
            loading={loading} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Hồ Sơ Table */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col p-0 overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-md">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <PenTool size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Hồ sơ {user?.vaiTro === 'nhan_vien' ? 'của tôi' : 'gần đây'}
                </h3>
              </div>
              <Link href="/ho-so" className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1 group">
                Xem chi tiết <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-violet-500 animate-spin" />
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Đang tải danh sách...</p>
                </div>
              ) : filteredHoSo.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                  <FileCheck size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">Không tìm thấy hồ sơ nào phù hợp</p>
                </div>
              ) : (
                <table className="data-table !text-xs">
                  <thead className="bg-slate-950/20">
                    <tr>
                      <th className="!py-4 text-slate-400 uppercase tracking-wider text-[10px]">Mã HS</th>
                      <th className="text-slate-400 uppercase tracking-wider text-[10px]">Tên tài liệu</th>
                      <th className="text-slate-400 uppercase tracking-wider text-[10px]">Ngày trình</th>
                      <th className="text-center text-slate-400 uppercase tracking-wider text-[10px]">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredHoSo.slice(0, 10).map((hs) => {
                      const cfg = TRANG_THAI_CONFIG[hs.TrangThai];
                      return (
                        <tr key={hs.MaHoSo} className="hover:bg-white/[0.02] group transition-colors">
                          <td className="!py-4 min-w-[90px]">
                            <span className="mono text-blue-400 font-bold bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10 group-hover:border-blue-400/30 transition-all">
                              {hs.MaHoSo}
                            </span>
                          </td>
                          <td className="max-w-[200px]">
                            <div className="font-semibold text-slate-200 truncate group-hover:text-blue-300 transition-colors" title={hs.TenTaiLieu}>
                              {hs.TenTaiLieu}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <span className="bg-slate-800 text-slate-400 px-1 rounded font-mono">{hs.MaDA}</span>
                              <span className="truncate flex-1 max-w-[180px] inline-block text-slate-400">• {hs.TenDuan}</span>
                            </div>
                          </td>
                          <td className="text-slate-400 whitespace-nowrap">
                            {timeAgo(hs.NgayTrinh)}
                          </td>
                          <td className="text-center">
                            {cfg && (
                              <span className={`badge ${cfg.bg} ${cfg.color} ring-1 ring-inset border-none !px-3 font-bold text-[10px]`}>
                                {cfg.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            {!loading && filteredHoSo.length > 0 && (
              <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Hiển thị {Math.min(10, filteredHoSo.length)} trên tổng số {filteredHoSo.length} hồ sơ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Side Card */}
        <div className="lg:col-span-1">
           <div className="card group border-dashed border-white/10 flex flex-col items-center justify-center py-12 text-center hover:border-blue-500/30 transition-all h-full bg-slate-900/40 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Plus size={32} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tighter">Trình hồ sơ mới</h4>
            <p className="text-xs text-slate-500 px-10 mb-8 italic leading-relaxed">
              Bắt đầu quy trình phê duyệt cho tài liệu kỹ thuật hoặc công văn của bạn một cách nhanh chóng và an toàn.
            </p>
            <Link href="/ho-so" className="btn-primary !py-3 !px-10 !text-xs uppercase tracking-widest font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
              Tạo hồ sơ ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
