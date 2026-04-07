/**
 * Google Drive API — Upload helper
 * Server-side only: dùng trong API routes Next.js
 *
 * ⚠️  Service Accounts KHÔNG có quota Drive cá nhân.
 *     Phải upload vào Shared Drive (Team Drive) mà Service Account
 *     được thêm vào với quyền Contributor (hoặc cao hơn).
 *
 * Cấu hình bắt buộc trong Vercel / .env.local:
 *   GOOGLE_DRIVE_ROOT_FOLDER_ID  = ID thư mục gốc trong Shared Drive
 *   (Service Account phải có quyền Contributor trên Shared Drive này)
 */
import { google } from 'googleapis';
import { JWT } from 'googleapis-common';
import { Readable } from 'stream';

let _driveAuthClient: JWT | null = null;

async function getDriveAuth(): Promise<JWT> {
  if (_driveAuthClient) return _driveAuthClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (key && key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }

  if (!email || !key) {
    throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL hoặc GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }

  const client = new JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  await client.authorize();
  _driveAuthClient = client;
  return client;
}

// ============================================================
// Helper: Lấy hoặc tạo thư mục con trong Drive
// supportsAllDrives=true bắt buộc để làm việc với Shared Drive
// ============================================================
async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  // Tìm folder đã có (hỗ trợ cả Shared Drive)
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Tạo folder mới trong cùng drive với parent
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id!;
}

// ============================================================
// Xác định MIME type từ tên file
// ============================================================
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc:  'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls:  'application/vnd.ms-excel',
    pdf:  'application/pdf',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// ============================================================
// Upload file vào Shared Drive theo cấu trúc dự án
// ============================================================
/**
 * Upload file vào thư mục dự án trên Google Shared Drive.
 *
 * Cấu trúc: [ROOT] / {MaDA}-{TenDuan} / {subFolder} / {fileName}
 *
 * @param maDA        Mã dự án  (e.g. 'DA-001')
 * @param tenDuan     Tên dự án (e.g. 'Phát triển ứng dụng')
 * @param fileName    Tên file  (e.g. 'BaoCao_Q1.docx')
 * @param fileContent Base64 string nội dung file
 * @param subFolder   Tên thư mục con (mặc định 'Draft')
 */
export async function uploadFileToDrive(
  maDA: string,
  tenDuan: string,
  fileName: string,
  fileContent: string,
  subFolder = 'Draft'
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const auth    = await getDriveAuth();
  const drive   = google.drive({ version: 'v3', auth });

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error(
      'Chưa cấu hình GOOGLE_DRIVE_ROOT_FOLDER_ID. ' +
      'Thêm biến này vào Vercel Environment Variables và đảm bảo Service Account có quyền Contributor trên Shared Drive.'
    );
  }

  // 1. Lấy/tạo thư mục dự án: {MaDA}-{TenDuan}
  const projectFolderName = `${maDA}-${tenDuan}`.trim();
  const projectFolderId   = await getOrCreateFolder(drive, projectFolderName, rootFolderId);

  // 2. Lấy/tạo thư mục con (Draft, Dinh_kem...)
  const subFolderId = await getOrCreateFolder(drive, subFolder, projectFolderId);

  // 3. Chuyển Base64 → Buffer → Stream
  const buffer = Buffer.from(fileContent, 'base64');
  const stream = Readable.from(buffer);

  // 4. Upload file (supportsAllDrives bắt buộc cho Shared Drive)
  const uploadRes = await drive.files.create({
    requestBody: {
      name:    fileName,
      parents: [subFolderId],
    },
    media: {
      mimeType: getMimeType(fileName),
      body:     stream,
    },
    fields:           'id, webViewLink, name',
    supportsAllDrives: true,
  });

  const file = uploadRes.data;
  if (!file.id) throw new Error('Upload thất bại: không nhận được file ID từ Drive');

  // 5. Cố gắng set quyền "anyone with link can view" (có thể fail với Shared Drive)
  try {
    await drive.permissions.create({
      fileId:            file.id,
      requestBody:       { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });
  } catch {
    // Shared Drive có thể không cho phép public link — bỏ qua lỗi này
    console.warn('[Drive] Không thể set public permission — file vẫn được upload thành công.');
  }

  return {
    fileId:   file.id,
    fileUrl:  file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    fileName: file.name || fileName,
  };
}
