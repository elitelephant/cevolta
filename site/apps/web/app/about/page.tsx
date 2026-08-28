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
        designed for Stellar. It&apos;s a solo project, built in Chile.
      </p>

      <h2>The idea</h2>
      <p>
        Most recurring payments today &mdash; subscriptions, rent, sending
        money home &mdash; run on trust. A business asks for standing
        authorization over a card or account and hopes it&apos;s never
        misused. Cevolta puts that authorization inside your own wallet
        instead.
      </p>
      <p>
        You set an amount, a recipient, and a schedule, once, and your
        wallet authorizes only charges matching those &mdash; nothing
        else, even if the business on the other end is compromised.
        Cancelling is always your call, and it&apos;s immediate. That&apos;s
        the same promise as the homepage; for the exact mechanism and the
        terms behind it, see{" "}
        <a href={`${GITHUB_URL}/blob/main/CONTEXT.md`} target="_blank" rel="noopener">
          CONTEXT.md
        </a>{" "}
        in the GitHub repo.
      </p>

      <h2>Current stage</h2>
      <p>
        Cevolta is pre-Testnet. Only this landing page and its waitlist
        exist today &mdash; the smart contracts that actually move money
        haven&apos;t been written yet. This site exists to collect a
        waitlist ahead of the first Testnet release.
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
