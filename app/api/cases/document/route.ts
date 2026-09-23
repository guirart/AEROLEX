import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

function restHeaders(token: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function POST(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const form = await request.formData();
  const caseId = String(form.get("caseId") || "");
  const file = form.get("file");

  if (!caseId || !(file instanceof File)) {
    return NextResponse.json({ error: "Caso e PDF são obrigatórios." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "O arquivo precisa ser PDF." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "O PDF excede o limite de 20 MB." }, { status: 413 });
  }

  const caseResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}&select=*`,
    { headers: restHeaders(auth.token), cache: "no-store" }
  );
  if (!caseResponse.ok) {
    return NextResponse.json({ error: "Não foi possível localizar o caso." }, { status: 502 });
  }
  const rows = await caseResponse.json() as Array<Record<string, unknown>>;
  const current = rows[0];
  if (!current) return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const storagePath = `${auth.userId}/cases/${caseId}/${hash}-${safeName}`;

  const upload = await fetch(
    `${SUPABASE_URL}/storage/v1/object/aerolex-documents/${storagePath.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      },
      body: bytes,
    }
  );
  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    return NextResponse.json({ error: "Falha ao guardar o PDF.", detail: detail.slice(0, 500) }, { status: 502 });
  }

  const existing = Array.isArray(current.documents) ? current.documents.filter(x => typeof x === "string" && String(x).includes("/")) : [];
  const documents = Array.from(new Set([...existing.map(String), storagePath]));

  const update = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}`,
    {
      method: "PATCH",
      headers: { ...restHeaders(auth.token), Prefer: "return=representation" },
      body: JSON.stringify({
        documents,
        source_document: file.name,
        source_key: hash,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const updated = await update.json().catch(() => []);
  if (!update.ok) return NextResponse.json({ error: "PDF salvo, mas não foi possível atualizar o caso." }, { status: 502 });

  return NextResponse.json(Array.isArray(updated) ? updated[0] : updated);
}
