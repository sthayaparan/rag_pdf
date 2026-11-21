import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import type { Source } from "@/lib/api";

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; sources: Source[] };

export function formatSources(sources: Source[]): string[] {
  const pagesByFile = new Map<string, number[]>();
  for (const { file, page } of sources) {
    pagesByFile.set(file, [...(pagesByFile.get(file) ?? []), page]);
  }
  return [...pagesByFile].map(([file, pages]) => {
    const sorted = pages.toSorted((a, b) => a - b);
    return `${file}, ${sorted.length === 1 ? "page" : "pages"} ${sorted.join(", ")}`;
  });
}

export function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 whitespace-pre-wrap text-ink">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-3">
      <div className="prose-answer">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {message.content}
        </ReactMarkdown>
      </div>
      {message.sources.length > 0 && (
        <ul aria-label="Sources" className="flex flex-wrap gap-2">
          {formatSources(message.sources).map((source) => (
            <li
              key={source}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-muted"
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0 text-accent" aria-hidden="true">
                <path
                  d="M4 1.75h5l3 3v9.5H4zM9 1.75v3h3M6 8.25h4M6 10.75h4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="break-all">{source}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
