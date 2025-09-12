// src/app/api/applications/delete/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } } // <- el 2º argumento debe ser { params }
) {
  const { id } = params;

  try {
    // Llama a tu backend/DB aquí si corresponde:
    // const apiRes = await fetch(`${process.env.API_URL}/applications/${encodeURIComponent(id)}`, { method: "DELETE" });

    // Si tu backend devuelve 204 (sin contenido), devuélvelo tal cual:
    // if (apiRes.status === 204) return new Response(null, { status: 204 });

    // Si quieres responder JSON:
    // return NextResponse.json({ ok: true });

    // Placeholder seguro si haces el borrado dentro de este handler:
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: "Error eliminando aplicación", details: (err as Error).message },
      { status: 500 }
    );
  }
}
