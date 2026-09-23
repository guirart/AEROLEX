import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import {
  ACCESS_COOKIE,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase-auth";

export const runtime = "nodejs";

async function session() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
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
  const caseId = url.searchParams.get("caseId") || "";
  const download = url.searchParams.get("download") === "1";
  if (!caseId) return NextResponse.json({ error: "Caso inválido." }, { status: 400 });

  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${auth.token}`,
  };

  const caseResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}&select=legacy_file_id`,
    { headers, cache: "no-store" }
  );
  if (!caseResponse.ok) return NextResponse.json({ error: "Caso indisponível." }, { status: 502 });

  const cases = await caseResponse.json() as Array<{ legacy_file_id?: string | null }>;
  const fileId = cases[0]?.legacy_file_id;
  if (!fileId) return NextResponse.json({ error: "PDF não vinculado ao caso." }, { status: 404 });

  const fileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_case_files?id=eq.${encodeURIComponent(fileId)}&case_id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}&select=filename,mime_type,sha256,content_base64`,
    { headers, cache: "no-store" }
  );
  if (!fileResponse.ok) return NextResponse.json({ error: "Arquivo indisponível." }, { status: 502 });

  const files = await fileResponse.json() as Array<{
    filename: string;
    mime_type: string;
    sha256: string;
    content_base64: string;
  }>;
  const file = files[0];
  if (!file?.content_base64) return NextResponse.json({ error: "Arquivo vazio." }, { status: 404 });

  const bytes = Buffer.from(file.content_base64, "base64");
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== file.sha256) {
    return NextResponse.json({ error: "Falha de integridade do PDF." }, { status: 500 });
  }

  const disposition = download ? "attachment" : "inline";
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": file.mime_type || "application/pdf",
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
