import { NextRequest } from "next/server";

export const BASE = process.env.API_BASE_URL || process.env.BACKEND_URL || "";

if (!BASE) {
  // No rompas la build, pero deja aviso.
  console.warn("API_BASE_URL/BACKEND_URL no está definido.");
}

export function authHeaders(req: NextRequest): Record<string, string> {
  const h = req.headers;
  const cookieToken = req.cookies.get("token")?.value ?? null;

  const raw =
    h.get("authorization") ??
    h.get("Authorization") ??
    h.get("token") ??
    (cookieToken ? `Bearer ${cookieToken}` : null);

  if (!raw) return {};
  return raw.toLowerCase().startsWith("bearer")
    ? { Authorization: raw }
    : { token: raw };
}

export async function readUpstream(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

/** Normaliza respuestas tipo `[]` o `{ data: [] }` a `[]` */
export function pickArrayBody(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as { data?: unknown[] }).data)
  ) {
    return (body as { data: unknown[] }).data;
  }
  return [];
}
