"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export default function ChatWindow({ threadId, otherName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${threadId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setLoaded(true);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const body = text.trim();
    setText("");
    await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    load();
  }

  let lastDay = null;

  return (
    <div className="card flex h-[62vh] flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto bg-black/20 p-4">
        {loaded && messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">
            Start the conversation with {otherName}.
          </p>
        )}
        {messages.map((m) => {
          const day = new Date(m.createdAt).toLocaleDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white/5 px-3 py-0.5 text-xs text-slate-400 ring-1 ring-white/10">{day}</span>
                </div>
              )}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    m.mine
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md bg-white/[0.07] text-slate-100 ring-1 ring-white/10"
                  }`}
                >
                  {m.body}
                  <div className={`mt-0.5 text-[10px] ${m.mine ? "text-brand-100" : "text-slate-500"}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 bg-white/[0.02] p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="input"
        />
        <button disabled={sending} className="btn-primary px-4">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current"><path d="M2 10 18 3l-4 14-4-5-5-2Z"/></svg>
        </button>
      </form>
    </div>
  );
}
