// src/app/api/applications/update/[id]/route.ts
import { NextRequest } from "next/server";
import { proxyJson } from "../../_lib";

/**
 * PUT body admite:
 * { code?: string; name?: string; status_id?: number; min_version?: string; license_duration_days?: number }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = encodeURIComponent(params.id);
  return proxyJson(req, `/applications/update/${id}`, { method: "PUT" });
}
