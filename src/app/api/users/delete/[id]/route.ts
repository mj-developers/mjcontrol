import { NextRequest } from "next/server";
import { proxyJson } from "../../_lib";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyJson(req, `/users/delete/${encodeURIComponent(params.id)}`, {
    method: "DELETE",
  });
}
