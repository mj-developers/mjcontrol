// src/app/api/applications/getApplication/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { proxyJson } from "../../_lib";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = encodeURIComponent(params.id);
  return proxyJson(req, `/applications/getApplication/${id}`);
}
