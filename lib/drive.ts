/**
 * Google Drive API — Upload helper
 * Server-side only: dùng trong API routes Next.js
 * Upload file trực tiếp qua googleapis (không qua GAS)
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

/**
 * Lấy hoặc tạo thư mục con trong Drive
 */
async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  // Tìm folder đã có
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Tạo mới
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return folder.data.id!;
}

/**
 * Upload file vào thư mục dự án trên Google Drive
 *
 * @param maDA       - Mã dự án
 * @param tenDuan    - Tên dự án
 * @param fileName   - Tên file đầu ra
 * @param fileContent - Base64 string
 * @param subFolder  - Tên thư mục con ('Draft' | 'Dinh_kem' | ...)
 */
export async function uploadFileToDrive(
  maDA: string,
  tenDuan: string,
  fileName: string,
  fileContent: string,
  subFolder = 'Draft'
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const auth = await getDriveAuth();
  const drive = google.drive({ version: 'v3', auth });

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('Chưa cấu hình GOOGLE_DRIVE_ROOT_FOLDER_ID trong môi trường');
  }

  // Lấy/tạo thư mục dự án: {MaDA}-{TenDuan}
  const projectFolderName = `${maDA}-${tenDuan}`.trim();
  const projectFolderId = await getOrCreateFolder(drive, projectFolderName, rootFolderId);

  // Lấy/tạo thư mục con (Draft, Dinh_kem...)
  const subFolderId = await getOrCreateFolder(drive, subFolder, projectFolderId);

  // Chuyển Base64 → Buffer → Stream
  const buffer = Buffer.from(fileContent, 'base64');
  const stream = Readable.from(buffer);

  // Xác định MIME type
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc:  'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls:  'application/vnd.ms-excel',
    pdf:  'application/pdf',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';

  // Upload file
  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [subFolderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink, name',
  });

  const file = uploadRes.data;

  // Set permission: bất kỳ ai có link đều xem được
  await drive.permissions.create({
    fileId: file.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId:   file.id!,
    fileUrl:  file.webViewLink!,
    fileName: file.name!,
  };
}
