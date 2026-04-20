import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BeritaInfo {
  nomor: string;
  judul: string;
  suggestions: string[];
}

const BERITA_LIST: BeritaInfo[] = [
  {
    nomor: "1",
    judul: "Asli atau Palsu soal Kematian Netanyahu",
    suggestions: [
      "Siapa reporter berita ini?",
      "Wire apa yang digunakan dalam berita ini?",
      "Bagaimana metode verifikasi yang digunakan?",
      "Siapa saja narasumber utama dalam berita ini?",
      "Apa alasan Kompas mengambil angle berita ini?",
      "Media apa saja yang digunakan untuk verifikasi?",
    ],
  },
];

const VALID_BERITA_NUMBERS = BERITA_LIST.map((b) => b.nomor);

const ALL_SUGGESTIONS = [
  "Siapa reporter berita ini?",
  "Wire apa yang digunakan?",
  "Bagaimana metode verifikasi berita ini?",
  "Siapa saja narasumber utama?",
  "Apa alasan pemilihan angle berita ini?",
  "Mengapa The New York Times digunakan sebagai rujukan utama?",
];

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const param = router.query.berita as string | undefined;
    setSelectedBerita(
      param && VALID_BERITA_NUMBERS.includes(param) ? param : null
    );
  }, [router.isReady, router.query.berita]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectBerita = (nomor: string) => {
    if (selectedBerita === nomor) {
      setSelectedBerita(null);
      router.push("/", undefined, { shallow: true });
    } else {
      setSelectedBerita(nomor);
      router.push(`/?berita=${nomor}`, undefined, { shallow: true });
    }
    setMessages([]);
  };

  const send = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, selectedBerita }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Terjadi kesalahan pada server.");
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply || "Maaf, saya belum bisa menjawab saat ini.",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Terjadi kesalahan. Coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const activeSuggestions =
    selectedBerita
      ? BERITA_LIST.find((b) => b.nomor === selectedBerita)?.suggestions ??
        ALL_SUGGESTIONS
      : ALL_SUGGESTIONS;

  const activeBerita = selectedBerita
    ? BERITA_LIST.find((b) => b.nomor === selectedBerita)
    : null;

  return (
    <>
      <Head>
        <title>Transparansi di Balik Berita — Kompas</title>
        <meta
          name="description"
          content="Ruang transparansi pemberitaan harian Kompas. Pahami proses jurnalistik di balik berita: dari sumber, metode, hingga alasan pemberitaan."
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="root">
        {/* HEADER */}
        <header className="header">
          <div className="header-top-bar" />
          <div className="header-inner">
            <span className="kompas-label">CHATBOT AI</span>
            <h3 className="header-title">
              Transparansi di Balik Berita
            </h3>
            <p className="header-subtitle">
              Pahami bagaimana berita ini disusun: dari sumber, verifikasi,
              hingga alasan editorial di baliknya.
            </p>
          </div>
          <div className="header-accent-bar" />

          {/* PILLBOX */}
          <div className="pillbox-bar">
            <span className="pillbox-label">Fokus berita:</span>
            <div className="pillbox-group">
              {BERITA_LIST.map((b) => (
                <button
                  key={b.nomor}
                  className={`pill ${
                    selectedBerita === b.nomor ? "pill-active" : ""
                  }`}
                  onClick={() => handleSelectBerita(b.nomor)}
                >
                  <span className="pill-num">{b.nomor}</span>
                  {b.judul}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* CONTEXT */}
        {activeBerita && (
          <div className="context-banner">
            📰 Fokus: <strong>{activeBerita.judul}</strong>
          </div>
        )}

        {/* CHAT */}
        <main className="chat-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-headline">
                {activeBerita
                  ? `Tanya tentang "${activeBerita.judul}"`
                  : "Apa yang ingin Anda ketahui?"}
              </p>
              <p className="empty-sub">
                Tanyakan tentang reporter, sumber wire, metode verifikasi,
                narasumber, atau alasan editorial di balik berita ini.
              </p>

              <div className="suggestions">
                {activeSuggestions.map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => send(s)}
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.role}`}>
              <div className="message-bubble">
                {m.role === "assistant" && (
                  <span className="bubble-label">
                    Asisten Transparansi
                  </span>
                )}
                <p>{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-bubble">
                <span className="bubble-label">
                  Asisten Transparansi
                </span>
                <div className="typing">...</div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* INPUT */}
        <footer className="input-bar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tanyakan sesuatu..."
          />
          <button
            onClick={() => send()}
            disabled={loading || input.trim().length === 0}
          >
            Kirim
          </button>
        </footer>

        <div className="attr-footer">
          Dibuat oleh <strong>Irene Sarwindaningrum</strong> · Kompas 2026
        </div>
      </div>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }
        :global(body) {
          margin: 0;
          font-family: "PT Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          background: #f3f4f6;
          color: #1f2937;
        }
        .root {
          max-width: 860px;
          margin: 24px auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 48px);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }
        .header {
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }
        .header-top-bar {
          height: 4px;
          background: linear-gradient(90deg, #0ea5e9, #2563eb);
        }
        .header-inner {
          padding: 20px 24px 12px;
        }
        .kompas-label {
          display: inline-block;
          font-size: 11px;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .header-title {
          margin: 0;
          font-family: "Lora", Georgia, serif;
          font-size: 24px;
          color: #0f172a;
        }
        .header-subtitle {
          margin: 8px 0 0;
          color: #475569;
          line-height: 1.5;
          font-size: 14px;
        }
        .header-accent-bar {
          height: 1px;
          background: #e5e7eb;
        }
        .pillbox-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px 16px;
          overflow-x: auto;
        }
        .pillbox-label {
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
        }
        .pillbox-group {
          display: flex;
          gap: 8px;
          min-width: 0;
        }
        .pill {
          border: 1px solid #dbe2ea;
          background: #f8fafc;
          color: #334155;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .pill:hover {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .pill-active {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .pill-num {
          display: inline-grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #dbeafe;
          font-size: 11px;
          font-weight: 700;
        }
        .context-banner {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          padding: 10px 24px;
          font-size: 14px;
        }
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 18px 18px 10px;
          background: #f8fafc;
        }
        .empty-state {
          margin: 12px auto 0;
          max-width: 640px;
          text-align: center;
          padding: 28px 18px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }
        .empty-headline {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }
        .empty-sub {
          margin: 10px auto 0;
          color: #64748b;
          max-width: 520px;
          line-height: 1.5;
        }
        .suggestions {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .suggestion-chip {
          border: 1px solid #dbe2ea;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .suggestion-chip:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
        }
        .message-row {
          margin-bottom: 12px;
          display: flex;
        }
        .message-row.assistant {
          justify-content: flex-start;
        }
        .message-row.user {
          justify-content: flex-end;
        }
        .message-bubble {
          max-width: min(720px, 88%);
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #dbe2ea;
          line-height: 1.5;
          background: #ffffff;
          color: #1f2937;
        }
        .message-row.user .message-bubble {
          background: #1d4ed8;
          border-color: #1d4ed8;
          color: #ffffff;
        }
        .message-bubble p {
          margin: 0;
          white-space: pre-wrap;
        }
        .bubble-label {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }
        .typing {
          color: #64748b;
          letter-spacing: 0.12em;
        }
        .input-bar {
          display: flex;
          border-top: 1px solid #e2e8f0;
          padding: 14px;
          gap: 10px;
          background: #fff;
        }
        input {
          flex: 1;
          padding: 11px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
        }
        input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
        }
        button {
          padding: 11px 16px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        button:hover {
          background: #1d4ed8;
        }
        button:disabled {
          cursor: not-allowed;
          background: #94a3b8;
        }
        .attr-footer {
          border-top: 1px solid #e2e8f0;
          padding: 10px 16px 12px;
          font-size: 12px;
          color: #64748b;
          background: #f8fafc;
          text-align: center;
        }

        @media (max-width: 700px) {
          .root {
            margin: 0;
            height: 100vh;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
          .header-inner,
          .pillbox-bar,
          .context-banner {
            padding-left: 14px;
            padding-right: 14px;
          }
          .chat-area {
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
}
