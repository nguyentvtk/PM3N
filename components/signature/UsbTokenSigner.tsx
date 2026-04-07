'use client';

import React, { useState } from 'react';
import { ShieldCheck, Cpu, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface UsbTokenSignerProps {
  maHoSo: string;
  onSuccess?: () => void;
}

export const UsbTokenSigner: React.FC<UsbTokenSignerProps> = ({ maHoSo, onSuccess }) => {
  const [status, setStatus] = useState<'idle' | 'plug_in' | 'signing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Thử kết nối với Local Plugin (VGCA/VNPT-CA)
  const signWithToken = async () => {
    setLoading(true);
    setStatus('plug_in');
    setMessage('Đang kết nối tới USB Token... Vui lòng đảm bảo USB đã cắm và Plugin đang chạy.');

    try {
      // 1. Gọi backend để băm (Hash) PDF
      const hashRes = await fetch(`/api/ho-so/sign?action=hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHoSo }),
      });
      const hashData = await hashRes.json();

      if (!hashData.success) {
        throw new Error(hashData.error || 'Lỗi khi chuẩn bị tệp để băm');
      }

      const { hash, pdfWithPlaceholder } = hashData.data;

      // 2. Kết nối tới Plugin cục bộ (Thường là VGCA qua localhost:13579)
      // Đây là ví dụ payload cho VGCA Signer (Số hóa hoặc ký số chính phủ)
      // Mỗi nhà cung cấp có API khác nhau, đây là cấu trúc phổ biến
      const localPluginUrl = 'http://localhost:13579/ca/api/signer/sign_hash'; 
      
      setStatus('signing');
      setMessage('Đang chờ xác nhận từ USB Token (Vui lòng nhập PIN nếu yêu cầu)...');

      const pluginRes = await fetch(localPluginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash: hash,
          hash_alg: 'SHA256',
          // Các option nâng cao tùy plugin
        }),
      });

      if (!pluginRes.ok) {
        throw new Error('Không thể kết nối tới Plugin ký số cục bộ. Vui lòng kiểm tra lại.');
      }

      const pluginData = await pluginRes.json();
      const signature = pluginData.signature; // Chuỗi Hex/Base64 từ Token

      // 3. Gửi chữ ký ngược lại backend để đóng gói (Inject)
      setMessage('Đang đóng gói chữ ký và lưu tệp lên Drive...');
      const injectRes = await fetch(`/api/ho-so/sign?action=inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maHoSo,
          signature,
          pdfWithPlaceholderBase64: pdfWithPlaceholder,
          signerInfo: {
            serial: pluginData.serial || 'TEST-SERIAL',
            ca: pluginData.ca_name || 'VGCA',
          }
        }),
      });

      const injectData = await injectRes.json();
      if (!injectData.success) {
        throw new Error(injectData.error || 'Lỗi khi đóng gói chữ ký');
      }

      setStatus('success');
      setMessage('Ký số hồ sơ thành công! File đã được lưu đè lên bản nháp.');
      onSuccess?.();

    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định trong quá trình ký số.';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-500/20 rounded-full">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Ký số USB Token</h3>
          <p className="text-blue-100/60 text-sm">Sử dụng thiết bị vật lý để ký hồ sơ</p>
        </div>
      </div>

      <div className="space-y-4">
        {status === 'idle' && (
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-400 mt-0.5" />
            <p className="text-blue-100 text-sm">
              Hệ thống sẽ băm nội dung tài liệu và yêu cầu USB Token xác thực. Đảm bảo Plugin đã sẵn sàng.
            </p>
          </div>
        )}

        {status === 'plug_in' && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 animate-pulse" />
            <p className="text-amber-100 text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'signing' && (
          <div className="flex flex-col items-center justify-center p-8 bg-blue-500/5 rounded-2xl border border-dashed border-blue-500/30">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
            <p className="text-blue-100 text-center text-sm">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
            <p className="text-emerald-100 text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5" />
            <p className="text-rose-100 text-sm font-medium">{message}</p>
          </div>
        )}

        <button
          onClick={signWithToken}
          disabled={loading || status === 'success'}
          className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
            loading || status === 'success'
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
          }`}
        >
          {loading ? 'Đang thực hiện...' : status === 'success' ? 'Hoàn thành' : 'Bắt đầu Ký số'}
        </button>
      </div>
    </div>
  );
};
