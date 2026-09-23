import { generateText } from "ai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

type Analysis = {
  pageCount: number | null;
  title: string;
  client: string;
  opponent: string;
  caseNumber: string;
  category: string;
  summary: string;
  facts: Array<{ page: string; title: string; text: string }>;
  chronology: Array<{ page: string; date: string; event: string }>;
  claims: Array<{ page: string; title: string; value?: string; text: string }>;
  theses: Array<{ page: string; strength: "Forte" | "Moderada" | "Fraca"; title: string; summary: string; foundation: string }>;
  evidence: Array<{ page: string; title: string; status: "Presente" | "Mencionado" | "Ausente"; detail: string }>;
  risks: Array<{ page: string; title: string; detail: string }>;
  citations: Array<{ page: string; title: string; text: string; utility: string }>;
  jurisprudence: Array<{ id: string; title: string; court: string; reference: string; excerpt: string; page: string; jusbrasilUrl: string }>;
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

function authHeaders(token: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function cleanJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/i, "");
  const first = withoutFence.indexOf("{");
  const last = withoutFence.lastIndexOf("}");
  if (first < 0 || last < first) throw new Error("A IA não retornou JSON válido.");
  return JSON.parse(withoutFence.slice(first, last + 1)) as Analysis;
}

function searchUrl(court: string, reference: string) {
  return `https://www.jusbrasil.com.br/jurisprudencia/busca?q=${encodeURIComponent([court, reference].filter(Boolean).join(" "))}`;
}

export async function POST(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo PDF." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "O arquivo precisa ser PDF." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "O PDF excede o limite de 20 MB." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const storagePath = `${auth.userId}/${hash}-${safeName}`;

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
    const storageError = await upload.text().catch(() => "");
    return NextResponse.json({ error: "Falha ao guardar o PDF.", detail: storageError.slice(0, 500) }, { status: 502 });
  }

  const prompt = `Você é o motor de estruturação jurídica do AeroLex/AeroVeritas, especializado em Direito Aéreo brasileiro.

Analise integralmente o PDF anexado e devolva APENAS um objeto JSON válido, sem markdown e sem comentários.

REGRAS CRÍTICAS:
1. Identifique autor/cliente e réu/oponente SOMENTE pelo preâmbulo, cabeçalho processual ou campo equivalente. Nunca trate como parte alguém citado em jurisprudência, narrativa, doutrina ou prova.
2. Não invente dados. Quando algo não estiver no documento, use string vazia, null ou array vazio.
3. Preserve nomes e dados como aparecem. Não anonimize.
4. Extraia fatos, cronologia, pedidos, teses, provas, riscos e citações com página.
5. Em jurisprudence inclua APENAS precedentes efetivamente citados no PDF. Ignore CPF, CNPJ, protocolos, valores, datas, voos e o número do processo principal.
6. Para cada jurisprudência, monte jusbrasilUrl como busca do Jusbrasil usando tribunal + referência exata, salvo se o próprio PDF contiver URL direta.
7. pageCount deve refletir o número de páginas do PDF.
8. O title deve ser curto e útil, preferencialmente "Nome do autor x Nome da companhia".
9. category deve descrever o tipo principal, por exemplo "Atraso de voo", "Cancelamento de voo", "Extravio de bagagem", "Overbooking" ou "Direito Aéreo".
10. summary deve ter no máximo 700 caracteres e explicar o núcleo fático do caso.

FORMATO EXATO:
{
  "pageCount": 0,
  "title": "",
  "client": "",
  "opponent": "",
  "caseNumber": "",
  "category": "",
  "summary": "",
  "facts": [{"page":"","title":"","text":""}],
  "chronology": [{"page":"","date":"","event":""}],
  "claims": [{"page":"","title":"","value":"","text":""}],
  "theses": [{"page":"","strength":"Forte","title":"","summary":"","foundation":""}],
  "evidence": [{"page":"","title":"","status":"Presente","detail":""}],
  "risks": [{"page":"","title":"","detail":""}],
  "citations": [{"page":"","title":"","text":"","utility":""}],
  "jurisprudence": [{"id":"","title":"","court":"","reference":"","excerpt":"","page":"","jusbrasilUrl":""}]
}`;

  let analysis: Analysis;
  try {
    const result = await generateText({
      model: "openai/gpt-5.6-sol",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "file", data: bytes, mediaType: "application/pdf", filename: file.name },
        ],
      }],
    });
    analysis = cleanJson(result.text);
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível concluir a análise automática.",
      detail: error instanceof Error ? error.message : "Falha desconhecida",
    }, { status: 502 });
  }

  analysis.jurisprudence = Array.isArray(analysis.jurisprudence)
    ? analysis.jurisprudence.map((j, index) => ({
        id: j.id || `precedente-${index + 1}-${hash.slice(0, 8)}`,
        title: j.title || j.reference || "Precedente citado",
        court: j.court || "",
        reference: j.reference || "",
        excerpt: j.excerpt || "",
        page: j.page || "",
        jusbrasilUrl: j.jusbrasilUrl || searchUrl(j.court || "", j.reference || ""),
      }))
    : [];

  const row = {
    user_id: auth.userId,
    title: analysis.title || [analysis.client, analysis.opponent].filter(Boolean).join(" x ") || file.name,
    client: analysis.client || "",
    opponent: analysis.opponent || "",
    case_number: analysis.caseNumber || "",
    status: "Ativo",
    deadline: null,
    deadline_start: null,
    deadline_days: null,
    deadline_basis: "CPC",
    notes: "Caso estruturado automaticamente a partir do PDF enviado.",
    documents: [storagePath],
    source_document: file.name,
    source_key: hash,
    category: analysis.category || "Direito Aéreo",
    summary: analysis.summary || "",
    facts: analysis.facts || [],
    chronology: analysis.chronology || [],
    claims: analysis.claims || [],
    theses: analysis.theses || [],
    evidence: analysis.evidence || [],
    risks: analysis.risks || [],
    jurisprudence: analysis.jurisprudence || [],
    updated_at: new Date().toISOString(),
  };

  const existingResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/aerolex_cases?select=id&source_key=eq.${hash}&limit=1`,
    { headers: authHeaders(auth.token), cache: "no-store" }
  );
  const existing = (await existingResponse.json().catch(() => [])) as Array<{ id?: string }>;
  const existingId = existing[0]?.id;

  const saveResponse = await fetch(
    existingId
      ? `${SUPABASE_URL}/rest/v1/aerolex_cases?id=eq.${encodeURIComponent(existingId)}`
      : `${SUPABASE_URL}/rest/v1/aerolex_cases`,
    {
      method: existingId ? "PATCH" : "POST",
      headers: { ...authHeaders(auth.token), Prefer: "return=representation" },
      body: JSON.stringify(row),
    }
  );

  const saved = await saveResponse.json().catch(() => ({}));
  if (!saveResponse.ok) {
    return NextResponse.json({ error: "A análise foi concluída, mas o caso não pôde ser salvo.", detail: saved }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    hash,
    fileName: file.name,
    storagePath,
    analysis,
    case: Array.isArray(saved) ? saved[0] : saved,
  });
}
