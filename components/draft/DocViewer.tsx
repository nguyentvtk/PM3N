'use client';

import React from 'react';
import { Loader2, ExternalLink, FileWarning } from 'lucide-react';

interface DocViewerProps {
  fileUrl: string;
  title?: string;
}

export default function DocViewer({ fileUrl, title }: DocViewerProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Trích xuất fileId từ URL Google Drive
  const getFileId = (url: string) => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    return match ? match[1] : null;
  };

  const fileId = getFileId(fileUrl);
  
  // URL để preview trong iframe
  const previewUrl = fileId 
    ? `https://drive.google.com/file/d/${fileId}/preview` 
    : null;

  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50 rounded-xl border border-red-100 text-red-600">
        <FileWarning size={48} className="mb-4 opacity-20" />
        <p className="font-semibold text-lg">Không thể hiển thị tài liệu</p>
        <p className="text-sm opacity-70">Liên kết tài liệu không hợp lệ hoặc đã bị xóa.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
             <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[300px]" title={title}>
              {title || 'Xem trước tài liệu'}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Chế độ xem văn bản</p>
          </div>
        </div>
        
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all"
        >
          Mở tab mới <ExternalLink size={14} />
        </a>
      </div>

      {/* Iframe Container */}
      <div className="relative flex-1 bg-white">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải nội dung từ Drive...</p>
          </div>
        )}
        
        <iframe
          src={previewUrl}
          className="w-full h-full border-none"
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          title={title || "Preview"}
        />
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20">
             <p className="text-red-400 font-bold mb-4">Lỗi khi tải bản xem trước</p>
             <button 
               onClick={() => window.location.reload()}
               className="btn-primary !py-2 !px-6"
             >
               Thử lại
             </button>
          </div>
        )}
      </div>

      {/* Viewer Footer */}
      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
        <p className="text-[10px] text-slate-500 font-medium italic">
          Bản xem trước có thể không hiển thị đầy đủ định dạng nâng cao của Word/Excel.
        </p>
      </div>
    </div>
  );
}
