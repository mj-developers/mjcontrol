// src/app/api/clients/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders } from "../_lib";

/* ---------- tipos pequeños ---------- */
type Status12 = 1 | 2;
type Raw = Record<string, unknown>;
type FlatClient = {
  Login: string;
  Tax_id: string;
  Trade_Name: string;
  Legal_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Website?: string;
  Status?: { id: Status12 };
};

/* ---------- helpers ---------- */
const toStr = (v: unknown): string =>
  typeof v === "string" ? v : String(v ?? "").trim();

function readStatusId(raw: Raw): Status12 | undefined {
  const v = (raw as Raw).Status ?? (raw as Raw).status;
  if (typeof v === "number" && (v === 1 || v === 2)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (n === 1 || n === 2) return n as Status12;
  }
  if (typeof v === "boolean") return v ? 1 : 2;
  if (typeof v === "object" && v) {
    const id = (v as { id?: unknown }).id;
    if (typeof id === "number" && (id === 1 || id === 2)) return id;
    if (typeof id === "string") {
      const n = Number(id);
      if (n === 1 || n === 2) return n as Status12;
    }
  }
  return undefined;
}

/* ---------- handler ---------- */
export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => ({}))) as Raw;

    // Admitimos que el front envíe en camel/snake/Pascal o dentro de clientToCreate
    const inner =
      (raw.clientToCreate as Raw | undefined) &&
      typeof raw.clientToCreate === "object"
        ? (raw.clientToCreate as Raw)
        : raw;

    // Montamos objeto PLANO como lo define el swagger del upstream
    const flat: FlatClient = {
      Login: toStr(inner.Login ?? inner.login),
      Tax_id: toStr(inner.Tax_id ?? inner.tax_id ?? inner.taxId),
      Trade_Name: toStr(
        inner.Trade_Name ?? inner.trade_Name ?? inner.tradeName
      ),
      Legal_Name: toStr(
        inner.Legal_Name ?? inner.legal_Name ?? inner.legalName
      ),
      Email: toStr(inner.Email ?? inner.email),
      Phone: toStr(inner.Phone ?? inner.phone),
      Mobile: toStr(inner.Mobile ?? inner.mobile),
      Website: toStr(inner.Website ?? inner.website),
    };

    // Limpieza de vacíos
    (Object.keys(flat) as (keyof FlatClient)[]).forEach((k) => {
      const v = flat[k];
      if (v === "" || v === undefined) delete flat[k];
    });

    // Validación local (mismo mensaje pero en español si falla aquí)
    if (!flat.Login || !flat.Tax_id || !flat.Trade_Name) {
      return NextResponse.json(
        { error: "Login, Tax_id y Trade_Name son obligatorios." },
        { status: 400 }
      );
    }

    // Status (objeto { id })
    const st = readStatusId(raw) ?? readStatusId(inner);
    if (st !== undefined) flat.Status = { id: st };

    // Llamada al upstream con objeto PLANO (sin wrapper clientToCreate)
    const upstream = await fetch(`${BASE}/clients/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(req) },
      body: JSON.stringify(flat),
      cache: "no-store",
    });

    // Respuesta del upstream (puede ser text/plain)
    const ct = upstream.headers.get("content-type") || "";
    const body = ct.includes("application/json")
      ? await upstream.json().catch(() => ({}))
      : await upstream.text().catch(() => "");

    return NextResponse.json(body ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
