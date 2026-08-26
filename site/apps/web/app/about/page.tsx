import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";
import { GITHUB_URL } from "@/content/navigation";

export const metadata: Metadata = {
  title: "About - Cevolta",
  description:
    "Cevolta is a non-custodial recurring-payments protocol being designed for Stellar. A solo, pre-Testnet project, built in Chile.",
  alternates: {
    canonical: "/about",
    types: { "text/markdown": "/about.md" },
  },
};

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About" title="About Cevolta">
      <p>
        Cevolta is a non-custodial recurring-payments protocol being
        designed for Stellar, using Soroban smart contracts. It&apos;s a
        solo project, built in Chile.
      </p>

      <h2>The idea</h2>
      <p>
        Most recurring payments today &mdash; subscriptions, rent, sending
        money home &mdash; run on trust. A business asks for standing
        authorization over a card or account and hopes it&apos;s never
        misused. Cevolta puts that authorization inside the payer&apos;s
        own wallet instead.
      </p>
      <p>
        A Payer enrolls in a Payee&apos;s Plan, and their wallet&apos;s
        Policy Signer authorizes only charges matching that Plan&apos;s
        amount, recipient, and cadence &mdash; nothing else, even if the
        Payee or the protocol itself is compromised. Cancelling is always
        the Payer&apos;s call, and it&apos;s immediate. See{" "}
        <a href={`${GITHUB_URL}/blob/main/CONTEXT.md`} target="_blank" rel="noopener">
          CONTEXT.md
        </a>{" "}
        in the GitHub repo for the full terminology and mechanism.
      </p>

      <h2>Current stage</h2>
      <p>
        Cevolta is pre-Testnet. Only this landing page and its waitlist
        exist today &mdash; the Soroban contracts (Payment Registry, Smart
        Wallet integration) haven&apos;t been written yet. This site
        exists to collect a waitlist ahead of the first Testnet release.
      </p>

      <h2>Open source</h2>
      <p>
        The repository, terminology reference, and design decisions are
        public on{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener">
          GitHub
        </a>
        .
      </p>
    </ContentPage>
  );
}
