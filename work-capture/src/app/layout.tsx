import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevModeBanner } from "@/components/dev-mode-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work Capture",
  description: "思考を止めずに、仕事を前へ進める。",
};

export const viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DevModeBanner />
        {children}
      </body>
    </html>
  );
}
