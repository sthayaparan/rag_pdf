"use client";

import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/ChatInput";
import { Message, type ChatMessage } from "@/components/Message";
import { sendMessage } from "@/lib/api";

export function Chat() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, error]);

  async function send(text: string) {
    setMessages((current) => [...current, { role: "user", content: text }]);
    setPending(true);
    setError(null);
    try {
      const { answer, sources } = await sendMessage(sessionId, text);
      setMessages((current) => [...current, { role: "assistant", content: answer, sources }]);
    } catch {
      setError("No answer came back. Check that the backend server is running, then send your question again.");
    } finally {
      setPending(false);
    }
  }

  function newChat() {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setError(null);
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <span className="flex items-center gap-2 font-semibold tracking-tight text-ink">
            <span className="grid size-7 place-items-center rounded-lg bg-accent font-mono text-xs font-semibold text-white">
              C#
            </span>
            C# Reference
          </span>
          <button
            type="button"
            onClick={newChat}
            disabled={empty || pending}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
          >
            New chat
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5">
        {empty ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
              Ask the C# book anything.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted">
              Answers are drawn from the C# documentation in your knowledge base, with the pages they came from.
            </p>
          </section>
        ) : (
          <div className="flex flex-col gap-8 py-8" aria-live="polite">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
            {pending && (
              <div role="status" aria-label="Thinking" className="flex h-6 items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot [animation-delay:150ms]" />
                <span className="typing-dot [animation-delay:300ms]" />
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        )}
        <div ref={endRef} />
      </main>

      <div className="sticky bottom-0 bg-gradient-to-t from-paper from-70% to-transparent pt-6 pb-5">
        <div className="mx-auto max-w-3xl px-5">
          <ChatInput onSend={send} disabled={pending} />
        </div>
      </div>
    </div>
  );
}
