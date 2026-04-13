import { google } from 'googleapis';
import { getGoogleAuth } from '../lib/google-auth';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const sheetName = 'Nguoi_dung';
  
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log(`Reading sheet: ${sheetName}`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:Z1`, // Get first row
    });
    
    const headers = res.data.values?.[0];
    if (!headers) {
      console.log('❌ No headers found!');
      return;
    }
    
    console.log('Headers found (with length and exact characters):');
    headers.forEach((h, i) => {
      console.log(`Column ${i + 1}: [${h}] (Length: ${h.length})`);
    });
    
    // Check first data row too
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A3:Z3`, // Get row 3 (from user screenshot)
    });
    const row3 = dataRes.data.values?.[0];
    if (row3) {
      console.log('\nRow 3 values:');
      row3.forEach((v, i) => {
        console.log(`Column ${i + 1}: [${v}] (Length: ${v.length})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debug();
