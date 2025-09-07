import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../_lib";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const upstream = await fetch(`${BASE}/clients/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(req) },
      body: JSON.stringify(payload),
    });

    const body = await readUpstream(upstream);
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
