import { NextRequest } from "next/server";
import { getIdentity } from "@/lib/auth";
import { assertChatOwner } from "@/lib/db/chats";
import { getMessagesByChatId } from "@/lib/db/messages";
import { ok, serverError } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params;
    const identity = await getIdentity();
    await assertChatOwner(chatId, {
      userId: identity.userId ?? undefined,
      sessionId: identity.sessionId ?? undefined,
    });
    const messages = await getMessagesByChatId(chatId);
    return ok({ messages });
  } catch (err) {
    return serverError(err);
  }
}
