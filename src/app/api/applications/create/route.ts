// src/app/api/applications/create/route.ts
import { NextRequest } from "next/server";
import { proxyJson } from "../_lib";

/**
 * Espera body con:
 * { Code: string; Name: string }
 */
export async function POST(req: NextRequest) {
  return proxyJson(req, "/applications/create", { method: "POST" });
}
