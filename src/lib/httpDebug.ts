// src/lib/httpDebug.ts
const REDACT = new Set(["authorization", "cookie", "set-cookie"]);

export const isDebugHttp =
  process.env.NODE_ENV !== "production" &&
  (process.env.DEBUG_HTTP === "1" ||
    process.env.NEXT_PUBLIC_DEBUG_HTTP === "1");

/* ------------------------- helpers de tipado ------------------------- */

type HeadersRecord = Record<string, string>;
type HeadersArray = Array<[string, string]>;
type HeadersLike = Headers | HeadersRecord | HeadersArray;

function toHeadersObject(input?: HeadersInit | HeadersLike): HeadersRecord {
  const out: HeadersRecord = {};
  if (!input) return out;

  // Headers nativo
  if (input instanceof Headers) {
    for (const [k, v] of input.entries()) {
      out[k] = v;
    }
    return out;
  }

  // Array de tuplas [k,v]
  if (Array.isArray(input)) {
    for (const [k, v] of input) {
      out[String(k)] = String(v);
    }
    return out;
  }

  // Record<string,string>
  const rec = input as HeadersRecord;
  for (const [k, v] of Object.entries(rec)) {
    out[String(k)] = String(v);
  }
  return out;
}

function getContentTypeFromHeaders(
  input?: HeadersInit | HeadersLike
): string | null {
  if (!input) return null;
  const obj = toHeadersObject(input);
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase() === "content-type") return v;
  }
  return null;
}

function redactHeaders(input?: HeadersInit | HeadersLike): HeadersRecord {
  const obj = toHeadersObject(input);
  const out: HeadersRecord = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACT.has(k.toLowerCase()) ? "«redacted»" : v;
  }
  return out;
}

function isReadableStreamLike(x: unknown): x is { getReader: () => unknown } {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { getReader?: unknown }).getReader === "function"
  );
}

async function readBodyForLog(
  contentType: string | null | undefined,
  getText: () => Promise<string>
): Promise<string | null> {
  if (!contentType) return null;
  const ct = contentType.toLowerCase();
  const isText =
    ct.includes("application/json") ||
    ct.includes("text/") ||
    ct.includes("application/x-www-form-urlencoded");
  if (!isText) return `«${ct} no-textual»`;
  try {
    const t = await getText();
    return t.length > 10_000 ? t.slice(0, 10_000) + "…(truncado)" : t;
  } catch {
    return "«no se pudo leer el body»";
  }
}

/* --------------------- SERVIDOR (Route Handlers) --------------------- */

export async function logIncomingRequest(
  req: Request,
  label = "IN"
): Promise<void> {
  if (!isDebugHttp) return;
  const url = req.url;
  const method = req.method;
  const headers = redactHeaders(req.headers);
  const body = await readBodyForLog(req.headers.get("content-type"), () =>
    req.clone().text()
  );
  console.log(
    `[http] ${label} ${method} ${url}\n  headers:`,
    headers,
    `\n  body:`,
    body
  );
}

export async function logOutgoingFetch(
  url: string,
  init?: RequestInit,
  label = "OUT"
): Promise<void> {
  if (!isDebugHttp) return;
  const method = (init?.method || "GET").toUpperCase();
  const headersRedacted = redactHeaders(init?.headers);
  const ct = getContentTypeFromHeaders(init?.headers);

  let bodyDesc: string | null = null;

  // Intento no destructivo: si el body es string lo mostramos; si es stream, lo marcamos; si es objeto simple, lo serializamos.
  const body: unknown = init?.body ?? null;
  if (typeof body === "string") {
    bodyDesc = await readBodyForLog(ct, async () => body);
  } else if (isReadableStreamLike(body)) {
    bodyDesc = "«stream»";
  } else if (body instanceof URLSearchParams) {
    bodyDesc = await readBodyForLog(
      ct ?? "application/x-www-form-urlencoded",
      async () => body.toString()
    );
  } else if (body instanceof Blob) {
    bodyDesc = `«Blob (${body.type || "application/octet-stream"})»`;
  } else if (body && typeof body === "object") {
    bodyDesc = await readBodyForLog(ct ?? "application/json", async () =>
      JSON.stringify(body)
    );
  } else {
    bodyDesc = null;
  }

  console.log(
    `[http] ${label} ${method} ${url}\n  headers:`,
    headersRedacted,
    `\n  body:`,
    bodyDesc
  );
}

export async function logResponse(res: Response, label = "RES"): Promise<void> {
  if (!isDebugHttp) return;
  const status = res.status;
  const headers = redactHeaders(res.headers);
  const body = await readBodyForLog(res.headers.get("content-type"), () =>
    res.clone().text()
  );
  console.log(
    `[http] ${label} ${status}\n  headers:`,
    headers,
    `\n  body:`,
    body
  );
}

// Helper de fetch con logging en SERVER
export async function fetchLogged(
  url: string,
  init?: RequestInit,
  labelBase = "UPSTREAM"
): Promise<Response> {
  await logOutgoingFetch(url, init, `${labelBase} OUT`);
  const res = await fetch(url, init);
  await logResponse(res, `${labelBase} RES`);
  return res;
}

/* --------------------- CLIENTE (opcional) --------------------- */

interface WindowWithFlag extends Window {
  __fetchLogged?: boolean;
}

// Llama a esta función una sola vez (por ejemplo en un layout client)
export function installClientFetchLogger(): void {
  if (!isDebugHttp) return;
  if (typeof window === "undefined") return;
  const w = window as WindowWithFlag;
  if (w.__fetchLogged) return; // evitar duplicar

  const orig = w.fetch.bind(w);

  w.__fetchLogged = true;
  w.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url ?? String(input);

    await logOutgoingFetch(url, init, "CLIENT OUT");
    const res = await orig(input as RequestInfo, init);
    await logResponse(res, "CLIENT RES");
    return res;
  };
}
