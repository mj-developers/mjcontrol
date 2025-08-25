import { NextRequest } from "next/server";
import { proxyJson } from "../_lib";

export async function POST(req: NextRequest) {
  const body = await req.text();
  // Tu backend espera '/users/create?' tal cual
  return proxyJson(req, "/users/create?", { method: "POST", body });
}
