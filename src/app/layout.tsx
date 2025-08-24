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
        {/* Evita FART: decide tema y pinta variables ANTES de hidratar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var t='dark';
  try{
    var s=localStorage.getItem('mj_theme');
    if(s==='light'||s==='dark'){ t=s; }
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches){ t='light'; }
  }catch(e){}
  // expón el tema para el primer render del cliente
  window.__MJ_THEME__ = t;
  var bg = t==='light' ? '#ffffff' : '#0B0B0D';
  var fg = t==='light' ? '#0a0a0a' : '#ffffff';
  var st = document.createElement('style');
  st.textContent = ':root{--bg:'+bg+';--fg:'+fg+'}';
  document.head.appendChild(st);
})();`,
          }}
        />
      </head>
      <body
        /* usa las variables, ya correctas desde el primer paint */
        style={{ background: "var(--bg)", color: "var(--fg)" }}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
