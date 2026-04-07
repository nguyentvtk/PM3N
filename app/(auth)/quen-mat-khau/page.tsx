'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function QuenMatKhauPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-3xl border border-white/10 bg-[#131d35]/85 backdrop-blur-xl shadow-2xl p-8">
        {/* Icon */}
        <div className="mx-auto mb-6 w-14 h-14 rounded-2xl flex items-center justify-center warn-gradient shadow-warn">
          <Mail className="size-7 text-white" strokeWidth={1.6} />
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-slate-100">Quên mật khẩu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nhập email đăng ký để nhận link đặt lại mật khẩu
          </p>
        </div>

        {sent ? (
          /* Trạng thái đã gửi email */
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="size-16 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-slate-100 text-lg">Email đã được gửi!</p>
              <p className="text-sm text-slate-400 mt-2">
                Kiểm tra hộp thư <span className="text-blue-400 font-medium">{email}</span> và làm theo hướng dẫn.<br />
                Link có hiệu lực trong <span className="text-amber-400 font-medium">30 phút</span>.
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Không thấy email? Kiểm tra thư mục Spam hoặc{' '}
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-blue-400 hover:underline"
                >
                  thử lại
                </button>.
              </p>
            </div>
          </div>
        ) : (
          /* Form nhập email */
          <form id="form-forgot-password" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email-reset">Email đăng ký</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
                <Input
                  id="email-reset"
                  type="email"
                  placeholder="ten.nguoidung@pm3n.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              id="btn-send-reset"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Đang gửi...</>
              ) : (
                <><Mail className="size-4" /> Gửi link đặt lại mật khẩu</>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>

      <p className="text-center mt-5 text-xs text-slate-700">
        © 2026 PM3N Workspace · All rights reserved
      </p>
    </div>
  );
}
