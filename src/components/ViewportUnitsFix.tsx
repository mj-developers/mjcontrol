// src/components/ViewportUnitsFix.tsx
"use client";

import useViewportUnitsFix from "@/hooks/useViewportUnitsFix";

/**
 * Monta el fix de unidades de viewport (100dvh fallback).
 * No renderiza nada.
 */
export default function ViewportUnitsFix() {
  useViewportUnitsFix();
  return null;
}
