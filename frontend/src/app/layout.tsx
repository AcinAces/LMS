import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollbarHider from "@/components/ScrollbarHider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acin's LMS",
  description: "Master your coding skills with interactive lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-white">
        <ScrollbarHider />
        <Navbar />
        <main className="flex-grow pt-16 animate-fade-in-up">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
