export type Source = { file: string; page: number };

export type ChatAnswer = { answer: string; sources: Source[] };

export async function sendMessage(sessionId: string, message: string): Promise<ChatAnswer> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
