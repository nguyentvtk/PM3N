import { getNguoiDungByEmail } from '../lib/sheets';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const email = 'minhtuantran.tn@gmail.com';
  console.log(`Checking email: ${email}`);
  console.log(`GOOGLE_SPREADSHEET_ID: ${process.env.GOOGLE_SPREADSHEET_ID}`);
  
  try {
    const user = await getNguoiDungByEmail(email);
    if (!user) {
      console.log('❌ User not found');
    } else {
      console.log('✅ User found:', JSON.stringify(user, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching user:', error);
  }
}

debug();
