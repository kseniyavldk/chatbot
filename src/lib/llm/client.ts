export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(options: {
  messages: LLMMessage[];
  systemPrompt?: string;
}): Promise<ReadableStream<string>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: options.systemPrompt
          ? { parts: [{ text: options.systemPrompt }] }
          : undefined,
        contents,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM API error ${response.status}: ${body}`);
  }

  const reader = response.body!.getReader();
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
            const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) controller.enqueue(chunk);
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
