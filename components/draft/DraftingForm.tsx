'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import type { DuAn, HoSo } from '@/types';

interface DraftingFormProps {
  onSuccess: (data: HoSo) => void;
}

const DOCUMENT_TYPES = [
  'Quyết định',
  'Tờ trình',
  'Công văn',
  'Hợp đồng',
  'Bản ghi nhớ (MOU)',
  'Báo cáo',
  'Thông báo'
];

const MUC_DO_OPTIONS = ['Thường', 'Khẩn', 'Thượng khẩn', 'Mật', 'Tối mật'];

export default function DraftingForm({ onSuccess }: DraftingFormProps) {
  const [projects, setProjects] = useState<DuAn[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>(DOCUMENT_TYPES[0]);
  const [selectedMucDo, setSelectedMucDo] = useState<string>(MUC_DO_OPTIONS[0]);
  const [tenTaiLieu, setTenTaiLieu] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        const json = await res.json();
        if (json.success) {
          setProjects(json.data);
          if (json.data.length > 0) setSelectedProject(json.data[0].MaDA);
        }
      } catch (err) {
        console.error('Lỗi khi tải dự án:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!tenTaiLieu) setTenTaiLieu(droppedFile.name.split('.')[0]);
    }
  }, [tenTaiLieu]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!tenTaiLieu) setTenTaiLieu(selectedFile.name.split('.')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedProject || !tenTaiLieu) {
      setError('Vui lòng điền đầy đủ thông tin và chọn file.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const projectObj = projects.find(p => p.MaDA === selectedProject);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('maDA', selectedProject);
    formData.append('tenDuan', projectObj?.TenDA || '');
    formData.append('loaiVanBan', selectedDocType);
    formData.append('tenTaiLieu', tenTaiLieu);
    formData.append('mucDo', selectedMucDo);

    try {
      const res = await fetch('/api/ho-so/draft', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        onSuccess(result.data);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lưu hồ sơ.');
      }
    } catch {
      setError('Lỗi kết nối server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dự án */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Dự án liên quan</label>
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={loadingProjects}
              title="Chọn dự án"
              className="w-full bg-white/50 border border-slate-200 rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 glass"
            >
              {loadingProjects ? (
                <option>Đang tải...</option>
              ) : (
                projects.map((p) => (
                  <option key={p.MaDA} value={p.MaDA}>
                    {p.MaDA} - {p.TenDA}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Loại văn bản */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Loại văn bản</label>
          <div className="relative">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              title="Chọn loại văn bản"
              className="w-full bg-white/50 border border-slate-200 rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 glass"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tên tài liệu */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Tên tài liệu / Trích yếu</label>
          <input
            type="text"
            value={tenTaiLieu}
            onChange={(e) => setTenTaiLieu(e.target.value)}
            placeholder="Nhập tên tài liệu..."
            className="w-full bg-white/50 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 glass"
            required
          />
        </div>

        {/* Mức độ */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Mức độ khẩn</label>
          <div className="flex flex-wrap gap-2">
            {MUC_DO_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMucDo(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedMucDo === m
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all text-center ${
          isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
        } ${file ? 'bg-emerald-50/20 border-emerald-200' : 'bg-slate-50/50'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".doc,.docx,.xls,.xlsx,.pdf"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {file ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-800">{file.name}</p>
              <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024).toFixed(1)} KB - Nhấp để thay đổi</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">Kéo thả file vào đây hoặc nhấp để chọn</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ: .docx, .xlsx, .pdf (Max 10MB)</p>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !file}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Bắt đầu Soạn thảo & Lưu nháp</span>
          </>
        )}
      </button>
    </form>
  );
}
