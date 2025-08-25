// src/app/logout/page.tsx
"use client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.assign("/login");
    });
  }, []);

  return <p style={{ padding: 24 }}>Cerrando sesión…</p>;
}
