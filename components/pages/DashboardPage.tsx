'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { HoSo, DashboardStats, ExtendedUser } from '@/types';
import { TRANG_THAI_CONFIG, formatDateTime, timeAgo, apiGet } from '@/lib/utils';
import Link from 'next/link';

export function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser | undefined;

  const [hoSoList, setHoSoList] = useState<HoSo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<HoSo[]>('/api/sheets/ho-so')
      .then((data) => {
        setHoSoList(data);
        setStats({
          total: data.length,
          cho_trinh: data.filter(h => h.TrangThai === 'cho_trinh').length,
          dang_duyet: data.filter(h => h.TrangThai === 'dang_duyet').length,
          da_duyet: data.filter(h => h.TrangThai === 'da_duyet').length,
          tu_choi: data.filter(h => h.TrangThai === 'tu_choi').length,
          da_ky: data.filter(h => h.TrangThai === 'da_ky').length,
          hoan_thanh: data.filter(h => h.TrangThai === 'hoan_thanh').length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Tổng hồ sơ', value: stats?.total ?? 0, color: '#3b82f6', icon: '📋' },
    { label: 'Chờ trình', value: stats?.cho_trinh ?? 0, color: '#f59e0b', icon: '⏳' },
    { label: 'Đang duyệt', value: stats?.dang_duyet ?? 0, color: '#06b6d4', icon: '🔄' },
    { label: 'Đã duyệt', value: stats?.da_duyet ?? 0, color: '#10b981', icon: '✅' },
    { label: 'Đã ký số', value: stats?.da_ky ?? 0, color: '#8b5cf6', icon: '✍️' },
    { label: 'Từ chối', value: stats?.tu_choi ?? 0, color: '#ef4444', icon: '❌' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Xin chào, <span className="gradient-text">{user?.name?.split(' ').pop() ?? 'bạn'}</span> 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/ho-so" className="btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tạo hồ sơ
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="text-2xl">{card.icon}</div>
            <div>
              <div
                className="text-3xl font-bold"
                style={{ color: card.color }}
              >
                {loading ? '—' : card.value}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Hồ Sơ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Hồ sơ gần đây
          </h2>
          <Link href="/ho-so" className="text-sm" style={{ color: 'var(--accent-blue)' }}>
            Xem tất cả →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : hoSoList.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm">Chưa có hồ sơ nào. Tạo hồ sơ đầu tiên!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã HS</th>
                  <th>Tên tài liệu</th>
                  <th>Mức độ</th>
                  <th>Ngày trình</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {hoSoList.slice(0, 8).map((hs) => {
                  const cfg = TRANG_THAI_CONFIG[hs.TrangThai];
                  return (
                    <tr key={hs.MaHoSo}>
                      <td>
                        <span className="mono" style={{ color: 'var(--accent-blue)' }}>
                          {hs.MaHoSo}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', maxWidth: 250 }}>
                        <span className="block truncate">{hs.TenTaiLieu}</span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {hs.MucDo}
                        </span>
                      </td>
                      <td className="text-xs" title={hs.NgayTrinh}>
                        {timeAgo(hs.NgayTrinh)}
                      </td>
                      <td>
                        {cfg && (
                          <span className={`badge ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
