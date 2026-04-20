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
    if (param && ["1"].includes(param)) {
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
          <button onClick={() => send()} disabled={!input}>
            Kirim
          </button>
        </footer>

        <div className="attr-footer">
          Dibuat oleh <strong>Irene Sarwindaningrum</strong> · Kompas 2026
        </div>
      </div>

      <style jsx>{`
        .root {
          max-width: 800px;
          margin: auto;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
        }
        .message-row.user {
          text-align: right;
        }
        .message-bubble {
          display: inline-block;
          padding: 10px 14px;
          background: white;
          border: 1px solid #ddd;
          margin-bottom: 10px;
        }
        .input-bar {
          display: flex;
          border-top: 1px solid #ddd;
        }
        input {
          flex: 1;
          padding: 10px;
        }
        button {
          padding: 10px;
          background: #00599a;
          color: white;
        }
      `}</style>
    </>
  );
}
