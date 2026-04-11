import { useState, useRef, useEffect } from "react";
import Head from "next/head";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Siapa reporter berita tentang konflik Gaza?",
  "Wire apa yang digunakan untuk berita tarif AS-China?",
  "Bagaimana metode verifikasi berita regulasi AI Eropa?",
  "Siapa saja narasumber berita Uni Eropa?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        body: JSON.stringify({ messages: newMessages }),
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

  return (
    <>
      <Head>
        <title>Transparansi di Balik Berita — Kompas</title>
        <meta
          name="description"
          content="Ruang transparansi pemberitaan harian Kompas"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="root">
        {/* HEADER */}
        <header className="masthead">
          <div className="masthead-top">
            <div className="kompas-wordmark">CHATBOT</div>
            <div className="masthead-top-rule" />
          </div>
          <div className="masthead-titles">
            <h3 className="main-title">Transparansi di Balik Berita</h3>
            <p className="subtitle">Ruang transparansi pemberitaan harian Kompas</p>
          </div>
          <div className="masthead-gold-bar" />
        </header>

        {/* CHAT AREA */}
        <main className="chat-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-headline">Apa yang ingin Anda ketahui?</p>
              <p className="empty-sub">
                Tanyakan tentang proses pelaporan, narasumber, wire berita, atau
                metode verifikasi dari berita-berita terbaru Kompas.
              </p>
              <div className="suggestions">
                {SUGGESTED.map((s) => (
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
              placeholder="Tanyakan tentang proses jurnalistik berita ini..."
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
          font-family: 'PT Sans', sans-serif;
        }
      `}</style>

      <style jsx>{`
        .root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
        }

        /* HEADER */
        .masthead {
          background: #fff;
          padding: 20px 24px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .masthead-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .kompas-wordmark {
          font-family: 'PT Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.18em;
          color: #c92b2c;
          flex-shrink: 0;
        }
        .masthead-top-rule {
          flex: 1;
          height: 1px;
          background: #e0e0e0;
        }
        .masthead-titles {
          padding-bottom: 14px;
        }
        .main-title {
          font-family: 'Lora', Georgia, serif;
          font-weight: 700;
          font-size: clamp(20px, 3.5vw, 26px);
          color: #111111;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .subtitle {
          font-family: 'PT Sans', sans-serif;
          font-weight: 400;
          font-size: 13px;
          color: #555555;
        }
        .masthead-gold-bar {
          height: 3px;
          background: linear-gradient(90deg, #00599A 0%, #00599A 60%, #F3C727 60%, #F3C727 100%);
        }

        /* CHAT */
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #fafafa;
        }

        /* EMPTY STATE */
        .empty-state {
          margin: auto;
          text-align: left;
          max-width: 540px;
          width: 100%;
        }
        .empty-headline {
          font-family: 'Lora', Georgia, serif;
          font-weight: 700;
          font-size: 18px;
          color: #111;
          margin-bottom: 8px;
        }
        .empty-sub {
          font-family: 'PT Sans', sans-serif;
          font-size: 14px;
          color: #666;
          line-height: 1.65;
          margin-bottom: 22px;
        }
        .suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .suggestion-chip {
          background: #fff;
          border: 1px solid #d8d8d8;
          border-left: 3px solid #00599A;
          padding: 10px 14px;
          text-align: left;
          font-family: 'PT Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #222;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .suggestion-chip:hover {
          background: #f0f6fd;
          border-left-color: #00599A;
        }
        .chip-arrow {
          color: #00599A;
          font-size: 13px;
          flex-shrink: 0;
        }

        /* MESSAGES */
        .message-row { display: flex; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .message-bubble {
          max-width: 78%;
          padding: 12px 16px;
          line-height: 1.7;
          font-size: 14.5px;
          font-family: 'PT Sans', sans-serif;
          font-weight: 400;
        }
        .message-row.user .message-bubble {
          background: #00599A;
          color: #fff;
          border-radius: 2px;
        }
        .message-row.assistant .message-bubble {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-left: 3px solid #F3C727;
          border-radius: 2px;
        }
        .bubble-label {
          display: block;
          font-family: 'PT Sans', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00599A;
          margin-bottom: 6px;
        }

        /* TYPING */
        .typing-dots { display: flex; gap: 5px; padding: 4px 0; }
        .typing-dots span {
          width: 6px; height: 6px;
          background: #00599A;
          border-radius: 50%;
          opacity: 0.4;
          animation: bounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* INPUT */
        .input-bar {
          border-top: 1px solid #e0e0e0;
          background: #fff;
          padding: 14px 24px;
        }
        .input-inner { display: flex; gap: 8px; }
        .input-field {
          flex: 1;
          border: 1px solid #d0d0d0;
          background: #fff;
          padding: 11px 14px;
          font-family: 'PT Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #111;
          outline: none;
          border-radius: 2px;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #00599A; }
        .input-field::placeholder { color: #aaa; }
        .send-btn {
          background: #00599A;
          color: white;
          border: none;
          padding: 11px 22px;
          font-family: 'PT Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.06em;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .send-btn:hover:not(:disabled) { background: #004a82; }
        .send-btn:disabled { background: #b0c8de; cursor: not-allowed; }
      `}</style>
    </>
  );
}
