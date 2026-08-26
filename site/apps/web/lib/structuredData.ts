import { GITHUB_URL } from "@/content/navigation";
import { SITE_URL } from "@/app/sitemap";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cevolta",
    url: SITE_URL,
    description:
      "Non-custodial recurring-payments protocol being designed for Stellar. A Payer's own Smart Wallet authorizes each charge, not the Payee or the protocol.",
    sameAs: [GITHUB_URL],
    address: {
      "@type": "PostalAddress",
      addressCountry: "CL",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/contact`,
    },
  };
}
