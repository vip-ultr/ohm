import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Ohm — Detect. Analyze. Act.",
  description:
    "Solana token analytics platform. Real-time data for Bags.fm tokens — price, holders, whale transactions, social mentions.",
  keywords: ["Solana", "crypto", "analytics", "Bags.fm", "token", "DeFi"],
  openGraph: {
    title: "Ohm Markets",
    description: "Detect. Analyze. Act. — Solana token analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="page-wrap">
            <Navbar />
            <main className="main-content">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
