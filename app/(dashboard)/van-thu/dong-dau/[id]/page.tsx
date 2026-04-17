  "use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, FileText, Calendar, User, Stamp, ExternalLink, FileCheck } from 'lucide-react';
import DocumentStamper from '@/components/van-thu/DocumentStamper';
import { toast } from 'sonner';
import type { ApiResponse, HoSo, NguoiDungPublic } from '@/types';

export default function VanThuDongDauPage() {
  const { id } = useParams();
  const router = useRouter();
  const [hoSo, setHoSo] = useState<HoSo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextNumber, setNextNumber] = useState<string>('');
  const [suggestedNumber, setSuggestedNumber] = useState<string>('');
  const [isCustomNumber, setIsCustomNumber] = useState(false);
  const [nguoiTrinh, setNguoiTrinh] = useState<string>('');
  const [completing, setCompleting] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [signedFileUrl, setSignedFileUrl] = useState<string>('');

  const fetchHoSo = async () => {
    try {
      const res = await fetch(`/api/sheets/ho-so/${id}`);
      const result: ApiResponse<HoSo> = await res.json();
      if (result.success && result.data) {
        setHoSo(result.data);
        // Cập nhật link file đã ký nếu có
        if (result.data.LinkKySo) {
          setSignedFileUrl(result.data.LinkKySo);
        }
        return result.data;
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy thông tin hồ sơ
        const data = await fetchHoSo();
        if (!data) {
          toast.error('Không tìm thấy hồ sơ');
          setLoading(false);
          return;
        }

        // 2. Lookup tên người trình từ MaNV
        try {
          const nguoiDungRes = await fetch('/api/sheets/nguoi-dung');
          const nguoiDungResult: ApiResponse<NguoiDungPublic[]> = await nguoiDungRes.json();
          if (nguoiDungResult.success && nguoiDungResult.data) {
            const found = nguoiDungResult.data.find(u => u.MaNV === data.NguoiTrinh);
            setNguoiTrinh(found ? `${found.Ten} (${found.ChucVu})` : data.NguoiTrinh);
          }
        } catch {
          setNguoiTrinh(data.NguoiTrinh);
        }

        // 3. Lấy gợi ý số văn bản
        const numRes = await fetch('/api/ho-so/next-number');
        const numResult = await numRes.json();
        if (numResult.success) {
          setNextNumber(numResult.data.suggested);
          setSuggestedNumber(numResult.data.suggested);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleNumberChange = (value: string) => {
    setNextNumber(value);
    setIsCustomNumber(value !== suggestedNumber);
  };

  const handleStampSuccess = async () => {
    setStamped(true);
    toast.success('Đã đóng dấu thành công! Đang tải link file...');
    // Re-fetch để lấy LinkKySo mới nhất từ Sheet
    const updatedHoSo = await fetchHoSo();
    if (updatedHoSo?.LinkKySo) {
      setSignedFileUrl(updatedHoSo.LinkKySo);
      toast.success('File đã ký sẵn sàng để xem!');
    }
  };

  const handleComplete = async () => {
    if (!nextNumber.trim()) {
      toast.warning('Vui lòng nhập số văn bản trước khi hoàn thành');
      return;
    }

    setCompleting(true);
    try {
      const res = await fetch('/api/ho-so/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHoSo: id, soVanBan: nextNumber }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Hồ sơ đã được hoàn thành và lưu trữ chính thức!');
        router.push('/ho-so');
      } else {
        toast.error(result.error || 'Lỗi khi hoàn thành hồ sơ');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
      </div>
    );
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
                onSuccess={handleStampSuccess} 
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
                 <span>Người trình: <b>{nguoiTrinh || hoSo.NguoiTrinh}</b></span>
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
                      onChange={(e) => handleNumberChange(e.target.value)}
                      className={`w-full px-3 py-2 border-2 rounded-md text-lg font-bold transition-colors ${
                        isCustomNumber
                          ? 'text-red-600 border-red-400 bg-red-50'
                          : 'text-amber-600 border-amber-400 bg-amber-50'
                      }`}
                    />
                  </div>
                 <p className="text-[10px] text-muted-foreground mt-1 italic">
                    {isCustomNumber 
                      ? '🔴 Số do người dùng nhập thủ công'
                      : '🟡 Gợi ý tự động (dựa trên ngày làm việc liền kề +5)'
                    }
                  </p>
               </div>

               {/* Trạng thái đóng dấu */}
               {stamped && (
                 <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                   <Stamp className="w-4 h-4" />
                   <span className="font-medium">Đã xác nhận vị trí đóng dấu</span>
                 </div>
               )}

               {/* Nút xem file đã ký — xuất hiện sau khi đóng dấu thành công */}
               {signedFileUrl && (
                 <a
                   href={signedFileUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-lg text-sm font-bold transition-all group"
                 >
                   <FileCheck className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                   <span className="flex-1">Xem PDF đã đóng dấu</span>
                   <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                 </a>
               )}

               <div className="pt-6">
                 <Button 
                   className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" 
                   onClick={handleComplete}
                   disabled={completing || hoSo.TrangThai === 'hoan_thanh'}
                 >
                   {completing ? (
                     <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                   ) : (
                     <CheckCircle2 className="w-5 h-5 mr-2" />
                   )}
                   {completing ? 'Đang xử lý...' : 'Hoàn thành & Lưu trữ'}
                 </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-xs space-y-2 text-muted-foreground">
                <p>⚠️ <b>Lưu ý:</b></p>
                <p>1. Thủ tục &quot;Hoàn thành&quot; sẽ cập nhật trạng thái hồ sơ sang <b>Hoàn thành</b> và lưu số văn bản chính thức.</p>
                <p>2. Hệ thống sẽ cập nhật lại thông tin vào Sheets để lưu trữ.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
