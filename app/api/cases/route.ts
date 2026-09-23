import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase-auth";

type CasePayload = {
  id?: string;
  title?: string;
  client?: string;
  opponent?: string;
  caseNumber?: string;
  status?: "Ativo" | "Encerrado";
  deadline?: string;
  deadlineStart?: string;
  deadlineDays?: number;
  deadlineBasis?: string;
  notes?: string;
  documents?: string[];
  sourceDocument?: string;
  sourceKey?: string;
  category?: string;
  summary?: string;
  partyDetails?: unknown[];
  facts?: unknown[];
  chronology?: unknown[];
  claims?: unknown[];
  theses?: unknown[];
  evidence?: unknown[];
  risks?: unknown[];
  jurisprudence?: unknown[];
};

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

function headers(token: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function toRow(body: CasePayload, userId: string) {
  return {
    user_id: userId,
    title: body.title || "Caso sem título",
    client: body.client || "",
    opponent: body.opponent || "",
    case_number: body.caseNumber || "",
    status: body.status || "Ativo",
    deadline: body.deadline || null,
    deadline_start: body.deadlineStart || null,
    deadline_days: body.deadlineDays || null,
    deadline_basis: body.deadlineBasis || "CPC",
    notes: body.notes || "",
    documents: body.documents || [],
    source_document: body.sourceDocument || null,
    source_key: body.sourceKey || null,
    category: body.category || null,
    summary: body.summary || null,
    party_details: body.partyDetails || [],
    facts: body.facts || [],
    chronology: body.chronology || [],
    claims: body.claims || [],
    theses: body.theses || [],
    evidence: body.evidence || [],
    risks: body.risks || [],
    jurisprudence: body.jurisprudence || [],
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?select=*&order=updated_at.desc`,
    { headers: headers(auth.token), cache: "no-store" }
  );

  const data = await response.json().catch(() => []);
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as CasePayload;
  const row = toRow(body, auth.userId);

  if (row.source_key) {
    const findResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/aerolex_cases?select=id&source_key=eq.${encodeURIComponent(row.source_key)}&limit=1`,
      { headers: headers(auth.token), cache: "no-store" }
    );

    const found = (await findResponse.json().catch(() => [])) as Array<{ id?: string }>;
    const existingId = found[0]?.id;

    if (existingId) {
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(existingId)}`,
        {
          method: "PATCH",
          headers: { ...headers(auth.token), Prefer: "return=representation" },
          body: JSON.stringify(row),
        }
      );

      const updated = await updateResponse.json().catch(() => ({}));
      return NextResponse.json(updated, { status: updateResponse.status });
    }
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/aerolex_cases`, {
    method: "POST",
    headers: { ...headers(auth.token), Prefer: "return=representation" },
    body: JSON.stringify(row),
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as CasePayload;
  if (!body.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(body.id)}`,
    {
      method: "PATCH",
      headers: { ...headers(auth.token), Prefer: "return=representation" },
      body: JSON.stringify(toRow(body, auth.userId)),
    }
  );

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE", headers: headers(auth.token) }
  );

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return NextResponse.json({ ok: false, error: error || "delete_failed" }, { status: response.status });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
