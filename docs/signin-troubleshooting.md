# Hướng dẫn khắc phục lỗi Sign In

## Các lỗi thường gặp và cách khắc phục

### 1. Lỗi Service Worker Cache
**Triệu chứng:** Console hiển thị lỗi "Failed to execute 'put' on 'Cache'"

**Nguyên nhân:** Service worker cố gắng cache các request không hợp lệ

**Cách khắc phục:**
1. Mở Developer Tools (F12)
2. Vào tab Application
3. Chọn "Clear storage" trong phần Storage
4. Tick tất cả các ô và click "Clear site data"
5. Refresh trang

### 2. Lỗi NextAuth API Route
**Triệu chứng:** Lỗi 404 khi truy cập `/api/auth/signin`

**Nguyên nhân:** Thiếu NextAuth API route

**Cách khắc phục:**
- File `app/api/auth/[...nextauth]/route.ts` đã được tạo tự động

### 3. Lỗi Google OAuth Configuration
**Triệu chứng:** Lỗi "OAuth client not found" hoặc "redirect_uri_mismatch"

**Cách khắc phục:**
1. Kiểm tra Google Cloud Console
2. Đảm bảo OAuth 2.0 Client ID được cấu hình đúng
3. Thêm redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

### 4. Lỗi Environment Variables
**Triệu chứng:** Lỗi authentication hoặc không thể kết nối

**Cách kiểm tra:**
```bash
# Chạy script kiểm tra
powershell -ExecutionPolicy Bypass -File scripts/fix-auth-issues.ps1
```

**Các biến cần thiết trong .env.local:**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 5. Lỗi Firebase Connection
**Triệu chứng:** Lỗi khi lưu user data vào Firestore

**Cách khắc phục:**
1. Kiểm tra Firebase configuration trong `app/config/firebase.ts`
2. Đảm bảo Firestore rules cho phép read/write
3. Kiểm tra network connectivity

## Các bước khắc phục tổng quát

### Bước 1: Clear Cache và Service Worker
```bash
# Chạy script tự động
powershell -ExecutionPolicy Bypass -File scripts/fix-auth-issues.ps1
```

### Bước 2: Restart Development Server
```bash
# Dừng server hiện tại (Ctrl+C)
npm run dev
```

### Bước 3: Test Authentication
1. Mở `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Kiểm tra console để xem có lỗi không

### Bước 4: Kiểm tra Network Tab
1. Mở Developer Tools
2. Vào tab Network
3. Thực hiện sign in
4. Kiểm tra các request có lỗi không

## Lỗi cụ thể và giải pháp

### "chrome-extension is unsupported"
- **Nguyên nhân:** Service worker cố cache extension requests
- **Giải pháp:** Đã được fix trong service worker mới

### "Request method 'POST' is unsupported"
- **Nguyên nhân:** Service worker cố cache POST requests
- **Giải pháp:** Đã được fix, chỉ cache GET requests

### "OAuth client not found"
- **Nguyên nhân:** Sai Google Client ID hoặc chưa cấu hình
- **Giải pháp:** Kiểm tra lại Google Cloud Console

### "redirect_uri_mismatch"
- **Nguyên nhân:** Redirect URI không khớp với cấu hình
- **Giải pháp:** Thêm đúng redirect URI trong Google Console

## Kiểm tra cuối cùng

### 1. Kiểm tra Service Worker
```javascript
// Trong console
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  console.log('Service Workers:', registrations);
});
```

### 2. Kiểm tra NextAuth Session
```javascript
// Trong console (sau khi sign in)
fetch('/api/auth/session').then(r => r.json()).then(console.log);
```

### 3. Kiểm tra Firebase Connection
```javascript
// Kiểm tra trong console
console.log('Firebase config:', firebase.apps);
```

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, vui lòng:
1. Chụp ảnh màn hình console errors
2. Ghi lại các bước đã thực hiện
3. Kiểm tra network connectivity
4. Thử với trình duyệt khác (Chrome, Firefox, Edge)

## Giải pháp nhanh - Chạy script tự động

**Cách nhanh nhất để khắc phục:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/fix-signin-issues.ps1
```

Script này sẽ:
- Dừng development server
- Xóa cache Next.js và npm
- Kiểm tra environment variables
- Reinstall dependencies
- Build lại project
- Hướng dẫn xóa browser cache
- Khởi động server mới

## Cập nhật gần đây (30/06/2025)

- ✅ Sửa lỗi service worker cache hoàn toàn
- ✅ Cập nhật cache version mới
- ✅ Thêm Cross-Origin headers
- ✅ Cải thiện webpack config
- ✅ Loại bỏ chrome-extension conflicts
- ✅ Tạo script fix tự động
- ✅ Cải thiện error handling cho auth requests
