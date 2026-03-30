import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getIdentity, ANON_SESSION_COOKIE } from "@/lib/auth";
import { getChatsByUser, getChatsBySession, createChat } from "@/lib/db/chats";
import { getOrCreateSession } from "@/lib/db/sessions";
import { ok, created, serverError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const identity = await getIdentity();
    const chats =
      identity.type === "authenticated"
        ? await getChatsByUser(identity.userId)
        : await getChatsBySession(identity.sessionId);
    return ok({ chats });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getIdentity();
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title : "New chat";

    if (identity.type === "anonymous") {
      await getOrCreateSession(identity.sessionId);
      const cookieStore = await cookies();
      if (!cookieStore.get(ANON_SESSION_COOKIE)) {
        const res = created({
          chat: await createChat({ sessionId: identity.sessionId, title }),
        });
        res.headers.set(
          "Set-Cookie",
          `${ANON_SESSION_COOKIE}=${identity.sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
        );
        return res;
      }
    }

    const chat = await createChat({
      userId: identity.type === "authenticated" ? identity.userId : undefined,
      sessionId: identity.type === "anonymous" ? identity.sessionId : undefined,
      title,
    });
    return created({ chat });
  } catch (err) {
    return serverError(err);
  }
}
