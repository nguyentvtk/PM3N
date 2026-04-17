'use client';
import { useState, useEffect, useCallback } from 'react';
import { getTrangThaiConfig, MUC_DO_CONFIG, formatDateTime, apiGet } from '@/lib/utils';
import type { HoSo, NguoiDungPublic } from '@/types';
import Link from 'next/link';
import { RefreshCw, FileText, ChevronRight, Inbox, ExternalLink } from 'lucide-react';

export function VanThuPage() {
  const [hoSoList, setHoSoList] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<NguoiDungPublic[]>([]);

  const getUserName = (maNV: string) => {
    const u = allUsers.find(user => user.MaNV === maNV);
    return u ? u.Ten : maNV;
  };

  const load = useCallback(() => {
    setLoading(true);
    // Lọc hồ sơ ở trạng thái 'da_ky' (Đã ký số, chờ đóng dấu)
    apiGet<HoSo[]>('/api/sheets/ho-so?trangThai=da_ky')
      .then(setHoSoList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Fetch all users for name lookup
    apiGet<NguoiDungPublic[]>('/api/sheets/nguoi-dung')
      .then(setAllUsers)
      .catch(console.error);
  }, [load]);

  return (
    <div className="space-y-8 animate-fade-in pb-12 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Inbox size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
              Xử lý <span className="text-blue-500">Văn thư</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Danh sách hồ sơ đã ký số, chờ đóng dấu và lưu trữ chính thức</p>
        </div>
        
        <button 
          onClick={load} 
          disabled={loading}
          className="btn-secondary !bg-white/5 hover:!bg-white/10 !border-white/10 text-slate-300 flex items-center gap-2 group px-6"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          Làm mới
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Đang đồng bộ luồng văn bản...</p>
            </div>
          ) : hoSoList.length === 0 ? (
            <div className="text-center py-32 opacity-40">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} className="text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hiện không có hồ sơ nào chờ xử lý</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Danh tính</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tài liệu & Dự án</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Người trình</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Trạng thái</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {hoSoList.map((hs) => {
                  const cfg = getTrangThaiConfig(hs.TrangThai);
                  const mucDoCfg = MUC_DO_CONFIG[hs.MucDo];
                  return (
                    <tr key={hs.MaHoSo} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-7">
                        <span className="font-mono text-blue-400 text-sm font-bold bg-blue-400/5 px-3 py-1.5 rounded-xl border border-blue-400/10 shadow-inner">
                          {hs.MaHoSo}
                        </span>
                      </td>
                      <td className="px-8 py-7">
                         <div className="max-w-[300px]">
                            <p className="text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition-colors truncate">
                              {hs.TenTaiLieu}
                            </p>
                            <div className="flex items-center gap-2">
                               <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${mucDoCfg?.color} border-current opacity-60 group-hover:opacity-100 transition-opacity`}>
                                 {hs.MucDo}
                               </span>
                               <span className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">{hs.TenDuan}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-7">
                        <p className="text-xs font-bold text-slate-300">{getUserName(hs.NguoiTrinh)}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                          {hs.NgayTrinh ? formatDateTime(hs.NgayTrinh).split(' ')[0] : '—'}
                        </p>
                      </td>
                      <td className="px-8 py-7">
                        <div className={`inline-flex items-center px-3 py-1 rounded-xl ${cfg.bg} ${cfg.color} ring-1 ring-inset ring-current/10 font-bold text-[10px] uppercase tracking-wider`}>
                          {cfg.label}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <Link 
                            href={`/van-thu/dong-dau/${hs.MaHoSo}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95 group-hover:-translate-x-1"
                          >
                            Xử lý <ChevronRight size={14} />
                          </Link>
                          {hs.LinkKySo && (
                            <a
                              href={hs.LinkKySo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-500/20"
                            >
                              <ExternalLink size={11} /> Xem PDF đã ký
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && hoSoList.length > 0 && (
          <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
               Hệ thống đang hiển thị {hoSoList.length} hồ sơ chờ xử lý
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
