import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ok, badRequest, serverError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password)
      return badRequest("email and password are required");
    if (password.length < 6)
      return badRequest("password must be at least 6 characters");

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (error) return badRequest(error.message);
    if (!data.user) return badRequest("Registration failed");

    const { data: session, error: signInErr } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (signInErr || !session.session) {
      return badRequest("Account created but sign-in failed");
    }

    const res = ok({ user: { id: data.user.id, email: data.user.email } });
    res.headers.set(
      "Set-Cookie",
      `sb-access-token=${session.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    );
    return res;
  } catch (err) {
    return serverError(err);
  }
}
