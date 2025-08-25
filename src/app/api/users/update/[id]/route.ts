import { NextRequest } from "next/server";
import { proxyJson } from "../../_lib";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.text();
  return proxyJson(req, `/users/update/${encodeURIComponent(params.id)}`, {
    method: "PUT",
    body,
  });
}
