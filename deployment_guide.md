# Hướng dẫn Triển khai (Deployment Guide) - Quy trình Tinh gọn

Tài liệu này hướng dẫn các bước thiết lập để đưa ứng dụng **PM3N Công Văn & Ký Số** lên môi trường Production với quy trình **Xem - Phê duyệt - Ký số** mới.

---

## 1. Chuẩn bị Biến môi trường (Environment Variables)

Truy cập vào **Vercel Dashboard** > **Project của bạn** > **Settings** > **Environment Variables**.
Thiết lập các nhóm biến sau:

### Nhóm 1: Google OAuth (Xác thực)
| Tên Biến | Mô tả |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | Lấy từ Google Cloud Console (Web Client) |
| `GOOGLE_CLIENT_SECRET` | Lấy từ Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://your-domain.vercel.app/api/auth/callback/google` |

### Nhóm 2: Google Sheets & Drive (Dữ liệu)
| Tên Biến | Mô tả |
| :--- | :--- |
| `SPREADSHEET_ID` | ID của tệp Google Sheets quản lý dữ liệu |
| `GAS_WEB_APP_URL` | URL của Google Apps Script (Web App) |

### Nhóm 3: Thông báo & Bảo mật
| Tên Biến | Mô tả |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Token nhận từ @BotFather |
| `TELEGRAM_CHAT_ID` | ID nhóm nhận thông báo |
| `NEXTAUTH_SECRET` | Chuỗi ngẫu nhiên (Dùng `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL chính thức của deploy (Ví dụ: `https://ten-du-an.vercel.app`) |

> [!IMPORTANT]
> **Đã loại bỏ OnlyOffice**: Bạn không cần cấu hình `NEXT_PUBLIC_ONLYOFFICE_SERVER_URL` nữa. Hệ thống hiện sử dụng trình xem trực tiếp của Google Drive.

---

## 2. Cấu hình Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Đảm bảo **Authorized redirect URIs** đã bao gồm domain Vercel của bạn.
3. Đảm bảo Shared Drive hoặc các thư mục dự án đã được cấp quyền "Editor/Viewer" cho tài khoản Service Account hoặc tài khoản chạy GAS.

---

## 3. Quy trình Triển khai Code

### Bước 1: Cập nhật Google Apps Script (GAS)
1. Sao chép nội dung các file trong thư mục `gas/` vào trình soạn thảo GAS.
2. Nhấn **Deploy > New Deployment**.
3. Chọn **Type: Web App**.
4. Thiết lập **Execute as: Me** và **Who has access: Anyone**.
5. Copy URL mới nhận được và cập nhật vào biến `GAS_WEB_APP_URL` trên Vercel.

### Bước 2: Triển khai Web App lên Vercel
1. Đẩy code lên GitHub (nếu đã kết nối).
2. Hoặc chạy lệnh `vercel --prod` từ terminal.
3. Chờ quá trình Build hoàn tất.

---

## 4. Kiểm tra sau khi Deploy
1. **Đăng nhập**: Thử đăng nhập bằng Google hoặc Credentials.
2. **Tạo hồ sơ**: Thử tạo một hồ sơ mới tại trang "Soạn thảo".
3. **Phê duyệt**: Thử nhấn "Phê duyệt" để kiểm tra tính năng tự động xuất PDF.
4. **Ký số**: Kiểm tra xem file PDF có nạp vào trình đóng dấu thành công không.

---
*Mọi thắc mắc vui lòng liên hệ đội ngũ phát triển.*
