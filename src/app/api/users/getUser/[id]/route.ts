import { NextRequest } from "next/server";
import { proxyJson } from "../../_lib";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyJson(req, `/users/getUser/${encodeURIComponent(params.id)}`);
}
