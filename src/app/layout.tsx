import "./globals.css";
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solo-Flow",
  description: "Motor de reservas para profissionais independentes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
