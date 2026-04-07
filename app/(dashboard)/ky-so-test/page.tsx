"use client";

import React from 'react';
import { UsbTokenSigner } from '@/components/signature/UsbTokenSigner';

export default function KySoTestPage() {
  // Giả định sử dụng một mã hồ sơ mẫu có sẵn trong hệ thống
  const testMaHoSo = 'HS-001'; 

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 text-white font-sans">
      <div className="max-w-2xl w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
            Kiểm tra Ký số USB Token
          </h1>
          <p className="text-blue-100/60">Xác minh kết nối với VGCA Signer Plugin</p>
        </header>

        <section className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-white/90">Hồ sơ thử nghiệm: HS-001</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nhấn nút bên dưới để bắt đầu quy trình ký số. Hệ thống sẽ kết nối với 
              <strong> http://localhost:13579</strong>. Hãy đảm bảo USB Token VGCA đã được cắm.
            </p>
          </div>

          <UsbTokenSigner maHoSo={testMaHoSo} onSuccess={() => alert('Ký thành công!')} />
        </section>

        <footer className="mt-12 text-center text-xs text-gray-500">
          Congvan_Kyso © 2026 | Bảo mật bằng công nghệ ký số chính phủ
        </footer>
      </div>
    </div>
  );
}
