import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SUPABASE_URL,
  authHeaders,
} from "@/lib/supabase-auth";

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  msg?: string;
  error_description?: string;
};

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=Preencha+email+e+senha", request.url), 303);
  }

  const auth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = (await auth.json().catch(() => ({}))) as SupabaseAuthResponse;
  if (!auth.ok || !data.access_token || !data.refresh_token) {
    const message = encodeURIComponent(data?.msg || data?.error_description || "Email ou senha invalidos");
    return NextResponse.redirect(new URL(`/login?error=${message}`, request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE, data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Number(data.expires_in || 3600),
  });
  response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
