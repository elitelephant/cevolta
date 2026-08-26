import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import { buildOrganizationJsonLd } from "@/lib/structuredData";
import { SITE_URL } from "@/app/sitemap";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cevolta: Recurring payments that live in your wallet",
  description:
    "Set an amount, a recipient, and a schedule in your own wallet. Cevolta: non-custodial recurring payments on Stellar.",
  alternates: {
    canonical: "/",
    types: { "text/markdown": "/index.md" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Cevolta",
    title: "Cevolta: Recurring payments that live in your wallet",
    description:
      "Set an amount, a recipient, and a schedule in your own wallet. Cevolta: non-custodial recurring payments on Stellar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
