import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { apiUrl } from "../../lib/api";
import ChatMessage from "./ChatMessage";
import ChatSuggestions from "./ChatSuggestions";
import "./Chatbot.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Kako rezervisati termin?",
  "Kako otkazati termin?",
  "Mogu li birati doktora?",
  "Šta je lista čekanja?",
  "Zaboravio/la sam lozinku",
];

const STORAGE_KEY = "chatbot_history";

// Bez retry — backend queue već čeka između Gemini poziva.
// Retry na frontendu samo multiplicira 429 greške.
async function chatFetch(url: string, options: RequestInit): Promise<Response> {
  return await fetch(url, options);
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Zdravo! Kako vam mogu pomoći?",
};

function loadHistory(): Message[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore parse error
  }
  return [INITIAL_MESSAGE];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitMsg, setWaitMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  }, []);

  useEffect(() => {
    window.addEventListener("istekla-sesija", handleLogout);
    return () => window.removeEventListener("istekla-sesija", handleLogout);
  }, [handleLogout]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;

    const userMsg: Message = { role: "user", content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setWaitMsg("");

    // Pokaži poruku korisniku ako backend čeka Gemini queue (>3s)
    const waitTimer = setTimeout(() => {
      setWaitMsg("Malo gužve, čekam slobodan red...");
    }, 3000);

    try {
      const token = localStorage.getItem("token");
      const historySnapshot = messages.slice(-10);

      const res = await chatFetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: msgText,
          history: historySnapshot,
        }),
      });

      // 1. Provjeri 429 — prikaži poruku sa servera ili fallback
      if (res.status === 429) {
        let serverPoruka = "Dostigli ste limit poruka (20/sat). Pokušajte ponovo za sat vremena.";
        try {
          const data = await res.json();
          if (data.poruka) serverPoruka = data.poruka;
        } catch {
          // Server nije vratio JSON — koristi fallback
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: serverPoruka },
        ]);
        return;
      }

      // 2. Parsiraj JSON za ostale statuse (200, 400, 500...)
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.poruka ?? "Došlo je do greške. Pokušajte ponovo.",
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Greška u komunikaciji. Provjerite internet vezu.",
        },
      ]);
    } finally {
      clearTimeout(waitTimer);
      setWaitMsg("");
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length === 1 && !input.trim() && !loading;

  return (
    <>
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Zatvori chat asistenta" : "Otvori chat asistenta"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="Healthbook asistent">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">⚕</span>
              <div>
                <p className="chatbot-title">Healthbook asistent</p>
                <p className="chatbot-subtitle">Uvijek dostupan</p>
              </div>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Zatvori"
            >
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {loading && (
              <div className="chatbot-typing" aria-label="Asistent kuca...">
                <span />
                <span />
                <span />
                {waitMsg && (
                  <small style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                  }}>
                    {waitMsg}
                  </small>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && (
            <ChatSuggestions
              suggestions={SUGGESTIONS}
              onSelect={(s) => sendMessage(s)}
            />
          )}

          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={handleKeyDown}
              placeholder="Napišite poruku..."
              className="chatbot-input"
              disabled={loading}
              maxLength={1000}
              aria-label="Unesite poruku"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="chatbot-send"
              aria-label="Pošalji poruku"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}