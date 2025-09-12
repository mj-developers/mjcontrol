// src/app/api/applications/update/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "../../_lib";

type Ctx = { params?: { id?: string } };

/**
 * PUT body admite:
 * { code?: string; name?: string; status_id?: number; min_version?: string; license_duration_days?: number }
 */
export async function PUT(req: NextRequest, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Reenviamos el body tal cual al backend
  const body = await req.text();

  return proxyJson(req, `/applications/update/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
  });
}
