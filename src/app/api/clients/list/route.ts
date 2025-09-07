import { NextRequest, NextResponse } from "next/server";
import { BASE, authHeaders, readUpstream, pickArrayBody } from "../_lib";

export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(`${BASE}/clients/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(req),
      },
      cache: "no-store",
    });

    const body = await readUpstream(upstream);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream", body },
        { status: upstream.status }
      );
    }

    const list = pickArrayBody(body);
    return NextResponse.json(list, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected failure" }, { status: 500 });
  }
}
