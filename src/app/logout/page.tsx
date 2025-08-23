"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    document.cookie = "mj_auth=; Max-Age=0; Path=/; SameSite=Lax";
    try {
      localStorage.removeItem("mj_user");
    } catch {}
    router.replace("/login");
  }, [router]);

  return <p className="p-6 text-sm text-zinc-300">Cerrando sesión…</p>;
}
