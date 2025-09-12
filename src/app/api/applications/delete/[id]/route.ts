import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "../../_lib";

type Ctx = { params?: { id?: string } };

export async function DELETE(req: NextRequest, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // proxy con método DELETE y manejo de 204 dentro de proxyJson
  return proxyJson(req, `/applications/delete/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
