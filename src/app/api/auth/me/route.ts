import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ok, serverError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;
    if (!token) return ok({ user: null });

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return ok({ user: null });

    return ok({ user: { id: user.id, email: user.email } });
  } catch (err) {
    return serverError(err);
  }
}
