'use client';
import { useEffect, useState } from 'react';
import type { LogHeThong } from '@/types';
import { formatDateTime, apiGet } from '@/lib/utils';

const HANH_DONG_COLOR: Record<string, string> = {
  TAO_MOI: 'text-emerald-400',
  CAP_NHAT: 'text-blue-400',
  XOA: 'text-red-400',
  DUYET: 'text-emerald-400',
  TU_CHOI: 'text-red-400',
  KY_SO: 'text-violet-400',
  DANG_NHAP: 'text-cyan-400',
  DANG_XUAT: 'text-slate-400',
};

export function LogPage() {
  const [logs, setLogs] = useState<LogHeThong[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = (limit = 200) => {
    setLoading(true);
    apiGet<LogHeThong[]>(`/api/sheets/log?limit=${limit}`)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = searchTerm === '' || 
      (log.MaHoSo && log.MaHoSo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ChiTiet && log.ChiTiet.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchAction = actionFilter === '' || log.HanhDong === actionFilter;
    
    return matchSearch && matchAction;
  });

  const actions = Array.from(new Set(logs.map(l => l.HanhDong))).sort();

  return (
    <div>
      <div className="page-header items-start">
        <div>
          <h1 className="page-title">Nhật Ký Hệ Thống</h1>
          <p className="page-subtitle">Lịch sử hoạt động và thay đổi dữ liệu trên toàn hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Mã hồ sơ / Nội dung..."
              className="input pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              title="Tìm kiếm nhật ký"
            />
            <svg 
              className="absolute left-3 top-2.5 text-muted" 
              width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            className="select w-40"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            title="Lọc theo hành động"
          >
            <option value="">Tất cả hành động</option>
            {actions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
          <button 
            onClick={() => fetchLogs()} 
            className="p-2 rounded-lg bg-bg-elevated border border-border hover:border-border-strong text-muted hover:text-primary transition-all"
            title="Làm mới"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Chưa có log nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="pl-6">#</th>
                <th>Thời gian</th>
                <th>Mã Hồ Sơ</th>
                <th>Hành động</th>
                <th className="pr-6">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={`${log.ID}-${log.Timestamp}-${idx}`}>
                  <td className="pl-6">
                    <span className="mono text-xs text-muted">
                      {log.ID}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap text-muted">
                    {log.Timestamp ? formatDateTime(log.Timestamp) : '—'}
                  </td>
                  <td>
                    {log.MaHoSo ? (
                      <span className="mono text-blue-500">{log.MaHoSo}</span>
                    ) : (
                      <small className="text-muted">—</small>
                    )}
                  </td>
                  <td>
                    <span className={`mono text-xs font-medium ${HANH_DONG_COLOR[log.HanhDong] ?? 'text-slate-400'}`}>
                      {log.HanhDong}
                    </span>
                  </td>
                  <td className="pr-6 text-xs text-slate-400 max-w-[300px]">
                    <span className="block truncate">{log.ChiTiet}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
