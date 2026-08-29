import type { Metadata } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollbarHider from "@/components/ScrollbarHider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import { getDictionary, Locale } from "@/i18n/dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Acin's LMS",
  description: "Master your coding skills with interactive lessons.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "bn";
  const dict = await getDictionary(locale);

  const activeFont = locale === 'bn' ? hindSiliguri.variable : geistSans.variable;

  return (
    <html 
      lang={locale} 
      data-scroll-behavior="smooth" 
      style={{ "--font-sans": `var(${activeFont})` } as React.CSSProperties}
      className={`${hindSiliguri.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-white">
        <LanguageProvider locale={locale} dict={dict}>
          <ToastProvider>
            <ScrollbarHider />
            <Navbar />
            <main className="flex-grow pt-16 animate-fade-in-up">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


