"use client";

import { useState, type KeyboardEvent } from "react";

type Props = { onSend: (message: string) => void; disabled: boolean };

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const canSend = !disabled && value.trim().length > 0;

  function send() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[0_1px_2px_rgb(27_31_59/0.06),0_8px_24px_-12px_rgb(27_31_59/0.18)] transition-colors focus-within:border-accent"
    >
      <label htmlFor="chat-input" className="sr-only">
        Your question
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about C#"
        className="field-sizing-content max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-ink placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
          <path d="M10 16V4M10 4l-5 5M10 4l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
