'use client';
import { useEffect, useState } from 'react';
import type { NguoiDungPublic } from '@/types';
import { VAI_TRO_CONFIG, apiGet } from '@/lib/utils';

import { UserFormModal } from '@/components/modals/UserFormModal';

export function NguoiDungPage() {
  const [users, setUsers] = useState<NguoiDungPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NguoiDungPublic | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    apiGet<NguoiDungPublic[]>('/api/sheets/nguoi-dung')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: NguoiDungPublic) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (maNV: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${maNV}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sheets/nguoi-dung?maNV=${maNV}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.error?.message || 'Xóa thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa người dùng');
    }
  };

  const filteredUsers = users.filter(u => 
    u.Ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.MaNV.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header items-start">
        <div>
          <h1 className="page-title">Người Dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Tìm kiếm..."
              className="input pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg 
              className="absolute left-3 top-2.5 text-muted" 
              width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={handleAdd} className="btn-primary">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm nhân viên
          </button>
        </div>
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
                <th>Chức vụ</th>
                <th>Vai trò</th>
                <th className="pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const roleCfg = VAI_TRO_CONFIG[u.VaiTro];
                return (
                  <tr key={u.MaNV}>
                    <td className="pl-6">
                      <span className="mono text-blue-500">{u.MaNV}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.Avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.Avatar} alt={u.Ten} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white brand-gradient">
                            {u.Ten[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium text-primary">{u.Ten}</span>
                      </div>
                    </td>
                    <td className="text-xs text-muted">{u.Email}</td>
                    <td className="text-sm">{u.ChucVu || '—'}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleCfg?.bg} ${roleCfg?.color}`}>
                        {roleCfg?.label ?? u.VaiTro}
                      </span>
                    </td>
                    <td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-500 transition-colors"
                          title="Sửa"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(u.MaNV)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <UserFormModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsers}
        initialData={selectedUser}
      />
    </div>
  );
}
