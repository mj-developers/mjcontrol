// src/app/api/users/update/[id]/route.ts
import { NextResponse } from "next/server";
import { logIncomingRequest, fetchLogged } from "@/lib/httpDebug";

type Params = { id: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const toNum = (v: unknown) => {
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : undefined;
};
const toStr = (v: unknown) =>
  typeof v === "string" ? v : String(v ?? "").trim();

function pickStatus1or2(raw: Record<string, unknown>): 1 | 2 | undefined {
  const n = toNum(raw.status);
  if (n === 1 || n === 2) return n as 1 | 2;
  if (typeof raw.status === "boolean") return raw.status ? 1 : 2;

  const s = String(raw.status ?? "")
    .toLowerCase()
    .trim();
  if (["1", "true", "active", "activo"].includes(s)) return 1;
  if (
    ["2", "false", "inactive", "inactivo", "suspendido", "suspended"].includes(
      s
    )
  )
    return 2;

  return undefined;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  await logIncomingRequest(req, "IN UPDATE /users");

  const { id } = await params;
  const idNum = toNum(id);
  if (!idNum) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const base = process.env.API_BASE_URL ?? process.env.BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "API_BASE_URL no está definida" },
      { status: 500 }
    );
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Acepta role_id, roleId o role:{id}
  const roleFromObjId = isObj(raw.role)
    ? toNum((raw.role as Record<string, unknown>).id)
    : undefined;
  const roleId = toNum(raw.role_id ?? raw.roleId ?? roleFromObjId);

  const uiStatus = pickStatus1or2(raw);

  const norm: Record<string, unknown> = {
    id: idNum,
    login: toStr(raw.login ?? ""),
    email: toStr(raw.email ?? ""),
    firstName: toStr(raw.firstName ?? ""),
    lastName: toStr(raw.lastName ?? ""),
  };

  if (uiStatus !== undefined) norm.status = uiStatus;

  if (typeof raw.password === "string" && raw.password.trim()) {
    norm.password = raw.password;
  }

  // 👇 Enviar SIEMPRE ambos para contentar al backend/ORM
  if (typeof roleId === "number") {
    norm.role_id = roleId;
    norm.role = { id: roleId }; // <- esto faltaba y es lo que rompe la FK si el ORM lo necesita
  }

  if (process.env.DEBUG_HTTP === "1") {
    console.log("[users/update] OUT =>", JSON.stringify(norm));
  }

  const url = `${base}/users/update/${encodeURIComponent(String(idNum))}`;
  const upstream = await fetchLogged(
    url,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(norm),
    },
    "UPSTREAM /users/update"
  );

  const text = await upstream.text().catch(() => "");
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!upstream.ok) {
    return NextResponse.json(
      (json as Record<string, unknown>) ?? {
        error: upstream.statusText || "Error actualizando usuario",
      },
      { status: upstream.status }
    );
  }

  return NextResponse.json(json ?? { ok: true });
}
