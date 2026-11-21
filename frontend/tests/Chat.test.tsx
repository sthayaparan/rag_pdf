import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Chat } from "@/components/Chat";

function mockFetch(...responses: Array<{ status?: number; body?: unknown }>) {
  const fetchMock = vi.fn();
  for (const { status = 200, body } of responses) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body ?? {}), { status }));
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const answer = {
  answer: "A **record** is a reference type with value equality.",
  sources: [
    { file: "csharp_core.pdf", page: 42 },
    { file: "csharp_core.pdf", page: 7 },
  ],
};

function requestBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body);
}

describe("Chat", () => {
  it("shows the empty state with the input and no messages", () => {
    render(<Chat />);

    expect(screen.getByRole("heading", { name: "Ask the C# book anything." })).toBeInTheDocument();
    expect(screen.getByLabelText("Your question")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New chat" })).toBeDisabled();
  });

  it("shows the question, a typing indicator, then the answer and sources", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolve = r))));
    render(<Chat />);

    await userEvent.type(screen.getByLabelText("Your question"), "What is a record?{Enter}");

    expect(screen.getByText("What is a record?")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Thinking" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    resolve(new Response(JSON.stringify(answer)));

    expect(await screen.findByText("csharp_core.pdf, pages 7, 42")).toBeInTheDocument();
    expect(screen.getByText("record").tagName).toBe("STRONG");
    expect(screen.queryByRole("status", { name: "Thinking" })).not.toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    mockFetch({ status: 500 });
    render(<Chat />);

    await userEvent.type(screen.getByLabelText("Your question"), "Hello{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Check that the backend server is running");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled(); // input was cleared
  });

  it("keeps the session for follow-ups and starts a new one on New chat", async () => {
    const fetchMock = mockFetch({ body: answer }, { body: answer }, { body: answer });
    render(<Chat />);
    const input = screen.getByLabelText("Your question");

    await userEvent.type(input, "First{Enter}");
    await screen.findByText(/value equality/);
    await userEvent.type(input, "Second{Enter}");
    await waitFor(() => expect(screen.getAllByText(/value equality/)).toHaveLength(2));

    expect(requestBody(fetchMock, 1).session_id).toBe(requestBody(fetchMock, 0).session_id);

    await userEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ask the C# book anything." })).toBeInTheDocument();

    await userEvent.type(input, "Third{Enter}");
    await screen.findByText(/value equality/);
    expect(requestBody(fetchMock, 2).session_id).not.toBe(requestBody(fetchMock, 0).session_id);
  });
});
