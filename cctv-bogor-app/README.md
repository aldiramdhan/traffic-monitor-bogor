# Traffic Monitor Bogor

Sistem pemantauan lalu lintas real-time untuk Kota Bogor dengan teknologi CCTV streaming dan analisis AI menggunakan Google Gemini.

## 🚀 Fitur Utama

- **Live CCTV Streaming**: Video streaming real-time dengan teknologi HLS.js
- **AI Traffic Analysis**: Analisis kondisi lalu lintas menggunakan Google Gemini AI
- **Interactive Map**: Peta interaktif dengan marker CCTV menggunakan Leaflet
- **Modern UI/UX**: Interface yang responsive dan modern dengan Tailwind CSS
- **Real-time Updates**: Update status dan analisis secara real-time
- **Error Handling**: Penanganan error yang robust untuk pengalaman pengguna yang baik

## 🛠️ Teknologi

- **Framework**: Next.js 15 dengan App Router
- **UI Framework**: Tailwind CSS
- **Map Library**: React-Leaflet
- **Video Streaming**: HLS.js
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Google Gemini API Key

## 🚀 Installation

1. Clone repository ini:
```bash
git clone <repository-url>
cd new-app
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` dan tambahkan API key Anda:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

5. Jalankan development server:
```bash
npm run dev
```

6. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🗺️ Cara Penggunaan

1. **Lihat Peta**: Peta akan menampilkan lokasi CCTV di Kota Bogor
2. **Klik Marker**: Klik marker CCTV untuk melihat detail lokasi
3. **Stream Video**: Video akan dimuat otomatis jika CCTV online
4. **Analisis AI**: Klik tombol "Analisis Sekarang" untuk mendapatkan analisis lalu lintas AI
5. **Navigasi**: Gunakan tombol "Lihat di Maps" untuk navigasi ke Google Maps

## 🔧 Konfigurasi

### Environment Variables

- `NEXT_PUBLIC_GEMINI_API_KEY`: API key untuk Google Gemini AI

### CCTV Data

Edit file `src/data/cctv-locations.ts` untuk menambah atau mengubah lokasi CCTV:

```typescript
{
  id: 'cctv-xxx',
  nama: 'Nama Lokasi',
  lat: -6.xxxx,
  lon: 106.xxxx,
  stream_url: 'https://stream-url.m3u8',
  status: 'online' | 'offline' | 'maintenance',
  description: 'Deskripsi lokasi'
}
```

## 📱 Responsive Design

Aplikasi ini dirancang untuk bekerja optimal di:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security

- Environment variables untuk API keys
- Client-side dan server-side validation
- Error handling yang aman
- CORS policy yang tepat

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub repository
2. Connect repository ke Vercel
3. Add environment variables di Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Performance

- Lazy loading untuk komponen berat
- Optimized bundle dengan Next.js
- Image optimization otomatis
- Efficient re-rendering dengan React hooks

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── traffic/        # Traffic-specific components
├── data/               # Static data
├── lib/                # Utilities and services
└── types/              # TypeScript type definitions
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

Untuk pertanyaan atau dukungan, silakan buka issue di GitHub repository ini.

---

**Traffic Monitor Bogor** - Dibuat dengan ❤️ menggunakan Next.js, Tailwind CSS, dan AI.
