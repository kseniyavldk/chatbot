import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password)
      return badRequest("email and password are required");

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return unauthorized(error.message);

    const res = ok({ user: { id: data.user.id, email: data.user.email } });
    res.headers.set(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    );
    return res;
  } catch (err) {
    return serverError(err);
  }
}
