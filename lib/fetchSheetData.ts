export interface NewsItem {
  nomor_berita: string;
  judul: string;
  link_berita: string;
  tanggal_liputan: string;
  nama_reporter: string;
  wire_utama: string;
  metode_verifikasi: string;
  metode_utama: string;
  nama_narasumber_utama1: string;
  atribusi_narasumber_1: string;
  nama_narasumber_utama2: string;
  atribusi_narasumber_2: string;
  alasan_angle: string;
  alasan_wire: string;
  alasan_narasumber_1: string;
  alasan_narasumber_2: string;
  apakah_ai: string;
}

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwDmKQ55VvM_BJqSdISJbERkHa23JBe0ER_c5mneaA5AOs5hqSQt0QgfHJ49qEmAj4ianyAik-TOJ4/pub?output=tsv";

let cachedData: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchSheetData(): Promise<NewsItem[]> {
  const now = Date.now();

  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  const res = await fetch(SHEET_URL, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil data Google Sheet");
  }

  const text = await res.text();

  const rows = text
    .split("\n")
    .filter((r) => r.trim().length > 0)
    .map((r) => r.split("\t"));

  if (rows.length === 0 || rows[0].length < 2) {
    throw new Error("Data Google Sheet kosong atau tidak valid");
  }

  const headers = rows.map((r) =>
    (r[0] || "").trim().replace(/\r/g, "")
  );

  const numItems = Math.max(0, rows[0].length - 1);

  const items: NewsItem[] = [];

  for (let col = 1; col <= numItems; col++) {
    const get = (field: string) => {
      const rowIdx = headers.indexOf(field);
      return rowIdx >= 0
        ? (rows[rowIdx]?.[col] || "").trim()
        : "";
    };

    items.push({
      nomor_berita: get("nomor_berita"),
      judul: get("judul"),
      link_berita: get("link_berita"),
      tanggal_liputan: get("tanggal_liputan_yyyymmdd"),
      nama_reporter: get("nama_reporter"),
      wire_utama: get("wire_utama"),
      metode_verifikasi: get("metode_verifikasi"),
      metode_utama: get("metode_utama"),
      nama_narasumber_utama1: get("nama_narasumber_utama1"),
      atribusi_narasumber_1: get("atribusi_narasumber_1"),
      nama_narasumber_utama2: get("nama_narasumber_utama2"),
      atribusi_narasumber_2: get("atribusi_narasumber_2"),
      alasan_angle: get("alasan_angle"),
      alasan_wire: get("alasan_wire"),
      alasan_narasumber_1: get("alasan_narasumber_1"),
      alasan_narasumber_2: get("alasan_narasumber_2"),
      apakah_ai: get(
        "Apakah_AI_digunakan_dalam_proses_berita_ini"
      ),
    });
  }

  cachedData = items;
  cacheTimestamp = now;

  return items;
}

export function formatKnowledgeBase(items: NewsItem[]): string {
  if (items.length === 0) {
    return "Belum ada data transparansi berita yang tersedia.";
  }

  return items
    .map((item, i) => {
      const labelBerita = item.nomor_berita || String(i + 1);

      return `
--- BERITA ${labelBerita} ---
Judul: ${item.judul}
Tanggal: ${item.tanggal_liputan}
Reporter: ${item.nama_reporter}
Link: ${item.link_berita}
Wire Utama: ${item.wire_utama}
Metode Verifikasi: ${item.metode_verifikasi}
Metode Pelaporan: ${item.metode_utama}
Narasumber 1: ${item.nama_narasumber_utama1} (${item.atribusi_narasumber_1})
Narasumber 2: ${item.nama_narasumber_utama2} (${item.atribusi_narasumber_2})
Alasan Pemilihan Angle: ${item.alasan_angle}
Alasan Pemilihan Wire: ${item.alasan_wire}
Alasan Pemilihan Narasumber 1: ${item.alasan_narasumber_1}
Alasan Pemilihan Narasumber 2: ${item.alasan_narasumber_2}
Penggunaan AI: ${item.apakah_ai}
`.trim();
    })
    .join("\n\n");
}
