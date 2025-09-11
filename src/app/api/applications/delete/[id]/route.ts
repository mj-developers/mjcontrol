// src/app/api/applications/delete/[id]/route.ts
import { NextRequest } from "next/server";
import { proxyJson } from "../../_lib";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = encodeURIComponent(params.id);
  return proxyJson(req, `/applications/delete/${id}`, { method: "DELETE" });
}
