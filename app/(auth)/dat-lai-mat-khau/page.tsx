'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'bg-slate-700', width: 'w-0' };
  if (pw.length < 6)   return { label: 'Quá yếu', color: 'bg-red-500', width: 'w-1/4' };
  if (pw.length < 8)   return { label: 'Yếu', color: 'bg-orange-400', width: 'w-2/4' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum   = /[0-9]/.test(pw);
  const hasSym   = /[^a-zA-Z0-9]/.test(pw);
  if (hasUpper && hasNum && hasSym) return { label: 'Mạnh', color: 'bg-emerald-400', width: 'w-full' };
  if (hasNum || hasUpper)           return { label: 'Khá', color: 'bg-blue-400', width: 'w-3/4' };
  return { label: 'Trung bình', color: 'bg-amber-400', width: 'w-3/4' };
}

function DatLaiMatKhauContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const token       = searchParams.get('token');

  const [pw, setPw]       = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const strength = getPasswordStrength(pw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pw.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (pw !== pwConfirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!token) {
      setError('Token không hợp lệ. Vui lòng yêu cầu link mới.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Token không có
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="mx-auto size-14 text-red-400" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-slate-100 text-lg">Link không hợp lệ</p>
          <p className="text-sm text-slate-400 mt-2">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
        </div>
        <Link href="/quen-mat-khau">
          <Button variant="outline" className="mt-2">Yêu cầu link mới</Button>
        </Link>
      </div>
    );
  }

  return success ? (
    /* Success state */
    <div className="text-center space-y-4">
      <CheckCircle2 className="mx-auto size-16 text-emerald-400" strokeWidth={1.5} />
      <div>
        <p className="font-semibold text-slate-100 text-lg">Mật khẩu đã được cập nhật!</p>
        <p className="text-sm text-slate-400 mt-2">
          Đang chuyển về trang đăng nhập trong giây lát...
        </p>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full animate-[grow_3s_ease-in-out_forwards]" />
      </div>
    </div>
  ) : (
    /* Form */
    <form id="form-reset-password" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Password mới */}
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <Input
            id="new-password"
            type={showPw ? 'text' : 'password'}
            placeholder="Ít nhất 8 ký tự"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="pl-9 pr-10"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {/* Strength indicator */}
        {pw.length > 0 && (
          <div className="space-y-1">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
            </div>
            <p className="text-xs text-slate-500">Độ mạnh: <span className="font-medium text-slate-300">{strength.label}</span></p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            className={`pl-9 ${pwConfirm && pw !== pwConfirm ? 'border-red-500/50 focus:ring-red-500' : ''}`}
            required
            disabled={loading}
          />
          {pwConfirm && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {pw === pwConfirm
                ? <CheckCircle2 className="size-4 text-emerald-400" />
                : <AlertCircle className="size-4 text-red-400" />}
            </span>
          )}
        </div>
      </div>

      <Button
        type="submit"
        id="btn-reset-submit"
        className="w-full h-11 mt-2"
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="size-4 animate-spin" /> Đang cập nhật...</>
        ) : (
          <><Lock className="size-4" /> Đặt lại mật khẩu</>
        )}
      </Button>
    </form>
  );
}

export default function DatLaiMatKhauPage() {
  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-3xl border border-white/10 bg-[#131d35]/85 backdrop-blur-xl shadow-2xl p-8">
        {/* Icon */}
        <div className="mx-auto mb-6 w-14 h-14 rounded-2xl flex items-center justify-center success-gradient shadow-success">
          <Lock className="size-7 text-white" strokeWidth={1.6} />
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-slate-100">Đặt lại mật khẩu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo mật khẩu mới an toàn cho tài khoản của bạn
          </p>
        </div>

        <Suspense fallback={<Loader2 className="mx-auto size-6 animate-spin text-blue-400" />}>
          <DatLaiMatKhauContent />
        </Suspense>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>

      <p className="text-center mt-5 text-xs text-slate-700">
        © 2026 PM3N Workspace · All rights reserved
      </p>
    </div>
  );
}
