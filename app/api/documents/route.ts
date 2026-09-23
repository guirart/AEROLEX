import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-auth";

export const runtime = "nodejs";

async function session() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  return user.id ? { token, userId: user.id } : null;
}

export async function GET(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "";
  if (!path || !path.startsWith(auth.userId + "/") || path.includes("..")) {
    return NextResponse.json({ error: "Documento inválido." }, { status: 403 });
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/aerolex-documents/${encodedPath}`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Documento não encontrado." }, { status: response.status });

  const filename = path.split("/").pop()?.replace(/^[a-f0-9]{64}-/, "") || "documento.pdf";
  const bytes = await response.arrayBuffer();
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
