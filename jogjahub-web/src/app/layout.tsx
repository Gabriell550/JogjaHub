import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/src/hooks/useAuth";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "JogjaHub",
  description: "Temukan layanan wisuda, penginapan, dan gifting lokal di Yogyakarta.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className={`${lexend.variable} ${inter.variable} bg-[#F8F9FF] text-[#121C2A] antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
