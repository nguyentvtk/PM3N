"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Stamp, MapPin, Undo2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentStamperProps {
  maHoSo: string;
  pdfUrl: string;
  onSuccess: () => void;
}

/**
 * Trích xuất file ID từ Google Drive URL
 */
function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  return match ? match[1] : null;
}

/**
 * Tạo URL preview cho Google Drive file
 */
function getPreviewUrl(url: string): string {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  // Nếu không phải Drive URL, thử dùng Google Docs Viewer
  return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
}

/**
 * Trình đóng dấu văn bản — sử dụng Google Drive Preview (iframe)
 * Hỗ trợ cuộn chuột để xem nhiều trang, nhấp chọn vị trí đóng dấu trên lớp overlay.
 */
export default function DocumentStamper({ maHoSo, pdfUrl, onSuccess }: DocumentStamperProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stampPos, setStampPos] = useState<{ x: number; y: number } | null>(null);
  const [stampMode, setStampMode] = useState(false);

  const previewUrl = getPreviewUrl(pdfUrl);
  const fileId = extractDriveFileId(pdfUrl);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (processing || !stampMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tính % để lưu vị trí tương đối
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    setStampPos({ x: xPercent, y: yPercent });
    toast.info(`Đã chọn vị trí: ${xPercent}%, ${yPercent}%`);
  };

  const handleApplyStamp = async () => {
    if (!stampPos) {
      toast.warning('Vui lòng chọn vị trí đóng dấu trên văn bản');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/ho-so/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHoSo,
          x: stampPos.x,
          y: stampPos.y,
          pageIndex: 0,
          scale: 1,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Đã đóng dấu thành công!');
        onSuccess();
      } else {
        toast.error(result.error || 'Lỗi khi đóng dấu');
      }
    } catch {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* PDF Viewer qua Google Drive iframe — hỗ trợ cuộn chuột xem nhiều trang */}
      <div className="relative border border-white/10 rounded-xl overflow-hidden bg-slate-900" style={{ height: '70vh' }}>
        {/* Loading state */}
        {!iframeLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
            <p className="text-sm text-slate-400 font-medium">Đang tải tài liệu...</p>
            <p className="text-xs text-slate-600 mt-1">Cuộn chuột để xem các trang</p>
          </div>
        )}

        {/* Google Drive Preview iframe — tự hỗ trợ phân trang & cuộn */}
        <iframe
          src={previewUrl}
          title="PDF Preview"
          className="w-full h-full border-0"
          onLoad={() => setIframeLoaded(true)}
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />

        {/* Overlay cho chế độ đặt dấu — chỉ hiện khi bật stampMode */}
        {stampMode && (
          <div
            className="absolute inset-0 z-20 cursor-crosshair"
            style={{ background: 'rgba(0,0,0,0.05)' }}
            onClick={handleOverlayClick}
          >
            {/* Hướng dẫn */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse z-30">
              🎯 Nhấp chuột vào vị trí muốn đặt con dấu
            </div>

            {/* Marker hiển thị vị trí đã chọn */}
            {stampPos && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border-3 border-dashed border-red-500 bg-red-500/20 flex items-center justify-center rounded-full shadow-lg shadow-red-500/30"
                style={{
                  left: `${stampPos.x}%`,
                  top: `${stampPos.y}%`,
                  width: '100px',
                  height: '100px',
                }}
              >
                <span className="text-[10px] font-black text-red-600 bg-white/90 px-2 py-0.5 rounded-full uppercase tracking-wider">DẤU</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm gap-3">
        <div className="flex items-center gap-3">
          {/* Toggle chế độ đặt dấu */}
          <Button
            variant={stampMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => setStampMode(!stampMode)}
            disabled={processing}
            className={stampMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {stampMode ? 'Thoát chế độ đặt dấu' : 'Chọn vị trí dấu'}
          </Button>

          {stampPos && (
            <Button variant="ghost" size="sm" onClick={() => setStampPos(null)} disabled={processing}>
              <Undo2 className="w-4 h-4 mr-2" /> Xóa vị trí
            </Button>
          )}

          {/* Link mở file gốc */}
          {fileId && (
            <a
              href={`https://drive.google.com/file/d/${fileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Mở tab mới
            </a>
          )}
        </div>

        <Button
          disabled={!stampPos || processing}
          onClick={handleApplyStamp}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Stamp className="w-4 h-4 mr-2" />
          )}
          {processing ? 'Đang xử lý...' : 'Xác nhận Đóng dấu'}
        </Button>
      </div>

      {/* Hướng dẫn */}
      {!stampMode && !stampPos && (
        <div className="flex items-center p-3 text-sm text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            <b>Bước 1:</b> Cuộn chuột xem tài liệu để tìm trang cần đóng dấu. 
            <b> Bước 2:</b> Nhấn nút &quot;Chọn vị trí dấu&quot; rồi nhấp vào vị trí muốn đặt.
          </span>
        </div>
      )}

      {stampPos && !stampMode && (
        <div className="flex items-center p-3 text-sm text-emerald-300 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Stamp className="w-4 h-4 mr-2 flex-shrink-0" />
          ✅ Đã chọn vị trí ({stampPos.x}%, {stampPos.y}%). Nhấn &quot;Xác nhận Đóng dấu&quot; để hoàn tất.
        </div>
      )}
    </div>
  );
}
