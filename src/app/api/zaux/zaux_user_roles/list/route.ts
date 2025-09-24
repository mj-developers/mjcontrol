// src/app/api/zaux/zaux_user_roles/list/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? process.env.BACKEND_URL ?? "";

type JsonObject = Record<string, unknown>;
type ZAuxRolesResponse = { data?: unknown } & JsonObject;

function isObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null;
}

function normalizeToArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input as unknown[];
  if (isObject(input)) {
    const d = (input as ZAuxRolesResponse).data;
    if (Array.isArray(d)) return d as unknown[];
  }
  return [];
}

// Lista de roles desde la ZAux API (normaliza siempre a { data: [...] })
export async function GET(req: NextRequest) {
  if (!BASE) {
    return NextResponse.json(
      { error: "BACKEND_URL / API_BASE_URL no configurado" },
      { status: 500 }
    );
  }

  // El backend espera /zaux/zaux_user_roles? con (q, offset, limit, orderBy, asc)
  const incoming = new URL(req.url);
  const qs = incoming.searchParams.toString();
  const upstreamUrl = `${BASE}/zaux/zaux_user_roles${qs ? `?${qs}` : ""}`;

  const res = await fetch(upstreamUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  let parsed: unknown = null;
  try {
    const text = await res.text();
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  const data = normalizeToArray(parsed);
  return NextResponse.json({ data }, { status: res.status });
}
