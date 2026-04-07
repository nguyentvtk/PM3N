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

  useEffect(() => {
    apiGet<LogHeThong[]>('/api/sheets/log?limit=200')
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nhật Ký Hệ Thống</h1>
          <p className="page-subtitle">Lịch sử hoạt động và thay đổi dữ liệu</p>
        </div>
        <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
          {logs.length} bản ghi
        </span>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
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
              {logs.map((log, idx) => (
                <tr key={`${log.ID}-${idx}`}>
                  <td className="pl-6">
                    <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {log.ID}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {log.Timestamp ? formatDateTime(log.Timestamp) : '—'}
                  </td>
                  <td>
                    {log.MaHoSo ? (
                      <span className="mono" style={{ color: 'var(--accent-blue)' }}>{log.MaHoSo}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`mono text-xs font-medium ${HANH_DONG_COLOR[log.HanhDong] ?? 'text-slate-400'}`}>
                      {log.HanhDong}
                    </span>
                  </td>
                  <td className="pr-6 text-xs" style={{ color: 'var(--text-secondary)', maxWidth: 300 }}>
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
