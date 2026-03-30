export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(options: {
  messages: LLMMessage[];
  systemPrompt?: string;
}): Promise<ReadableStream<string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      system: options.systemPrompt,
      messages: options.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM API error ${response.status}: ${body}`);
  }

  const body = response.body!;
  const reader = body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            if (
              json.type === "content_block_delta" &&
              json.delta?.type === "text_delta"
            ) {
              controller.enqueue(json.delta.text);
            }
          } catch {}
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

export function buildSystemPrompt(documentTexts: string[]): string {
  const base = "You are a helpful assistant. Answer concisely and accurately.";
  if (documentTexts.length === 0) return base;
  const combined = documentTexts.join("\n\n---\n\n").slice(0, 80_000);
  return `${base}\n\nThe user has uploaded the following documents:\n\n${combined}`;
}
