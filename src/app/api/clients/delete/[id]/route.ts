import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream } from "../../_lib";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const upstream = await fetch(
      `${BASE}/clients/delete/${encodeURIComponent(params.id)}`,
      {
        method: "DELETE",
        headers: { ...authHeaders(req) },
      }
    );

    // algunos backends devuelven 204 sin cuerpo; otros JSON
    const body = await readUpstream(upstream);
    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
