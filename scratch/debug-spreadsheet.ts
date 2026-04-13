import { google } from 'googleapis';
import { getGoogleAuth } from '../lib/google-auth';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  console.log(`Using Spreadsheet ID: ${spreadsheetId}`);
  
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const res = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    
    console.log('✅ Spreadsheet found:', res.data.properties?.title);
    console.log('Tabs in this spreadsheet:');
    res.data.sheets?.forEach(s => {
      console.log(` - ${s.properties?.title} (ID: ${s.properties?.sheetId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debug();
