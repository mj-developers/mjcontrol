import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const upstream = await fetch(
      `${BASE}/clients/getClient/${encodeURIComponent(params.id)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeaders(req) },
        cache: "no-store",
      }
    );

    const body = await readUpstream(upstream);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream", body },
        { status: upstream.status }
      );
    }
    return NextResponse.json(body, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
