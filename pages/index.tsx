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
    judul: "Tarif AS–China",
    suggestions: [
      "Siapa reporter berita ini?",
      "Wire apa yang digunakan?",
      "Siapa saja narasumber utamanya?",
      "Apa alasan pemilihan angle berita ini?",
    ],
  },
  {
    nomor: "2",
    judul: "Regulasi AI Eropa",
    suggestions: [
      "Siapa reporter berita ini?",
      "Bagaimana metode verifikasi yang digunakan?",
      "Siapa narasumber dari pihak Uni Eropa?",
      "Wire apa yang dipakai untuk verifikasi?",
    ],
  },
  {
    nomor: "3",
    judul: "Konflik Gaza",
    suggestions: [
      "Siapa reporter berita ini?",
      "Dari wire mana berita ini bersumber?",
      "Siapa narasumber utama berita Gaza?",
      "Bagaimana metode pelaporan yang digunakan?",
    ],
  },
];

const ALL_SUGGESTIONS = [
  "Berita mana yang menggunakan Reuters?",
  "Siapa saja reporter yang meliput hari ini?",
  "Berita mana yang memiliki dua wire verifikasi?",
  "Jelaskan perbedaan metode pelaporan ketiga berita ini.",
];

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Read ?berita= from URL on mount
  useEffect(() => {
    if (!router.isReady) return;
    const param = router.query.berita as string | undefined;
    if (param && ["1", "2", "3"].includes(param)) {
      setSelectedBerita(param);
    }
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
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply || data.error },
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
      ? BERITA_LIST.find((b) => b.nomor === selectedBerita)?.suggestions ?? ALL_SUGGESTIONS
      : ALL_SUGGESTIONS;

  const activeBerita = selectedBerita
    ? BERITA_LIST.find((b) => b.nomor === selectedBerita)
    : null;

  return (
    <>
      <Head>
        <title>Transparansi di Balik Berita — Kompas</title>
        <meta name="description" content="Ruang transparansi pemberitaan harian Kompas" />
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
            <h3 className="header-title">Transparansi di Balik Berita</h3>
            <p className="header-subtitle">Ruang transparansi pemberitaan harian Kompas</p>
          </div>
          <div className="header-accent-bar" />

          {/* PILLBOX */}
          <div className="pillbox-bar">
            <span className="pillbox-label">Fokus berita:</span>
            <div className="pillbox-group">
              {BERITA_LIST.map((b) => (
                <button
                  key={b.nomor}
                  className={`pill ${selectedBerita === b.nomor ? "pill-active" : ""}`}
                  onClick={() => handleSelectBerita(b.nomor)}
                >
                  <span className="pill-num">{b.nomor}</span>
                  {b.judul}
                </button>
              ))}
              {selectedBerita && (
                <button
                  className="pill pill-clear"
                  onClick={() => handleSelectBerita(selectedBerita)}
                >
                  ✕ Semua berita
                </button>
              )}
            </div>
          </div>
        </header>

        {/* CONTEXT BANNER */}
        {activeBerita && (
          <div className="context-banner">
            <span className="context-icon">📰</span>
            <span>
              Fokus pada berita <strong>{activeBerita.nomor}</strong>:{" "}
              <em>{activeBerita.judul}</em>
            </span>
          </div>
        )}

        {/* CHAT AREA */}
        <main className="chat-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-headline">
                {activeBerita
                  ? `Tanya tentang "${activeBerita.judul}"`
                  : "Apa yang ingin Anda ketahui?"}
              </p>
              <p className="empty-sub">
                {activeBerita
                  ? "Tanyakan tentang reporter, narasumber, wire, metode verifikasi, atau alasan angle berita ini."
                  : "Pilih berita di atas untuk fokus, atau tanyakan langsung tentang semua berita yang tersedia."}
              </p>
              <div className="suggestions">
                {activeSuggestions.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => send(s)}>
                    <span className="chip-arrow">→</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.role}`}>
              <div className="message-bubble">
                {m.role === "assistant" && (
                  <span className="bubble-label">Asisten Transparansi</span>
                )}
                <p>{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-bubble">
                <span className="bubble-label">Asisten Transparansi</span>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* INPUT BAR */}
        <footer className="input-bar">
          <div className="input-inner">
            <input
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                activeBerita
                  ? `Tanya tentang "${activeBerita.judul}"...`
                  : "Tanyakan tentang proses jurnalistik berita Kompas..."
              }
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              Kirim
            </button>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          background: #ffffff;
          color: #111111;
          font-family: 'PT Sans', Arial, sans-serif;
        }
      `}</style>

      <style jsx>{`
        .root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
        }

        /* HEADER */
        .header { flex-shrink: 0; }
        .header-top-bar { height: 4px; background: #00599A; }
        .header-inner { padding: 16px 24px 12px; }
        .kompas-label {
          display: block;
          font-family: 'PT Sans', sans-serif;
          font-weight: 700;
          font-size: 11px;
          color: #c92b2c;
          margin-bottom: 5px;
        }
        .header-title {
          font-family: 'Lora', Georgia, serif;
          font-weight: 700;
          font-size: clamp(18px, 3vw, 24px);
          color: #111111;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .header-subtitle {
          font-family: 'PT Sans', sans-serif;
          font-weight: 400;
          font-size: 12.5px;
          color: #666666;
        }
        .header-accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #00599A 65%, #F3C727 65%);
          margin-top: 12px;
        }

        /* PILLBOX */
        .pillbox-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border-bottom: 1px solid #e2e2e2;
          flex-wrap: wrap;
          background: #fafafa;
        }
        .pillbox-label {
          font-family: 'PT Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #999999;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .pillbox-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .pill {
          font-family: 'PT Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: #444444;
          background: #ffffff;
          border: 1px solid #c5d0da;
          padding: 5px 12px;
          cursor: pointer;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .pill:hover {
          border-color: #00599A;
          color: #00599A;
          background: #f0f5fb;
        }
        .pill-active {
          background: #00599A;
          color: #ffffff !important;
          border-color: #00599A;
          font-weight: 700;
        }
        .pill-active:hover {
          background: #004a82 !important;
          border-color: #004a82;
        }
        .pill-num {
          font-size: 10px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e8eef3;
          color: #00599A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pill-active .pill-num {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
        }
        .pill-clear {
          border-color: #e0e0e0;
          color: #888888 !important;
          font-size: 11.5px;
        }
        .pill-clear:hover {
          border-color: #c92b2c !important;
          color: #c92b2c !important;
          background: #fff5f5 !important;
        }

        /* CONTEXT BANNER */
        .context-banner {
          background: #f0f5fb;
          border-bottom: 1px solid #ccdded;
          padding: 7px 24px;
          font-family: 'PT Sans', sans-serif;
          font-size: 12.5px;
          color: #00599A;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .context-icon { font-size: 13px; }

        /* CHAT */
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #f8f9fa;
        }

        /* EMPTY STATE */
        .empty-state {
          margin: auto;
          text-align: left;
          max-width: 560px;
          width: 100%;
        }
        .empty-headline {
          font-family: 'Lora', serif;
          font-weight: 700;
          font-size: 19px;
          color: #111111;
          margin-bottom: 8px;
        }
        .empty-sub {
          font-family: 'PT Sans', sans-serif;
          font-size: 13.5px;
          color: #666666;
          line-height: 1.65;
          margin-bottom: 20px;
        }
        .suggestions { display: flex; flex-direction: column; gap: 7px; }
        .suggestion-chip {
          background: #ffffff;
          border: 1px solid #dde3ea;
          border-left: 3px solid #00599A;
          padding: 10px 14px;
          text-align: left;
          font-family: 'PT Sans', sans-serif;
          font-size: 13px;
          color: #111111;
          cursor: pointer;
          transition: border-left-color 0.15s, background 0.15s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .suggestion-chip:hover {
          background: #f0f5fb;
          border-left-color: #F3C727;
        }
        .chip-arrow {
          color: #00599A;
          font-size: 14px;
          flex-shrink: 0;
        }

        /* MESSAGES */
        .message-row { display: flex; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .message-bubble {
          max-width: 78%;
          padding: 12px 16px;
          line-height: 1.65;
          font-family: 'PT Sans', sans-serif;
          font-size: 14.5px;
        }
        .message-row.user .message-bubble {
          background: #00599A;
          color: #ffffff;
        }
        .message-row.assistant .message-bubble {
          background: #ffffff;
          border: 1px solid #dde3ea;
          border-left: 3px solid #F3C727;
        }
        .bubble-label {
          display: block;
          font-family: 'PT Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00599A;
          margin-bottom: 7px;
        }

        /* TYPING */
        .typing-dots { display: flex; gap: 5px; padding: 4px 0; }
        .typing-dots span {
          width: 6px; height: 6px;
          background: #00599A;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* INPUT */
        .input-bar {
          border-top: 1px solid #e2e2e2;
          background: #ffffff;
          padding: 14px 24px;
          flex-shrink: 0;
        }
        .input-inner { display: flex; gap: 10px; }
        .input-field {
          flex: 1;
          border: 1px solid #c5d0da;
          background: #ffffff;
          padding: 11px 15px;
          font-family: 'PT Sans', sans-serif;
          font-size: 14px;
          color: #111111;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #00599A; }
        .input-field::placeholder { color: #aaaaaa; }
        .send-btn {
          background: #00599A;
          color: #ffffff;
          border: none;
          padding: 11px 22px;
          font-family: 'PT Sans', sans-serif;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .send-btn:hover:not(:disabled) { background: #004a82; }
        .send-btn:disabled { background: #9ab8d0; cursor: not-allowed; }
      `}</style>
    </>
  );
}
