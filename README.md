# Kompas Transparansi Chatbot

AI chatbot untuk membantu pembaca Kompas memahami proses jurnalistik di balik berita.

## Setup Lokal

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Buat file `.env.local`**
   ```bash
   cp .env.local.example .env.local
   ```
   Isi `OPENAI_API_KEY` dengan API key OpenAI kamu.

3. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

1. Push repo ini ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Tambahkan environment variable:
   - `OPENAI_API_KEY` = API key OpenAI kamu
4. Deploy — selesai!

## Cara Update Knowledge Base

Cukup update Google Sheet yang sudah dipublish. Chatbot otomatis mengambil data terbaru setiap 5 menit (cache TTL).

## Struktur Proyek

```
pages/
  index.tsx        # Halaman utama chatbot
  api/
    chat.ts        # API route — memanggil OpenAI
lib/
  fetchSheetData.ts  # Fetch & parse Google Sheet
```
