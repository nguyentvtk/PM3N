'use client';
import { useEffect, useState } from 'react';
import type { HoSo } from '@/types';
import { TRANG_THAI_CONFIG, MUC_DO_CONFIG, formatDateTime, apiGet, apiPost } from '@/lib/utils';

export function HoSoPage() {
  const [hoSoList, setHoSoList] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    TenTaiLieu: '',
    MaDA: '',
    LanhDaoDuyet: '',
    MucDo: 'Thường' as HoSo['MucDo'],
    FilePath: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    apiGet<HoSo[]>(`/api/sheets/ho-so${filter ? `?trangThai=${filter}` : ''}`)
      .then(setHoSoList)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await apiPost('/api/sheets/ho-so', form);
      setMessage('✅ Tạo hồ sơ thành công!');
      setForm({ TenTaiLieu: '', MaDA: '', LanhDaoDuyet: '', MucDo: 'Thường', FilePath: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hồ Sơ</h1>
          <p className="page-subtitle">Quản lý công văn và tài liệu</p>
        </div>
        <button id="btn-tao-ho-so" className="btn-primary" onClick={() => setShowForm(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tạo hồ sơ
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: message.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${message.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: message.startsWith('✅') ? '#10b981' : '#ef4444',
          }}>
          {message}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Tạo hồ sơ mới
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-secondary !p-1.5">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Tên tài liệu <span className="text-red-400">*</span>
                </label>
                <input id="input-ten-tai-lieu" className="input" required
                  value={form.TenTaiLieu}
                  onChange={e => setForm({ ...form, TenTaiLieu: e.target.value })}
                  placeholder="VD: Báo cáo tài chính Q1/2026" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Mã dự án</label>
                  <input id="input-ma-da" className="input"
                    value={form.MaDA}
                    onChange={e => setForm({ ...form, MaDA: e.target.value })}
                    placeholder="DA-001" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Mức độ</label>
                  <select id="select-muc-do" className="select"
                    value={form.MucDo}
                    onChange={e => setForm({ ...form, MucDo: e.target.value as HoSo['MucDo'] })}>
                    {['Thường', 'Khẩn', 'Thượng khẩn', 'Mật', 'Tối mật'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Lãnh đạo duyệt</label>
                <input id="input-lanh-dao" className="input"
                  value={form.LanhDaoDuyet}
                  onChange={e => setForm({ ...form, LanhDaoDuyet: e.target.value })}
                  placeholder="MaNV lãnh đạo (VD: NV_LD001)" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Link file (Google Drive)</label>
                <input id="input-file-path" className="input"
                  value={form.FilePath}
                  onChange={e => setForm({ ...form, FilePath: e.target.value })}
                  placeholder="https://drive.google.com/..." />
              </div>

              <button id="btn-submit-ho-so" type="submit" className="btn-primary justify-center" disabled={submitting}>
                {submitting ? <><div className="spinner !w-4 !h-4" /> Đang lưu...</> : 'Nộp hồ sơ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['', 'cho_trinh', 'dang_duyet', 'da_duyet', 'tu_choi', 'da_ky', 'hoan_thanh'].map((s) => {
          const cfg = s ? TRANG_THAI_CONFIG[s] : null;
          return (
            <button key={s} id={`filter-${s || 'all'}`}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === s ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                background: filter === s ? (s ? undefined : 'rgba(59,130,246,0.15)') : 'var(--bg-elevated)',
                border: `1px solid ${filter === s ? (s ? 'inherit' : 'rgba(59,130,246,0.3)') : 'var(--border)'}`,
                color: s ? (cfg?.color.replace('text-', '').includes('-') ? cfg.color : 'var(--text-primary)') : 'var(--text-primary)',
              }}>
              {s ? cfg?.label : 'Tất cả'}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner" />
            </div>
          ) : hoSoList.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm">Không có hồ sơ nào</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="pl-6">Mã HS</th>
                  <th>Tên tài liệu</th>
                  <th>Dự án</th>
                  <th>Mức độ</th>
                  <th>Ngày trình</th>
                  <th>Trạng thái</th>
                  <th className="pr-6">File</th>
                </tr>
              </thead>
              <tbody>
                {hoSoList.map((hs) => {
                  const cfg = TRANG_THAI_CONFIG[hs.TrangThai];
                  const mucDoCfg = MUC_DO_CONFIG[hs.MucDo];
                  return (
                    <tr key={hs.MaHoSo}>
                      <td className="pl-6">
                        <span className="mono" style={{ color: 'var(--accent-blue)' }}>{hs.MaHoSo}</span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', maxWidth: 200 }}>
                        <span className="block truncate font-medium text-sm">{hs.TenTaiLieu}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Trình: {hs.NguoiTrinh}
                        </span>
                      </td>
                      <td><span className="mono text-xs">{hs.MaDA || '—'}</span></td>
                      <td>
                        <span className={`text-xs font-medium ${mucDoCfg?.color}`}>{hs.MucDo}</span>
                      </td>
                      <td className="text-xs whitespace-nowrap">
                        {hs.NgayTrinh ? formatDateTime(hs.NgayTrinh).split(',')[0] : '—'}
                      </td>
                      <td>
                        {cfg && (
                          <span className={`badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        )}
                      </td>
                      <td className="pr-6">
                        {hs.FilePath ? (
                          <a href={hs.FilePath} target="_blank" rel="noopener noreferrer"
                            className="text-xs" style={{ color: 'var(--accent-blue)' }}>
                            Xem →
                          </a>
                        ) : '—'}
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
  );
}
