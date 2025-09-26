// src/app/api/clients/update/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { BASE, authHeaders } from "../../_lib";

type Params = { id: string };

type Incoming = Record<string, unknown> & {
  Status?: unknown;
  status?: unknown;
};

const toNum = (v: unknown): number | undefined => {
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : undefined;
};

const toStr = (v: unknown): string =>
  typeof v === "string" ? v : String(v ?? "").trim();

function headersFrom(req: Request): HeadersInit {
  try {
    return {
      "Content-Type": "application/json",
      ...authHeaders(req as unknown as NextRequest),
    };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

/** Extrae 1 | 2 desde Status/ status en distintos formatos sin usar `any`. */
function pickStatusId(raw: Incoming): 1 | 2 | undefined {
  const tryFrom = (v: unknown): number | undefined => {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string") return toNum(v);
    if (typeof v === "boolean") return v ? 1 : 2;
    if (typeof v === "object" && v !== null) {
      const r = v as Record<string, unknown>;
      if ("id" in r) return toNum(r.id);
    }
    return undefined;
  };

  const id =
    tryFrom(raw.Status) ??
    tryFrom(raw.status) ??
    (typeof raw.Status === "object" &&
    raw.Status !== null &&
    "id" in (raw.Status as Record<string, unknown>)
      ? toNum((raw.Status as Record<string, unknown>).id)
      : undefined);

  return id === 1 || id === 2 ? (id as 1 | 2) : undefined;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params; // Next 15: params es promesa
  const idNum = toNum(id);
  if (!idNum) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const raw = (await req.json().catch(() => ({}))) as Incoming;

    // DTO PLANO en raíz (sin `clientToUpdate`)
    const dto: Record<string, unknown> = {
      Id: idNum,
      Login: toStr(
        (raw as Record<string, unknown>).Login ??
          (raw as Record<string, unknown>).login
      ),
      Tax_id: toStr(
        (raw as Record<string, unknown>).Tax_id ??
          (raw as Record<string, unknown>).tax_id ??
          (raw as Record<string, unknown>).taxId
      ),
      Trade_Name: toStr(
        (raw as Record<string, unknown>).Trade_Name ??
          (raw as Record<string, unknown>).trade_Name ??
          (raw as Record<string, unknown>).tradeName
      ),
    };

    const putIf = (key: string, ...alts: unknown[]) => {
      const v = alts.find((x) => x !== undefined && String(x).trim() !== "");
      if (v !== undefined && String(v).trim() !== "") dto[key] = toStr(v);
    };

    putIf(
      "Legal_Name",
      (raw as Record<string, unknown>).Legal_Name,
      (raw as Record<string, unknown>).legal_Name,
      (raw as Record<string, unknown>).legalName
    );
    putIf(
      "Email",
      (raw as Record<string, unknown>).Email,
      (raw as Record<string, unknown>).email
    );
    putIf(
      "Phone",
      (raw as Record<string, unknown>).Phone,
      (raw as Record<string, unknown>).phone
    );
    putIf(
      "Mobile",
      (raw as Record<string, unknown>).Mobile,
      (raw as Record<string, unknown>).mobile
    );
    putIf(
      "Website",
      (raw as Record<string, unknown>).Website,
      (raw as Record<string, unknown>).website
    );

    const statusId = pickStatusId(raw);
    if (statusId !== undefined) dto.Status = { id: statusId };

    const upstream = await fetch(
      `${BASE}/clients/update/${encodeURIComponent(String(idNum))}`,
      {
        method: "PUT",
        headers: headersFrom(req),
        body: JSON.stringify(dto),
      }
    );

    // Puede venir text/plain
    const ct = upstream.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text, {
        status: upstream.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json ?? null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
