import { NextRequest } from "next/server";
import { getIdentity } from "@/lib/auth";
import { assertChatOwner } from "@/lib/db/chats";
import { createMessage, getMessagesByChatId } from "@/lib/db/messages";
import {
  isSessionLimitReached,
  incrementSessionCount,
} from "@/lib/db/sessions";
import { streamChat, buildSystemPrompt } from "@/lib/llm/client";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  badRequest,
  forbidden,
  tooManyRequests,
  serverError,
} from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const identity = await getIdentity();
    const body = await req.json().catch(() => null);
    if (!body?.chat_id || !body?.content)
      return badRequest("chat_id and content are required");

    const { chat_id, content, attachment_ids = [] } = body;

    await assertChatOwner(chat_id, {
      userId: identity.userId ?? undefined,
      sessionId: identity.sessionId ?? undefined,
    });

    if (identity.type === "anonymous") {
      const limited = await isSessionLimitReached(identity.sessionId);
      if (limited)
        return tooManyRequests("Free message limit reached. Please sign up.");
    }

    let documentTexts: string[] = [];
    if (attachment_ids.length > 0) {
      const { data: attachments } = await supabaseAdmin
        .from("attachments")
        .select("extracted_text")
        .in("id", attachment_ids)
        .not("extracted_text", "is", null);
      documentTexts = (attachments ?? [])
        .map((a: any) => a.extracted_text)
        .filter(Boolean);
    }

    const history = await getMessagesByChatId(chat_id);
    const historySlice = history.slice(-40);

    await createMessage({ chatId: chat_id, role: "user", content });

    if (identity.type === "anonymous") {
      await incrementSessionCount(identity.sessionId);
    }

    const llmMessages = [
      ...historySlice.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content },
    ];

    const llmStream = await streamChat({
      messages: llmMessages,
      systemPrompt: buildSystemPrompt(documentTexts),
    });

    let fullResponse = "";

    const sseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = llmStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += value;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`),
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
          reader.releaseLock();
          createMessage({
            chatId: chat_id,
            role: "assistant",
            content: fullResponse || "(empty)",
          }).catch(console.error);
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
