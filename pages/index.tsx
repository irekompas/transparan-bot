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
        <title>Transparansi Berita — Kompas</title>
        <meta
          name="description"
          content="Tanya bagaimana wartawan Kompas meliput berita"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="root">
        {/* MASTHEAD */}
        <header className="masthead">
          <div className="masthead-inner">
            <div className="masthead-rule" />
            <div className="masthead-center">
              <span className="kicker">Ruang Transparansi</span>
              <h1 className="brand">KOMPAS</h1>
              <p className="tagline">Tanya bagaimana berita ini ditulis</p>
            </div>
            <div className="masthead-rule" />
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="chat-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="empty-headline">Mulai percakapan</p>
              <p className="empty-sub">
                Tanyakan tentang proses pelaporan, narasumber, wire berita, atau
                metode verifikasi dari berita-berita terbaru Kompas.
              </p>
              <div className="suggestions">
                {SUGGESTED.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => send(s)}>
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
          background: #f5f0e8;
          color: #1a1206;
          font-family: 'Source Serif 4', Georgia, serif;
        }
      `}</style>

      <style jsx>{`
        .root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 780px;
          margin: 0 auto;
        }

        /* MASTHEAD */
        .masthead {
          background: #f5f0e8;
          padding: 24px 20px 16px;
          border-bottom: 3px double #1a1206;
        }
        .masthead-inner { display: flex; flex-direction: column; gap: 10px; }
        .masthead-rule { height: 1px; background: #1a1206; }
        .masthead-center { text-align: center; padding: 4px 0; }
        .kicker {
          font-family: 'Source Serif 4', serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c0392b;
          display: block;
          margin-bottom: 4px;
        }
        .brand {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 6vw, 52px);
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1;
          color: #1a1206;
        }
        .tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 13px;
          font-weight: 300;
          color: #5a4a3a;
          margin-top: 4px;
        }

        /* CHAT */
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* EMPTY STATE */
        .empty-state { margin: auto; text-align: center; max-width: 520px; }
        .empty-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          margin-bottom: 10px;
        }
        .empty-sub {
          font-size: 14px;
          font-weight: 300;
          color: #5a4a3a;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .suggestions { display: flex; flex-direction: column; gap: 10px; }
        .suggestion-chip {
          background: white;
          border: 1px solid #c8b89a;
          border-left: 3px solid #c0392b;
          padding: 10px 16px;
          text-align: left;
          font-family: 'Source Serif 4', serif;
          font-size: 13px;
          color: #1a1206;
          cursor: pointer;
          transition: background 0.15s;
        }
        .suggestion-chip:hover { background: #ede8df; }

        /* MESSAGES */
        .message-row { display: flex; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .message-bubble {
          max-width: 78%;
          padding: 14px 18px;
          line-height: 1.7;
          font-size: 14.5px;
          font-weight: 300;
        }
        .message-row.user .message-bubble {
          background: #1a1206;
          color: #f5f0e8;
        }
        .message-row.assistant .message-bubble {
          background: white;
          border: 1px solid #c8b89a;
          border-left: 3px solid #c0392b;
        }
        .bubble-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #c0392b;
          margin-bottom: 6px;
          font-weight: 400;
        }

        /* TYPING */
        .typing-dots { display: flex; gap: 5px; padding: 4px 0; }
        .typing-dots span {
          width: 6px; height: 6px;
          background: #c8b89a;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        /* INPUT */
        .input-bar {
          border-top: 3px double #1a1206;
          background: #f5f0e8;
          padding: 16px 20px;
        }
        .input-inner { display: flex; gap: 10px; }
        .input-field {
          flex: 1;
          border: 1px solid #c8b89a;
          background: white;
          padding: 12px 16px;
          font-family: 'Source Serif 4', serif;
          font-size: 14px;
          font-weight: 300;
          color: #1a1206;
          outline: none;
        }
        .input-field:focus { border-color: #1a1206; }
        .input-field::placeholder { color: #a09080; }
        .send-btn {
          background: #c0392b;
          color: white;
          border: none;
          padding: 12px 22px;
          font-family: 'Source Serif 4', serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background 0.15s;
        }
        .send-btn:hover:not(:disabled) { background: #a93226; }
        .send-btn:disabled { background: #c8b89a; cursor: not-allowed; }
      `}</style>
    </>
  );
}
