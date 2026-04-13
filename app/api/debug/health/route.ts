import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuth } from '@/lib/google-auth';
import { google } from 'googleapis';

export async function GET(_req: NextRequest) {
  const results: {
    timestamp: string;
    environment: Record<string, string>;
    checks: Record<string, { 
      status: string; 
      message?: string; 
      title?: string; 
      tabs?: (string | null | undefined)[]; 
      response?: string; 
      hint?: string 
    }>;
  } = {
    timestamp: new Date().toISOString(),
    environment: {
      GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID ? '✅ Đã cấu hình' : '❌ Thiếu',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Đã cấu hình' : '❌ Thiếu',
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? '✅ Đã cấu hình' : '❌ Thiếu',
      GAS_WEB_APP_URL: process.env.GAS_WEB_APP_URL ? '✅ Đã cấu hình' : '❌ Thiếu',
    },
    checks: {}
  };

  // 1. Kiểm tra Google Sheets Connection
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const ssId = process.env.GOOGLE_SPREADSHEET_ID;
    
    if (ssId) {
      const res = await sheets.spreadsheets.get({ spreadsheetId: ssId });
      results.checks.sheets = {
        status: 'OK',
        title: res.data.properties?.title || 'Không rõ tiêu đề',
        tabs: res.data.sheets?.map(s => s.properties?.title) || []
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    results.checks.sheets = {
      status: 'ERROR',
      message: error.message,
      hint: error.message.includes('invalid_grant') ? 'Kiểm tra lại Email và Private Key của Service Account' : 'Kiểm tra quyền truy cập của Service Account vào Sheet'
    };
  }

  // 2. Kiểm tra GAS Web App Connection
  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (gasUrl) {
    try {
      const gasRes = await fetch(gasUrl, { method: 'GET' });
      const text = await gasRes.text();
      results.checks.gas = {
        status: 'OK',
        response: text.substring(0, 100)
      };
    } catch (err: unknown) {
      const error = err as Error;
      results.checks.gas = {
        status: 'ERROR',
        message: error.message
      };
    }
  }

  return NextResponse.json(results);
}
