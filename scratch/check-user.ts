import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';
import { getGoogleAuth } from '../lib/google-auth';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkUser(email: string) {
  try {
    console.log('--- Initializing Auth ---');
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = 'Nguoi_Dung!A:E'; 

    console.log(`--- Fetching Sheets: ${spreadsheetId} ---`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    const headers = rows[0];
    console.log('Headers:', headers);

    const targetRow = rows.find(r => r[1]?.toLowerCase() === email.toLowerCase());
    if (targetRow) {
      console.log('MATCH FOUND!');
      console.log('Row Data:', targetRow);
      // Giả sử: [MaNV, Email, Ten, MatKhau, VaiTro]
      console.log(`MaNV: ${targetRow[0]}`);
      console.log(`Email: ${targetRow[1]}`);
      console.log(`MatKhau: "${targetRow[3]}" (Length: ${targetRow[3]?.length || 0})`);
    } else {
      console.log(`User not found: ${email}`);
    }

  } catch (err: any) {
    console.error('ERROR:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data));
    }
  }
}

const targetEmail = process.argv[2] || 'minhtuantran.tn@gmail.com';
checkUser(targetEmail);
