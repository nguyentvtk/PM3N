'use client';
import { useEffect, useState } from 'react';
import type { NguoiDungPublic } from '@/types';
import { VAI_TRO_CONFIG, apiGet } from '@/lib/utils';

export function NguoiDungPage() {
  const [users, setUsers] = useState<NguoiDungPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<NguoiDungPublic[]>('/api/sheets/nguoi-dung')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Người Dùng</h1>
          <p className="page-subtitle">Danh sách tài khoản hệ thống</p>
        </div>
        <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
          {users.length} tài khoản
        </span>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="pl-6">Mã NV</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Chức vụ</th>
                <th className="pr-6">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleCfg = VAI_TRO_CONFIG[u.VaiTro];
                return (
                  <tr key={u.MaNV}>
                    <td className="pl-6">
                      <span className="mono" style={{ color: 'var(--accent-blue)' }}>{u.MaNV}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.Avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.Avatar} alt={u.Ten} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            {u.Ten[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.Ten}</span>
                      </div>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.Email}</td>
                    <td className="text-sm">{u.SDT || '—'}</td>
                    <td className="text-sm">{u.ChucVu || '—'}</td>
                    <td className="pr-6">
                      <span className={`text-xs font-medium ${roleCfg?.color}`}>
                        {roleCfg?.label ?? u.VaiTro}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
