import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { fetchSheetData, formatKnowledgeBase } from "@/lib/fetchSheetData";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const newsItems = await fetchSheetData();
    const knowledgeBase = formatKnowledgeBase(newsItems);

    const systemPrompt = `Kamu adalah asisten transparansi jurnalistik Kompas. Tugasmu adalah membantu pembaca memahami bagaimana wartawan Kompas menulis dan melaporkan berita secara profesional.

Gunakan HANYA informasi berikut sebagai sumber pengetahuanmu. Jangan mengarang atau menambahkan informasi di luar ini.

=== DATA TRANSPARANSI BERITA ===
${knowledgeBase}
=================================

Panduan menjawab:
- Selalu jawab dalam Bahasa Indonesia.
- Bersikap ramah, jelas, dan edukatif — pembaca mungkin awam tentang proses jurnalistik.
- Jika ditanya tentang berita yang tidak ada dalam data, katakan dengan jujur bahwa informasi tersebut belum tersedia.
- Jelaskan istilah jurnalistik (wire, narasumber, angle, dll.) jika relevan.
- Dorong pembaca untuk memahami pentingnya transparansi jurnalistik.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 800,
      temperature: 0.5,
    });

    const reply = completion.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
}
