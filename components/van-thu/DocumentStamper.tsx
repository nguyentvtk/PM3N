"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loader2, Stamp, MapPin, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

// Cấu hình Worker cho PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentStamperProps {
  maHoSo: string;
  pdfUrl: string;
  onSuccess: () => void;
}

export default function DocumentStamper({ maHoSo, pdfUrl, onSuccess }: DocumentStamperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stampPos, setStampPos] = useState<{ x: number; y: number } | null>(null);
  const scale = 1.5; // Tỷ lệ render fixed

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        // Lưu ý: PDF.js có thể gặp CORS nếu PDF từ Drive. 
        // Trong thực tế, ta nên proxy file này hoặc dùng Blob URL.
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(pdf.numPages); // Mặc định hiển thị trang cuối theo yêu cầu
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast.error('Không thể tải PDF. Hãy kiểm tra quyền truy cập file.');
        setLoading(false);
      }
    };

    if (pdfUrl) loadPdf();
  }, [pdfUrl]);

  const renderPage = useCallback(async (pageNo: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNo);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (processing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tính toán tọa độ relative (để gửi lên server)
    setStampPos({ x: x / scale, y: y / scale });
  };

  const handleApplyStamp = async () => {
    if (!stampPos) {
      toast.warning('Vui lòng chọn vị trí đóng dấu trên PDF');
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
          pageIndex: currentPage - 1, // 0-indexed
          scale: 1, // Tỷ lệ con dấu
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-muted/30 rounded-lg border-2 border-dashed">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Đang tải tài liệu PDF...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* PDF Viewer & Overlay */}
      <div className="relative border rounded-lg overflow-auto bg-gray-100 max-h-[70vh] flex justify-center p-4">
        <div className="relative shadow-2xl">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair bg-white"
          />
          
          {/* Overlay Marker */}
          {stampPos && (
             <div 
               className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-red-500 bg-red-500/20 flex items-center justify-center"
               style={{ 
                 left: stampPos.x * scale, 
                 top: stampPos.y * scale,
                 width: 80 * scale,
                 height: 80 * scale,
               }}
             >
               <span className="text-[10px] font-bold text-red-600 bg-white/80 px-1 rounded">DẤU</span>
             </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium">
            Trang {currentPage} / {numPages}
          </div>
          <div className="flex space-x-1">
             <Button 
               variant="outline" 
               size="sm" 
               disabled={currentPage <= 1 || processing}
               onClick={() => setCurrentPage(prev => prev - 1)}
             >
               Trang trước
             </Button>
             <Button 
               variant="outline" 
               size="sm" 
               disabled={currentPage >= numPages || processing}
               onClick={() => setCurrentPage(prev => prev + 1)}
             >
               Trang sau
             </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          {stampPos && (
            <Button variant="ghost" size="sm" onClick={() => setStampPos(null)} disabled={processing}>
              <Undo2 className="w-4 h-4 mr-2" /> Xóa vị trí
            </Button>
          )}
          <Button 
            disabled={!stampPos || processing} 
            onClick={handleApplyStamp}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Stamp className="w-4 h-4 mr-2" />
            )}
            {processing ? 'Đang thực hiện...' : 'Xác nhận Đóng dấu'}
          </Button>
        </div>
      </div>
      
      {!stampPos && (
        <div className="flex items-center p-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
          <MapPin className="w-4 h-4 mr-2" />
          Mẹo: Nhấp chuột vào bất kỳ vị trí nào trên văn bản để đặt con dấu.
        </div>
      )}
    </div>
  );
}
