import type { Metadata } from "next";
import { Nunito, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { strings } from "@/lib/strings";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: strings.siteTitle,
  description: strings.siteSubtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunito.variable} ${notoJp.variable} h-full`}>
      <body className="min-h-full bg-gradient-to-b from-pink-50 via-white to-sky-50 font-sans text-slate-900 antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
