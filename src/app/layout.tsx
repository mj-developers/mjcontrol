// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
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
        {/* No-flash: fija tema antes de hidratar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  try {
    var k = 'mj_theme';
    var t;
    var s = localStorage.getItem(k);
    if (s === 'light' || s === 'dark') {
      t = s;
    } else {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    var html = document.documentElement;
    html.setAttribute('data-theme', t);
    html.classList.toggle('dark', t === 'dark');
    window.__MJ_THEME__ = t;
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
