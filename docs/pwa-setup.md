# PWA Setup Documentation

## Tổng quan
Trang web PTE Intensive Management đã được chuyển đổi thành Progressive Web App (PWA) với các tính năng sau:

## Các tính năng PWA đã triển khai

### 1. Web App Manifest (`public/manifest.json`)
- **Name**: PTE Intensive Management
- **Short Name**: PTE Management
- **Theme Color**: #fc5d01 (màu cam chính)
- **Background Color**: #ffffff
- **Display Mode**: standalone
- **Start URL**: /
- **Icons**: Đầy đủ các kích thước từ 72x72 đến 512x512

### 2. Service Worker (`public/sw.js`)
- **Caching Strategy**: Cache-first với network fallback
- **Cached Resources**: Tất cả các trang chính và assets
- **Offline Support**: Hiển thị nội dung cached khi offline
- **Background Sync**: Hỗ trợ đồng bộ dữ liệu khi có kết nối
- **Push Notifications**: Sẵn sàng cho thông báo push

### 3. PWA Components

#### PWAInstaller (`app/components/PWAInstaller.tsx`)
- Tự động hiển thị nút "Install App" khi có thể cài đặt
- Xử lý sự kiện `beforeinstallprompt`
- Ẩn nút sau khi cài đặt thành công

#### OnlineStatus (`app/components/OnlineStatus.tsx`)
- Hiển thị trạng thái online/offline
- Thông báo khi kết nối được khôi phục
- Tự động ẩn sau 3 giây khi online

### 4. Offline Page (`app/offline/page.tsx`)
- Trang hiển thị khi không có kết nối internet
- Liệt kê các tính năng có sẵn offline
- Nút thử lại kết nối
- Tự động redirect khi có kết nối

### 5. Icons
- Tạo bằng PowerShell script (`generate-icons.ps1`)
- Màu nền: #fc5d01 (cam chính)
- Text: "PTE" màu trắng
- Các kích thước: 72, 96, 128, 144, 152, 192, 384, 512 pixels

## Cách sử dụng

### Cài đặt PWA
1. Mở trang web trên trình duyệt hỗ trợ PWA (Chrome, Edge, Firefox, Safari)
2. Nút "Install App" sẽ xuất hiện ở góc dưới bên phải
3. Click vào nút để cài đặt ứng dụng
4. Ứng dụng sẽ xuất hiện như một app native trên thiết bị

### Sử dụng Offline
1. Khi mất kết nối internet, ứng dụng vẫn hoạt động
2. Có thể xem dữ liệu đã cache
3. Thông báo trạng thái offline sẽ hiển thị
4. Tự động thông báo khi có kết nối trở lại

### Tính năng có sẵn Offline
- Xem danh sách học viên (cached)
- Duyệt tasks và projects (cached)
- Xem analytics (cached)
- Truy cập settings
- Xem useful links

## Cấu hình kỹ thuật

### Next.js Configuration (`next.config.ts`)
```typescript
// Headers cho Service Worker
{
  source: '/sw.js',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=0, must-revalidate',
    },
    {
      key: 'Service-Worker-Allowed',
      value: '/',
    },
  ],
}
```

### Layout Configuration (`app/layout.tsx`)
```typescript
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#fc5d01',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PTE Management',
  },
  // ... icons configuration
}
```

## Kiểm tra PWA

### Chrome DevTools
1. Mở DevTools (F12)
2. Vào tab "Application"
3. Kiểm tra "Manifest" - xem thông tin PWA
4. Kiểm tra "Service Workers" - xem trạng thái SW
5. Kiểm tra "Storage" - xem cached data

### Lighthouse Audit
1. Mở DevTools
2. Vào tab "Lighthouse"
3. Chọn "Progressive Web App"
4. Chạy audit để kiểm tra điểm PWA

### PWA Criteria Checklist
- ✅ HTTPS (required for production)
- ✅ Web App Manifest
- ✅ Service Worker
- ✅ Icons (multiple sizes)
- ✅ Offline functionality
- ✅ Responsive design
- ✅ Fast loading

## Deployment Notes

### Production Requirements
1. **HTTPS**: PWA chỉ hoạt động trên HTTPS
2. **Service Worker**: Phải được serve với đúng headers
3. **Manifest**: Phải accessible và valid
4. **Icons**: Tất cả icons phải tồn tại

### Vercel Deployment
- Service Worker tự động được serve
- Manifest được cache với max-age
- Icons được optimize tự động

## Troubleshooting

### Service Worker không register
- Kiểm tra console errors
- Đảm bảo `/sw.js` accessible
- Kiểm tra HTTPS requirement

### Install prompt không hiện
- Kiểm tra PWA criteria
- Đảm bảo manifest valid
- Kiểm tra trình duyệt hỗ trợ

### Offline không hoạt động
- Kiểm tra Service Worker active
- Xem cached resources trong DevTools
- Kiểm tra fetch event handlers

## Tương lai

### Planned Features
1. **Push Notifications**: Thông báo cho deadlines, payments
2. **Background Sync**: Đồng bộ data khi có kết nối
3. **App Shortcuts**: Quick actions từ home screen
4. **Share Target**: Nhận data từ apps khác

### Performance Optimizations
1. **Precaching**: Cache critical resources
2. **Runtime Caching**: Cache API responses
3. **Update Strategies**: Smart cache updates
4. **Compression**: Optimize cached assets
