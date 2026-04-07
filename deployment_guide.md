# Hướng dẫn Triển khai (Deployment Guide) lên Vercel

Tài liệu này hướng dẫn các bước thiết lập để đưa ứng dụng **PM3N Công Văn & Ký Số** lên môi trường Production trên Vercel.

---

## 1. Chuẩn bị Biến môi trường (Environment Variables)

Truy cập vào **Vercel Dashboard** > **Project của bạn** > **Settings** > **Environment Variables**.
Hãy thêm các biến dưới đây (Sao chép từ file `.env.local` của bạn):

### Nhóm 1: Google OAuth (Quan trọng)
| Tên Biến | Mô tả |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | Lấy từ Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Lấy từ Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Domain của bạn + `/api/auth/callback/google` (Ví dụ: `https://ten-du-an.vercel.app/api/auth/callback/google`) |

### Nhóm 2: Google Sheets & Drive
| Tên Biến | Mô tả |
| :--- | :--- |
| `SPREADSHEET_ID` | ID của tệp Google Sheets quản lý hồ sơ |
| `GAS_WEB_APP_URL` | URL của Google Apps Script đã deploy dưới dạng Web App |

### Nhóm 3: Thông báo Telegram
| Tên Biến | Mô tả |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Token nhận từ @BotFather |
| `TELEGRAM_CHAT_ID` | ID của group hoặc cá nhân nhận thông báo |

### Nhóm 4: OnlyOffice & Security
| Tên Biến | Mô tả |
| :--- | :--- |
| `NEXT_PUBLIC_ONLYOFFICE_SERVER_URL` | URL server OnlyOffice Document Server của bạn |
| `NEXTAUTH_SECRET` | Chuỗi ngẫu nhiên để bảo mật session (Dùng `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL chính thức của deploy (Ví dụ: `https://ten-du-an.vercel.app`) |

---

## 2. Cấu hình Google Cloud Console

Để đăng nhập Google hoạt động trên Production, bạn cần cập nhật **Redirect URIs**:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn dự án của bạn > **APIs & Services** > **Credentials**.
3. Chỉnh sửa **OAuth 2.0 Client IDs**.
4. Tại mục **Authorized redirect URIs**, thêm URL chính thức trên Vercel:
   - `https://ten-du-an.vercel.app/api/auth/callback/google`
5. Nhấn **Save**.

---

## 3. Các lưu ý về hiệu năng đã tối ưu

Hệ thống đã được cấu hình sẵn các tối ưu hóa sau trong mã nguồn:
- **Image Optimization**: Hỗ trợ hiển thị ảnh từ Google Drive một cách bảo mật qua `next/image` và `remotePatterns`.
- **Code Splitting**: Trình soạn thảo ONLYOFFICE chỉ được tải khi người dùng truy cập trang soạn thảo nhờ `next/dynamic`.
- **SSR Disabled for Editor**: Tránh xung đột với các đối tượng `window` của trình duyệt.

---

## 4. Kiểm tra sau khi Deploy
Sau khi Vercel hoàn tất quá trình build:
1. Mở trang Web và thử Đăng nhập bằng Google.
2. Kiểm tra việc tạo hồ sơ mới và xem OnlyOffice có load thành công không.
3. Kiểm tra thông báo Telegram có gửi về khi trạng thái hồ sơ thay đổi không.
