import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "MJ Control CRM",
  description: "CRM interno de MJ Devs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${poppins.variable}`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
