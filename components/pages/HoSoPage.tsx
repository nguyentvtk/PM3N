'use client';
import { useState, useEffect, useCallback } from 'react';
import { TRANG_THAI_CONFIG, MUC_DO_CONFIG, LOAI_VB_CONFIG, DON_VI_TRINH_LIST, formatDateTime, apiGet, apiPost } from '@/lib/utils';
import type { HoSo, DuAn, NguoiDungPublic } from '@/types';

export function HoSoPage() {
  const [hoSoList, setHoSoList] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<DuAn[]>([]);
  const [leaders, setLeaders] = useState<NguoiDungPublic[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'alphabet'>('date');

  // Form state
  const [form, setForm] = useState({
    LoaiVB: 'Công văn',
    TenTaiLieu: '',
    MaDA: '',
    TenDuan: '',
    LanhDaoDuyet: '',
    MucDo: 'Thường' as HoSo['MucDo'],
    Kyhieu_DVtrinh: DON_VI_TRINH_LIST[0],
    DraftFile: null as File | null,
    AttachedFiles: [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiGet<HoSo[]>(`/api/sheets/ho-so${filter ? `?trangThai=${filter}` : ''}`)
      .then(setHoSoList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
    // Fetch projects
    apiGet<DuAn[]>('/api/projects').then(setProjects).catch(console.error);
    // Fetch leaders
    apiGet<NguoiDungPublic[]>('/api/sheets/nguoi-dung?vaiTro=lanh_dao').then(data => {
      const filtered = data.filter(u => u.ChucVu.includes('Giám đốc') || u.ChucVu.includes('Phó Giám đốc'));
      setLeaders(filtered);
    }).catch(console.error);
  }, [load]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      // 1. Upload Draft File if exists
      let filePath = '';
      if (form.DraftFile) {
        const base64 = await fileToBase64(form.DraftFile);
        const uploadRes = await apiPost<{ fileUrl: string }>('/api/drive/upload', {
          maDA: form.MaDA,
          tenDuan: form.TenDuan,
          fileName: form.DraftFile.name,
          fileContent: base64,
          subFolder: 'Draft'
        });
        filePath = uploadRes.fileUrl;
      }

      // 2. Upload Attachments if any
      const attachedUrls: string[] = [];
      for (const file of form.AttachedFiles) {
        const base64 = await fileToBase64(file);
        const uploadRes = await apiPost<{ fileUrl: string }>('/api/drive/upload', {
          maDA: form.MaDA,
          tenDuan: form.TenDuan,
          fileName: file.name,
          fileContent: base64,
          subFolder: 'Dinh_kem'
        });
        attachedUrls.push(uploadRes.fileUrl);
      }

      // 3. Create HoSo record
      const payload = {
        LoaiVB: form.LoaiVB,
        Ma_Loaitailieu: LOAI_VB_CONFIG[form.LoaiVB] || '',
        TenTaiLieu: form.TenTaiLieu,
        MaDA: form.MaDA,
        TenDuan: form.TenDuan,
        LanhDaoDuyet: form.LanhDaoDuyet,
        MucDo: form.MucDo,
        Kyhieu_DVtrinh: form.Kyhieu_DVtrinh,
        FilePath: filePath,
        DinhKem: attachedUrls.join(', '),
        TrangThai: 'cho_trinh'
      };

      await apiPost('/api/sheets/ho-so', payload);
      setMessage('✅ Tạo hồ sơ thành công!');
      setForm({
        LoaiVB: 'Công văn',
        TenTaiLieu: '',
        MaDA: '',
        TenDuan: '',
        LanhDaoDuyet: '',
        MucDo: 'Thường',
        Kyhieu_DVtrinh: DON_VI_TRINH_LIST[0],
        DraftFile: null,
        AttachedFiles: []
      });
      setShowForm(false);
      load();
    } catch (err) {
      const error = err as Error;
      setMessage(`❌ ${error.message}`);
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
        <div className="flex gap-3">
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl glass-strong">
             <button 
               onClick={() => setSortBy('date')}
               title="Sắp xếp theo ngày mới nhất"
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'date' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted hover:text-primary'}`}
             >
               Mới nhất
             </button>
             <button 
               onClick={() => setSortBy('alphabet')}
               title="Sắp xếp theo tên A-Z"
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'alphabet' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted hover:text-primary'}`}
             >
               A-Z
             </button>
          </div>
          <button id="btn-tao-ho-so" className="btn-primary" onClick={() => setShowForm(true)} title="Tạo hồ sơ mới">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tạo hồ sơ
          </button>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${
          message.startsWith('✅') 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-fade-in my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg text-primary">Tạo hồ sơ mới</h2>
              <button onClick={() => setShowForm(false)} className="btn-secondary !p-1.5" title="Đóng">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-medium mb-1 block text-muted">Loại văn bản</label>
                  <select className="select text-primary" required title="Chọn loại văn bản"
                    value={form.LoaiVB}
                    onChange={e => setForm({ ...form, LoaiVB: e.target.value })}>
                    {Object.keys(LOAI_VB_CONFIG).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block text-muted">
                    Tên tài liệu <span className="text-red-400">*</span>
                  </label>
                  <input className="input text-primary" required
                    value={form.TenTaiLieu}
                    onChange={e => setForm({ ...form, TenTaiLieu: e.target.value })}
                    placeholder="VD: Báo cáo tài chính Q1/2026" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted">Dự án</label>
                <select className="select text-primary" required title="Chọn dự án"
                  value={form.MaDA}
                  onChange={e => {
                    const p = projects.find((proj: DuAn) => proj.MaDA === e.target.value);
                    setForm({ ...form, MaDA: e.target.value, TenDuan: p?.TenDA || '' });
                  }}>
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((p: DuAn) => (
                    <option key={p.MaDA} value={p.MaDA}>{p.TenDA} ({p.MaDA})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted">Mức độ</label>
                  <select className="select text-primary" value={form.MucDo} title="Chọn mức độ"
                    onChange={e => setForm({ ...form, MucDo: e.target.value as HoSo['MucDo'] })}>
                    {['Thường', 'Khẩn', 'Thượng khẩn', 'Mật', 'Tối mật'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted">Lãnh đạo duyệt</label>
                  <select className="select text-primary" required title="Chọn lãnh đạo duyệt"
                    value={form.LanhDaoDuyet}
                    onChange={e => setForm({ ...form, LanhDaoDuyet: e.target.value })}>
                    <option value="">-- Chọn lãnh đạo --</option>
                    {leaders.map((u: NguoiDungPublic) => (
                      <option key={u.MaNV} value={u.MaNV}>{u.Ten} - {u.ChucVu}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted">Đơn vị trình</label>
                <select className="select text-primary" value={form.Kyhieu_DVtrinh} title="Chọn đơn vị trình"
                  onChange={e => setForm({ ...form, Kyhieu_DVtrinh: e.target.value })}>
                  {DON_VI_TRINH_LIST.map(dv => (
                    <option key={dv} value={dv}>{dv}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 border border-white/10 rounded-xl bg-white/5">
                <div>
                  <label className="text-xs font-medium mb-1 block text-primary">Đính kèm dự thảo</label>
                  <input type="file" className="text-xs text-muted" title="Chọn file dự thảo" placeholder="Chọn file dự thảo"
                    onChange={e => setForm({ ...form, DraftFile: e.target.files?.[0] || null })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-primary">Văn bản đính kèm</label>
                  <input type="file" multiple className="text-xs text-muted" title="Chọn các văn bản đính kèm" placeholder="Chọn các văn bản đính kèm"
                    onChange={e => setForm({ ...form, AttachedFiles: Array.from(e.target.files || []) })} />
                </div>
              </div>

              <button type="submit" className="btn-primary justify-center h-12 text-base" disabled={submitting} title="Gửi hồ sơ">
                {submitting ? <><div className="spinner !w-5 !h-5" /> Đang xử lý...</> : 'Nộp hồ sơ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['', 'cho_trinh', 'dang_duyet', 'da_duyet', 'tu_choi', 'da_ky', 'hoan_thanh'].map((s) => {
          const cfg = s ? TRANG_THAI_CONFIG[s] : null;
          const isActive = filter === s;
          
          return (
            <button key={s} id={`filter-${s || 'all'}`}
              onClick={() => setFilter(s)}
              title={s ? `Lọc theo: ${cfg?.label}` : 'Hiển thị tất cả'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isActive 
                  ? (s ? `bg-opacity-20 border-opacity-30 ${cfg?.bg} ${cfg?.color}` : 'bg-blue-500/20 border-blue-500/30 text-blue-400') 
                  : 'bg-white/5 border-white/10 text-muted opacity-60 hover:opacity-100'
              }`}
            >
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
            <div className="text-center py-16 text-muted">
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
                        <span className="mono text-blue-500">{hs.MaHoSo}</span>
                      </td>
                      <td className="text-primary max-w-[200px]">
                        <span className="block truncate font-medium text-sm">{hs.TenTaiLieu}</span>
                        <span className="text-xs text-muted">
                          Trình: {hs.NguoiTrinh}
                        </span>
                      </td>
                      <td><span className="mono text-xs text-slate-400">{hs.MaDA || '—'}</span></td>
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
                            className="text-xs text-blue-500 hover:underline"
                            title="Mở tài liệu">
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
