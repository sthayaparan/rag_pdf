import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Message, formatSources } from "@/components/Message";

describe("formatSources", () => {
  it("groups pages by file and sorts them", () => {
    expect(
      formatSources([
        { file: "b.pdf", page: 9 },
        { file: "a.pdf", page: 12 },
        { file: "b.pdf", page: 3 },
      ]),
    ).toEqual(["b.pdf, pages 3, 9", "a.pdf, page 12"]);
  });
});

describe("Message", () => {
  it("renders a user message as plain text", () => {
    render(<Message message={{ role: "user", content: "Is **this** bold?" }} />);

    expect(screen.getByText("Is **this** bold?")).toBeInTheDocument();
  });

  it("renders Markdown, tables and highlighted code blocks in answers", () => {
    const content = [
      "Use `var` for **inference**.",
      "",
      "| Keyword | Kind |",
      "| --- | --- |",
      "| record | type |",
      "",
      "```csharp",
      "public record Person(string Name);",
      "```",
    ].join("\n");

    const { container } = render(<Message message={{ role: "assistant", content, sources: [] }} />);

    expect(screen.getByText("inference").tagName).toBe("STRONG");
    expect(screen.getByText("var").tagName).toBe("CODE");
    expect(screen.getByRole("table")).toBeInTheDocument();
    const code = container.querySelector("pre code");
    expect(code).toHaveClass("hljs", "language-csharp");
    expect(code?.querySelector(".hljs-keyword")).toHaveTextContent("public");
  });

  it("shows sources under an answer, and nothing when there are none", () => {
    const { rerender } = render(
      <Message message={{ role: "assistant", content: "Answer", sources: [{ file: "csharp_core.pdf", page: 5 }] }} />,
    );
    expect(screen.getByText("csharp_core.pdf, page 5")).toBeInTheDocument();

    rerender(<Message message={{ role: "assistant", content: "Answer", sources: [] }} />);
    expect(screen.queryByRole("list", { name: "Sources" })).not.toBeInTheDocument();
  });
});
