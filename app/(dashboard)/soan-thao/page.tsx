'use client';

import React, { useState } from 'react';
import { FileEdit, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import DraftingForm from '@/components/draft/DraftingForm';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { HoSo } from '@/types';

const OnlyOfficeEditor = dynamic(() => import('@/components/draft/OnlyOfficeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium italic">Đang khởi tạo trình soạn thảo ONLYOFFICE...</p>
    </div>
  )
});

export default function SoanThaoPage() {
  const [draftData, setDraftData] = useState<HoSo | null>(null);

  const handleSuccess = (data: HoSo) => {
    setDraftData(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <FileEdit className="w-6 h-6 text-white" />
            </div>
            Soạn thảo hồ sơ
          </h1>
          <p className="mt-2 text-slate-500">Tạo tài liệu mới, tải lên và chỉnh sửa trực tiếp qua OnlyOffice.</p>
        </div>

        {draftData && (
          <button
            onClick={() => setDraftData(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm glass"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Form
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {!draftData ? (
          <div className="max-w-3xl mx-auto w-full">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden glass p-8">
              <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                <ShieldCheck className="w-5 h-5" />
                <span>Hệ thống tự động đồng bộ file lên Google Drive theo cấu trúc dự án.</span>
              </div>
              <DraftingForm onSuccess={handleSuccess} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Editor Top Bar Info */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl glass flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                   <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{draftData.TenTaiLieu}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    Mã hồ sơ: <span className="font-mono text-blue-600">{draftData.MaHoSo}</span>
                  </p>
                </div>
              </div>
              <Link
                href={draftData.FilePath}
                target="_blank"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline px-4 py-2 bg-blue-50 rounded-lg transition-all"
              >
                <span>Xem trên Google Drive</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Editor Container */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden glass min-h-[650px]">
              <OnlyOfficeEditor
                fileUrl={draftData.FilePath}
                fileName={draftData.TenTaiLieu}
                fileType={draftData.TenTaiLieu.split('.').pop() || 'docx'}
                documentId={draftData.MaHoSo}
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center gap-4">
               <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                  Hoàn tất & Trình duyệt
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
