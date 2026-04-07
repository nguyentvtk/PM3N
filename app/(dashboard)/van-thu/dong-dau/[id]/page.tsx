"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, FileText, Calendar, User } from 'lucide-react';
import DocumentStamper from '@/components/van-thu/DocumentStamper';
import { toast } from 'sonner';
import type { ApiResponse, HoSo } from '@/types';

export default function VanThuDongDauPage() {
  const { id } = useParams();
  const router = useRouter();
  const [hoSo, setHoSo] = useState<HoSo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextNumber, setNextNumber] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy thông tin hồ sơ
        const res = await fetch(`/api/ho-so/${id}`);
        const result: ApiResponse<HoSo> = await res.json();
        if (result.success && result.data) {
          setHoSo(result.data);
        } else {
          toast.error('Không tìm thấy hồ sơ');
        }

        // 2. Lấy gợi ý số văn bản
        const numRes = await fetch('/api/ho-so/next-number');
        const numResult = await numRes.json();
        if (numResult.success) {
          setNextNumber(numResult.data.suggested);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSuccess = () => {
    router.refresh();
  };

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/ho-so/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHoSo: id, soVanBan: nextNumber }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Hồ sơ đã được lưu vào mục Official và cập nhật trạng thái Hoàn thành!');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Lỗi khi hoàn thành hồ sơ');
      }
    } catch (err) {
       toast.error('Lỗi kết nối');
       console.error(err);
     }
  };

  if (loading) {
     return <div className="p-8 text-center">Đang tải dữ liệu hồ sơ...</div>;
  }

  if (!hoSo) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500">Hồ sơ không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl pb-20">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Xử lý Văn thư: {hoSo.MaHoSo}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: PDF Stamping */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Đóng dấu văn bản</CardTitle>
              <CardDescription>
                Nhấp chuột vào vị trí cần đóng dấu (thường ở cuối trang, cạnh chữ ký lãnh đạo).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentStamper 
                maHoSo={hoSo.MaHoSo} 
                pdfUrl={hoSo.LinkKySo || hoSo.FilePath} 
                onSuccess={handleSuccess} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Info & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin Hồ sơ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center text-sm">
                 <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                 <span className="font-medium">{hoSo.TenTaiLieu}</span>
               </div>
               <div className="flex items-center text-sm">
                 <User className="w-4 h-4 mr-2 text-muted-foreground" />
                 <span>Người trình: {hoSo.NguoiTrinh}</span>
               </div>
               <div className="flex items-center text-sm">
                 <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                 <span>Ngày trình: {new Date(hoSo.NgayTrinh).toLocaleDateString('vi-VN')}</span>
               </div>
               
                <div className="pt-4 border-t">
                  <label htmlFor="soVanBanGoiY" className="block text-sm font-medium mb-1">Số văn bản gợi ý:</label>
                  <div className="flex space-x-2">
                    <input 
                      id="soVanBanGoiY"
                      type="text" 
                      value={nextNumber}
                      onChange={(e) => setNextNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-lg font-bold text-primary"
                    />
                  </div>
                 <p className="text-[10px] text-muted-foreground mt-1 italic">
                   Dựa trên thuật toán ngày làm việc liền kề (+5).
                 </p>
               </div>

               <div className="pt-6">
                 <Button 
                   className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" 
                   onClick={handleComplete}
                   disabled={hoSo.TrangThai === 'hoan_thanh'}
                 >
                   <CheckCircle2 className="w-5 h-5 mr-2" />
                   Hoàn thành & Lưu trữ
                 </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-xs space-y-2 text-muted-foreground">
                <p>⚠️ <b>Lưu ý:</b></p>
                <p>1. Thủ tục &quot;Hoàn thành&quot; sẽ di chuyển file từ thư mục <b>Draft</b> sang <b>Official</b> trên Drive.</p>
                <p>2. Hệ thống sẽ cập nhật lại Link truy cập chính thức vào Sheets.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
