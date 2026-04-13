'use client';

import React, { useState } from 'react';
import { FileEdit, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import DraftingForm from '@/components/draft/DraftingForm';
import Link from 'next/link';
import type { HoSo } from '@/types';

export default function SoanThaoPage() {
  const [successData, setSuccessData] = useState<HoSo | null>(null);

  const handleSuccess = (data: HoSo) => {
    setSuccessData(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in pb-20">
      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
              <FileEdit size={24} />
            </div>
            Soạn thảo <span className="text-blue-500">Hồ sơ</span>
          </h1>
          <p className="mt-3 text-slate-400 text-sm font-medium">Khởi tạo quy trình trình duyệt văn bản mới</p>
        </div>

        {successData && (
          <button
            onClick={() => setSuccessData(null)}
            className="btn-secondary !text-[10px] uppercase font-black tracking-widest flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            Tạo thêm hồ sơ
          </button>
        )}
      </div>

      <div className="flex justify-center">
        {!successData ? (
          <div className="max-w-3xl w-full">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-8 lg:p-12 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileEdit size={120} />
              </div>
              
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-2">Thông tin tài liệu</h2>
                <p className="text-sm text-slate-500 italic">Vui lòng điền đầy đủ thông tin để hệ thống khởi tạo hồ sơ và đồng bộ lên Drive.</p>
              </div>

              <DraftingForm onSuccess={handleSuccess} />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl w-full">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-12 text-center shadow-2xl animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-emerald-500/20">
                  <CheckCircle2 size={48} />
               </div>
               
               <h2 className="text-3xl font-black text-white hover:text-emerald-400 transition-colors uppercase italic tracking-tighter mb-4">Khởi tạo thành công!</h2>
               <p className="text-slate-400 font-medium mb-10 leading-relaxed px-6">
                 Hồ sơ <span className="text-blue-400 font-bold font-mono">&quot;{successData.TenTaiLieu}&quot;</span> đã được tạo và lưu trữ trên Hệ thống. 
                 Mã định danh: <span className="text-white font-bold">{successData.MaHoSo}</span>.
               </p>


               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    href="/ho-so" 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                  >
                    Xem danh sách <ChevronRight size={14} />
                  </Link>
                  <Link 
                    href={successData.FilePath} 
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl border border-white/10 transition-all active:scale-95"
                  >
                    Xem trên Drive
                  </Link>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
