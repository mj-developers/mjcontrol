// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Introduce usuario y contraseña." },
        { status: 400 }
      );
    }

    const apiBase = process.env.API_BASE_URL;
    if (!apiBase) {
      return NextResponse.json(
        { error: "API_BASE_URL no está configurada." },
        { status: 500 }
      );
    }

    // Llamada a tu API real
    const upstream = await fetch(`${apiBase}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.error || "Usuario o contraseña incorrectos." },
        { status: upstream.status }
      );
    }

    // Esperamos { id, login }
    if (!data?.id || !data?.login) {
      return NextResponse.json(
        { error: "Respuesta inesperada del servidor." },
        { status: 502 }
      );
    }

    const payload = { id: String(data.id), login: String(data.login) };

    const res = NextResponse.json({ ok: true, user: payload });

    // ⬇️ Cookie de sesión que leerá el middleware
    res.cookies.set({
      name: "mj_auth",
      value: JSON.stringify(payload),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Revisa tu conexión." },
      { status: 500 }
    );
  }
}
