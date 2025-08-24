import { NextResponse } from "next/server";

type UpstreamLoginResponse = {
  ok: boolean;
  user?: string;
  token?: string;
  error?: string;
};

export async function POST(req: Request) {
  const { login, password } = await req.json();

  if (!login || !password) {
    return NextResponse.json(
      { ok: false, error: "Faltan credenciales" },
      { status: 400 }
    );
  }

  const base = process.env.UPSTREAM_API_BASE;
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "Falta UPSTREAM_API_BASE" },
      { status: 500 }
    );
  }

  // Llamada a tu API
  const upstreamRes = await fetch(`${base}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
    // importante para no cachear logins
    cache: "no-store",
  });

  const data = (await upstreamRes.json()) as UpstreamLoginResponse;

  if (!upstreamRes.ok || !data.ok || !data.token) {
    const msg = data?.error ?? "Usuario o contraseña incorrectos";
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }

  // Seteamos cookie HttpOnly con el token
  const res = NextResponse.json({ ok: true, user: data.user ?? login });
  res.cookies.set("mj_token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true, // en https
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return res;
}
