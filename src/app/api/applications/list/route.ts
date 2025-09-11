// src/app/api/applications/list/route.ts
import { NextRequest } from "next/server";
import { proxyJson } from "../_lib";

export async function GET(req: NextRequest) {
  return proxyJson(req, "/applications/list");
}
