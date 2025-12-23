# Media Downloader

ดาวน์โหลดวิดีโอจาก YouTube ในรูปแบบ MP3 และ MP4

## ความต้องการของระบบ

- Node.js 18+
- **yt-dlp** (จำเป็น) - ใช้สำหรับดาวน์โหลดวิดีโอจาก YouTube
- **FFmpeg** (จำเป็น) - ใช้สำหรับแปลงไฟล์เป็น MP3

## การติดตั้ง

### 1. ติดตั้ง yt-dlp และ FFmpeg

**Windows (ใช้ winget):**
```bash
winget install yt-dlp
```
คำสั่งนี้จะติดตั้ง yt-dlp และ FFmpeg อัตโนมัติ

**macOS (ใช้ Homebrew):**
```bash
brew install yt-dlp ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### 2. ติดตั้ง Dependencies

```bash
npm install
# หรือ
bun install
```

### 3. รัน Development Server

```bash
npm run dev
# หรือ
bun dev
```

เปิด [http://localhost:3000](http://localhost:3000) ใน browser

## การใช้งาน

1. วาง URL YouTube ลงในช่อง input
2. กดปุ่ม "ค้นหา" เพื่อดึงข้อมูลวิดีโอ
3. เลือกคุณภาพที่ต้องการ (MP4 หรือ MP3)
4. กดปุ่ม "ดาวน์โหลด"

## เทคโนโลยีที่ใช้

- **Next.js 15** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **yt-dlp** - YouTube Download Engine
- **@distube/ytdl-core** - YouTube Video Info

## โครงสร้างโปรเจค

```
├── app/
│   ├── api/
│   │   ├── download/      # API สำหรับดาวน์โหลด (ใช้ yt-dlp)
│   │   └── video-info/    # API สำหรับดึงข้อมูลวิดีโอ
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── quality-selector.tsx
│   ├── url-input.tsx
│   ├── video-info-display.tsx
│   └── download-history.tsx
├── lib/
│   ├── youtube-downloader.ts
│   ├── video-extractor.ts
│   └── url-parser.ts
└── tmp/                   # ไฟล์ชั่วคราวสำหรับดาวน์โหลด
```

## หมายเหตุ

- ใช้ `yt-dlp` แทน `ytdl-core` เพราะ YouTube บล็อก request จาก server โดยตรง
- ไฟล์จะถูกดาวน์โหลดไปที่โฟลเดอร์ `tmp/` ก่อนส่งให้ผู้ใช้ แล้วลบทิ้งอัตโนมัติ
- รองรับเฉพาะ YouTube ในตอนนี้

## License

MIT
