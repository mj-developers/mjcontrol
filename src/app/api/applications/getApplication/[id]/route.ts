import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "../../_lib";

type Ctx = { params?: { id?: string } };

export async function GET(req: NextRequest, ctx: unknown) {
  const { params } = (ctx as Ctx) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return proxyJson(req, `/applications/getApplication/${encodeURIComponent(id)}`);
}
