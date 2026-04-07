'use client';
import { useState, useEffect } from 'react';
import type { NguoiDungPublic, VaiTro } from '@/types';
import { VAI_TRO_LABEL } from '@/types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: NguoiDungPublic | null;
}

export function UserFormModal({ isOpen, onClose, onSuccess, initialData }: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    MaNV: '',
    Ten: '',
    Email: '',
    SDT: '',
    ChucVu: '',
    VaiTro: 'nhan_vien' as VaiTro,
    MatKhau: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        MaNV: initialData.MaNV,
        Ten: initialData.Ten,
        Email: initialData.Email,
        SDT: initialData.SDT || '',
        ChucVu: initialData.ChucVu || '',
        VaiTro: initialData.VaiTro,
        MatKhau: '', // Không tải mật khẩu cũ lên client
      });
    } else {
      setFormData({
        MaNV: '',
        Ten: '',
        Email: '',
        SDT: '',
        ChucVu: '',
        VaiTro: 'nhan_vien',
        MatKhau: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isEdit = !!initialData;
      const url = '/api/sheets/nguoi-dung';
      const method = isEdit ? 'PUT' : 'POST';
      
      const base = isEdit 
        ? { maNV: formData.MaNV, ...formData } 
        : formData;

      // Xóa MatKhau nếu để trống khi edit
      const finalPayload: Record<string, unknown> = { ...base };
      if (isEdit && !formData.MatKhau) {
        delete finalPayload.MatKhau;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Có lỗi xảy ra');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </h2>
          <button 
            type="button"
            title="Đóng"
            onClick={onClose} 
            className="text-muted hover:text-primary transition-colors"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Mã nhân viên</label>
              <input
                required
                disabled={!!initialData}
                className="input"
                placeholder="VD: NV001"
                value={formData.MaNV}
                onChange={(e) => setFormData({ ...formData, MaNV: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Họ và tên</label>
              <input
                required
                className="input"
                placeholder="VD: Nguyễn Văn A"
                value={formData.Ten}
                onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted">Email</label>
            <input
              required
              type="email"
              className="input"
              placeholder="VD: example@gmail.com"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Số điện thoại</label>
              <input
                className="input"
                placeholder="09xxx..."
                value={formData.SDT}
                onChange={(e) => setFormData({ ...formData, SDT: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Chức vụ</label>
              <input
                className="input"
                placeholder="VD: Chuyên viên"
                value={formData.ChucVu}
                onChange={(e) => setFormData({ ...formData, ChucVu: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Vai trò</label>
              <select
                className="select"
                title="Chọn vai trò"
                value={formData.VaiTro}
                onChange={(e) => setFormData({ ...formData, VaiTro: e.target.value as VaiTro })}
              >
                {Object.entries(VAI_TRO_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">
                {initialData ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
              </label>
              <input
                type="password"
                className="input"
                placeholder={initialData ? '••••••••' : 'Nhập mật khẩu'}
                value={formData.MatKhau}
                onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? <div className="spinner" /> : (initialData ? 'Lưu thay đổi' : 'Thêm nhân viên')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
