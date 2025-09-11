// src/app/api/applications/_lib.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_URL ?? "";

export async function proxyJson(
  req: NextRequest,
  path: string,
  init?: RequestInit
) {
  if (!BASE) {
    return NextResponse.json(
      { error: "BACKEND_URL no configurado" },
      { status: 500 }
    );
  }

  // Concatena la ruta del backend + path y arrastra query params si vienen
  const search = req.nextUrl.search || "";
  const url = `${BASE}${path}${search}`;

  // Cabeceras a reenviar
  const fwdHeaders = new Headers(init?.headers);

  // Si mandamos body pero no hay Content-Type, usa el del request o JSON
  if (init?.body && !fwdHeaders.has("Content-Type")) {
    const ct = req.headers.get("content-type") || "application/json";
    fwdHeaders.set("Content-Type", ct);
  }

  // Reenvía cookies de sesión si tu backend las usa
  const cookie = req.headers.get("cookie");
  if (cookie) fwdHeaders.set("cookie", cookie);

  // Reenvía credenciales habituales si existen
  const auth = req.headers.get("authorization");
  if (auth && !fwdHeaders.has("authorization")) {
    fwdHeaders.set("authorization", auth);
  }
  const xApiKey = req.headers.get("x-api-key");
  if (xApiKey && !fwdHeaders.has("x-api-key")) {
    fwdHeaders.set("x-api-key", xApiKey);
  }
  const key = req.headers.get("key");
  if (key && !fwdHeaders.has("key")) {
    fwdHeaders.set("key", key);
  }

  const res = await fetch(url, {
    method: init?.method ?? req.method ?? "GET",
    headers: fwdHeaders,
    body: init?.body,
    cache: "no-store",
  });

  // Devuelve siempre JSON (aunque venga texto)
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  return NextResponse.json(body, { status: res.status });
}
