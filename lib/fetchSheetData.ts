export interface NewsItem {
  nomor_berita: string;
  judul: string;
  link_berita: string;
  tanggal_liputan: string;
  nama_reporter: string;
  wire_utama: string;
  wire_verifikasi: string;
  metode_utama: string;
  nama_narasumber_utama1: string;
  atribusi_narasumber_1: string;
  nama_narasumber_utama2: string;
  atribusi_narasumber_2: string;
  alasan_angle: string;
}

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoDLGCQ-MSIbjqcSbpNvTx-JTzStv6qCo_dhHuyb5TArsDZEFo8-mKAjQep-TKA-lIH8ntO3QB-kWR/pub?gid=0&single=true&output=tsv";

let cachedData: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchSheetData(): Promise<NewsItem[]> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  const res = await fetch(SHEET_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("Gagal mengambil data Google Sheet");

  const text = await res.text();
  const rows = text.split("\n").map((r) => r.split("\t"));

  // rows[0] = headers, rows[1..] = data columns (one per news item)
  const headers = rows.map((r) => r[0].trim());
  const numItems = rows[0].length - 1;

  const items: NewsItem[] = [];
  for (let col = 1; col <= numItems; col++) {
    const get = (field: string) => {
      const rowIdx = headers.indexOf(field);
      return rowIdx >= 0 ? (rows[rowIdx]?.[col] || "").trim() : "";
    };

    items.push({
      nomor_berita: get("nomor_berita"),
      judul: get("judul"),
      link_berita: get("link_berita"),
      tanggal_liputan: get("tanggal_liputan_yyyymmdd"),
      nama_reporter: get("nama_reporter"),
      wire_utama: get("wire_utama"),
      wire_verifikasi: get("wire_verifikasi"),
      metode_utama: get("metode_utama"),
      nama_narasumber_utama1: get("nama_narasumber_utama1"),
      atribusi_narasumber_1: get("atribusi_narasumber_1"),
      nama_narasumber_utama2: get("nama_narasumber_utama2"),
      atribusi_narasumber_2: get("atribusi_narasumber_2"),
      alasan_angle: get("alasan_angle"),
    });
  }

  cachedData = items;
  cacheTimestamp = now;
  return items;
}

export function formatKnowledgeBase(items: NewsItem[]): string {
  return items
    .map((item, i) => {
      return `
--- BERITA ${i + 1} ---
Judul: ${item.judul}
Tanggal: ${item.tanggal_liputan}
Reporter: ${item.nama_reporter}
Link: ${item.link_berita}
Wire Utama: ${item.wire_utama}
Wire Verifikasi: ${item.wire_verifikasi}
Metode Pelaporan: ${item.metode_utama}
Narasumber 1: ${item.nama_narasumber_utama1} (${item.atribusi_narasumber_1})
Narasumber 2: ${item.nama_narasumber_utama2} (${item.atribusi_narasumber_2})
Alasan Pemilihan Angle: ${item.alasan_angle}
`.trim();
    })
    .join("\n\n");
}
