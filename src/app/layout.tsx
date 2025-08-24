import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        {/* No-flash: fija tema y variables ANTES de hidratar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var t='dark';
  try {
    var s = localStorage.getItem('mj_theme');
    if (s === 'light' || s === 'dark') t = s;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) t = 'light';
  } catch(e) {}

  // Exponer al cliente
  window.__MJ_THEME__ = t;

  // Marcar HTML con el tema
  var html = document.documentElement;
  html.setAttribute('data-theme', t);
  if (t === 'dark') html.classList.add('dark'); else html.classList.remove('dark');

  // Variables CSS usadas por el body
  var bg = t === 'light' ? '#ffffff' : '#0B0B0D';
  var fg = t === 'light' ? '#0a0a0a' : '#ffffff';
  html.style.setProperty('--bg', bg);
  html.style.setProperty('--fg', fg);
})();
            `,
          }}
        />
      </head>
      <body
        style={{ background: "var(--bg)", color: "var(--fg)" }}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
