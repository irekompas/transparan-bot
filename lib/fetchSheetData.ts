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
  isi_artikel: string;
  raw_fields: Record<string, string>;
}

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwDmKQ55VvM_BJqSdISJbERkHa23JBe0ER_c5mneaA5AOs5hqSQt0QgfHJ49qEmAj4ianyAik-TOJ4/pub?output=tsv";

let cachedData: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickFirst(
  map: Record<string, string>,
  aliases: string[]
): string {
  for (const alias of aliases) {
    const value = map[alias];
    if (value && value.trim().length > 0) return value.trim();
  }
  return "";
}

function buildNewsItem(rawFields: Record<string, string>): NewsItem {
  return {
    nomor_berita: pickFirst(rawFields, ["nomor_berita", "nomor", "id"]),
    judul: pickFirst(rawFields, ["judul", "title", "headline"]),
    link_berita: pickFirst(rawFields, [
      "link_berita",
      "url",
      "link",
      "tautan",
    ]),
    tanggal_liputan: pickFirst(rawFields, [
      "tanggal_liputan_yyyymmdd",
      "tanggal_liputan",
      "tanggal",
    ]),
    nama_reporter: pickFirst(rawFields, [
      "nama_reporter",
      "reporter",
      "penulis",
    ]),
    wire_utama: pickFirst(rawFields, ["wire_utama", "wire"]),
    metode_verifikasi: pickFirst(rawFields, [
      "metode_verifikasi",
      "verifikasi",
    ]),
    metode_utama: pickFirst(rawFields, [
      "metode_utama",
      "metode_pelaporan",
    ]),
    nama_narasumber_utama1: pickFirst(rawFields, [
      "nama_narasumber_utama1",
      "narasumber_1",
    ]),
    atribusi_narasumber_1: pickFirst(rawFields, [
      "atribusi_narasumber_1",
    ]),
    nama_narasumber_utama2: pickFirst(rawFields, [
      "nama_narasumber_utama2",
      "narasumber_2",
    ]),
    atribusi_narasumber_2: pickFirst(rawFields, [
      "atribusi_narasumber_2",
    ]),
    alasan_angle: pickFirst(rawFields, ["alasan_angle"]),
    alasan_wire: pickFirst(rawFields, ["alasan_wire"]),
    alasan_narasumber_1: pickFirst(rawFields, ["alasan_narasumber_1"]),
    alasan_narasumber_2: pickFirst(rawFields, ["alasan_narasumber_2"]),
    apakah_ai: pickFirst(rawFields, [
      "apakah_ai_digunakan_dalam_proses_berita_ini",
      "apakah_ai",
    ]),
    isi_artikel: pickFirst(rawFields, [
      "isi_artikel",
      "konten_artikel",
      "teks_artikel",
      "body_artikel",
      "full_text",
    ]),
    raw_fields: rawFields,
  };
}

function isLikelyRowOriented(headers: string[]): boolean {
  const rowPatternHints = [
    "nomor_berita",
    "judul",
    "nama_reporter",
    "isi_artikel",
  ];
  const matches = rowPatternHints.filter((hint) => headers.includes(hint));
  return matches.length >= 2;
}

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
  const firstRowHeaders = rows[0].map((cell) => normalizeKey(cell));
  const items: NewsItem[] = [];

  if (isLikelyRowOriented(firstRowHeaders)) {
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const rawFields: Record<string, string> = {};
      firstRowHeaders.forEach((header, colIdx) => {
        if (!header) return;
        rawFields[header] = (row[colIdx] || "").trim();
      });
      items.push(buildNewsItem(rawFields));
    }
  } else {
    const headers = rows.map((r) => normalizeKey(r[0] || ""));
    const numItems = Math.max(0, rows[0].length - 1);

    for (let col = 1; col <= numItems; col++) {
      const rawFields: Record<string, string> = {};
      headers.forEach((header, rowIdx) => {
        if (!header) return;
        rawFields[header] = (rows[rowIdx]?.[col] || "").trim();
      });
      items.push(buildNewsItem(rawFields));
    }
  }

  const filteredItems = items.filter(
    (item) => item.judul || item.isi_artikel || item.nomor_berita
  );

  cachedData = filteredItems;
  cacheTimestamp = now;

  return filteredItems;
}

export function formatKnowledgeBase(items: NewsItem[]): string {
  if (items.length === 0) {
    return "Belum ada data transparansi berita yang tersedia.";
  }

  return items
    .map((item, i) => {
      const labelBerita = item.nomor_berita || String(i + 1);
      const extraFields = Object.entries(item.raw_fields)
        .filter(([key, value]) => {
          if (!value) return false;
          const ignoredKeys = new Set([
            "nomor_berita",
            "nomor",
            "id",
            "judul",
            "title",
            "headline",
            "link_berita",
            "url",
            "link",
            "tautan",
            "tanggal_liputan_yyyymmdd",
            "tanggal_liputan",
            "tanggal",
            "nama_reporter",
            "reporter",
            "penulis",
            "wire_utama",
            "wire",
            "metode_verifikasi",
            "verifikasi",
            "metode_utama",
            "metode_pelaporan",
            "nama_narasumber_utama1",
            "narasumber_1",
            "atribusi_narasumber_1",
            "nama_narasumber_utama2",
            "narasumber_2",
            "atribusi_narasumber_2",
            "alasan_angle",
            "alasan_wire",
            "alasan_narasumber_1",
            "alasan_narasumber_2",
            "apakah_ai_digunakan_dalam_proses_berita_ini",
            "apakah_ai",
            "isi_artikel",
            "konten_artikel",
            "teks_artikel",
            "body_artikel",
            "full_text",
          ]);
          return !ignoredKeys.has(key);
        })
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

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
Isi Artikel Lengkap: ${item.isi_artikel}
Detail Tambahan:
${extraFields || "-"}
`.trim();
    })
    .join("\n\n");
}
