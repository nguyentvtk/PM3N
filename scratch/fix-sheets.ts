import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';
import { getGoogleAuth } from '../lib/google-auth';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function fixSheets() {
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('--- Spreadsheet Info ---');
    console.log(`ID: ${spreadsheetId}`);

    // Lấy thông tin Spreadsheet để kiểm tra tên các sheet tồn tại
    const ssInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetNames = ssInfo.data.sheets?.map(s => s.properties?.title);
    console.log('Existing Sheets:', sheetNames);

    const sheetName = 'Nguoi_dung'; // Tên chính xác từ file gas/setup_sheets.js
    
    console.log(`--- Checking Sheet: ${sheetName} ---`);
    const nguoiDungHeaders = ['MaNV', 'Ten', 'SDT', 'Email', 'Avatar', 'VaiTro', 'ChucVu', 'MatKhau'];
    
    // 1. Cập nhật Headers cho Nguoi_dung
    const updateHeaderRes = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:H1`,
      valueInputOption: 'RAW',
      requestBody: { values: [nguoiDungHeaders] },
    });
    console.log(`✅ Update Headers Result: ${updateHeaderRes.status} ${updateHeaderRes.statusText}`);
    console.log(`Updated Cells: ${updateHeaderRes.data.updatedCells}`);

    // 2. Thêm hoặc cập nhật user
    const userData = [
      'NV001', 
      'Trần Minh Tuấn', 
      '0900000000', 
      'minhtuantran.tn@gmail.com', 
      '', 
      'admin', 
      'Admin Hệ Thống', 
      '1234'
    ];

    const appendRes = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A2:H2`, // Ghi vào dòng 2 luôn cho chắc
        valueInputOption: 'RAW',
        requestBody: { values: [userData] },
    });
    console.log(`✅ Synchronize User Result: ${appendRes.status} ${appendRes.statusText}`);

    // 3. Ho_So
    const hoSoHeaders = [
        'MaHoSo', 'MaDA', 'TenTaiLieu', 'NguoiTrinh', 'LanhDaoDuyet',
        'MucDo', 'NgayTrinh', 'TrangThai', 'FilePath', 'LinkKySo', 'TenDuan',
        'So_VB', 'LoaiVB', 'Ma_Loaitailieu', 'Kyhieu_DVtrinh', 'DinhKem'
    ];
    const updateHoSoRes = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Ho_So!A1:P1',
        valueInputOption: 'RAW',
        requestBody: { values: [hoSoHeaders] },
    });
    console.log(`✅ Update Ho_So Result: ${updateHoSoRes.status}`);

    console.log('\n🚀 ALL SHEETS FIXED! Vui lòng đợi 5-10 giây để Google đồng bộ rồi thử lại.');

  } catch (err: any) {
    console.error('ERROR:', err.message);
    if (err.response) console.error('Data:', JSON.stringify(err.response.data));
  }
}

fixSheets();
