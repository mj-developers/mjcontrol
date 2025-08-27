// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente para headings (REVER-style): pesos altos y variable CSS --font-heading
const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MJ Control",
  description: "Panel de control de MJ Devs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* No-flash: fija data-theme y vars antes de hidratar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var t = 'dark';
  try {
    var s = localStorage.getItem('mj_theme');
    if (s === 'light' || s === 'dark') t = s;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) t = 'light';
  } catch {}
  var html = document.documentElement;
  html.setAttribute('data-theme', t);
  if (t === 'dark') html.classList.add('dark'); else html.classList.remove('dark');
  // base por si algo externo mira --bg/--fg
  html.style.setProperty('--bg', t === 'light' ? '#ffffff' : '#0B0B0D');
  html.style.setProperty('--fg', t === 'light' ? '#0a0a0a' : '#ffffff');
  window.__MJ_THEME__ = t;
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        {children}
      </body>
    </html>
  );
}
