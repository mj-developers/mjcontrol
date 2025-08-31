// src/app/logout/page.tsx
"use client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    try {
      const KEYS = [
        "mj:user", // storage del login
        "mj_user", // cookie espejo
        "mj_username",
        "mj_login",
        "username",
        "login",
        "user",
        "userLogin",
      ];
      KEYS.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
        try {
          sessionStorage.removeItem(k);
        } catch {}
      });
      // expira cookie
      document.cookie = "mj_user=; Max-Age=0; path=/; samesite=lax";
    } catch {}

    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.assign("/login");
    });
  }, []);

  return <p style={{ padding: 24 }}>Cerrando sesión…</p>;
}
