import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';
import { getGoogleAuth } from '../lib/google-auth';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function debugSpreadsheet() {
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log(`--- Debugging Spreadsheet ID: ${spreadsheetId} ---`);

    // 1. Lấy metadata của Spreadsheet
    const ss = await sheets.spreadsheets.get({ spreadsheetId });
    console.log(`Title: ${ss.data.properties?.title}`);
    console.log(`Sheets: ${ss.data.sheets?.map(s => s.properties?.title).join(', ')}`);

    // 2. Đọc dữ liệu thô từ sheet Nguoi_dung
    // Thử đọc dải ô A1:Z1 (để xem Headers thực sự)
    const headerResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Nguoi_dung!A1:Z1',
    });
    console.log('Real Headers (A1:Z1):', headerResp.data.values?.[0] || 'EMPTY');

    // 3. Đọc 10 dòng đầu tiên
    const dataResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Nguoi_dung!A1:Z10',
    });
    const rows = dataResp.data.values || [];
    console.log(`Total rows fetched: ${rows.length}`);
    
    rows.forEach((row, i) => {
        console.log(`Row ${i+1}: ${JSON.stringify(row)}`);
    });

  } catch (err: any) {
    console.error('ERROR:', err.message);
  }
}

debugSpreadsheet();
