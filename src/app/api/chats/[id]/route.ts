import { NextRequest } from "next/server";
import { getIdentity } from "@/lib/auth";
import { assertChatOwner, updateChatTitle, deleteChat } from "@/lib/db/chats";
import { ok, noContent, badRequest, serverError } from "@/lib/api-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const identity = await getIdentity();
    const body = await req.json().catch(() => ({}));
    if (!body.title) return badRequest("title is required");
    await assertChatOwner(id, {
      userId: identity.userId ?? undefined,
      sessionId: identity.sessionId ?? undefined,
    });
    const chat = await updateChatTitle(id, body.title.trim());
    return ok({ chat });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const identity = await getIdentity();
    await assertChatOwner(id, {
      userId: identity.userId ?? undefined,
      sessionId: identity.sessionId ?? undefined,
    });
    await deleteChat(id);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
