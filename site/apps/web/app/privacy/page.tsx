import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Privacy - Cevolta",
  description:
    "What Cevolta's website collects: a waitlist email and a timestamp stored privately, plus anonymous, cookieless analytics and performance metrics from Vercel.",
  alternates: {
    canonical: "/privacy",
    types: { "text/markdown": "/privacy.md" },
  },
};

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Privacy" title="Privacy">
      <p>
        This page describes what Cevolta&apos;s <em>website</em> collects.
        The Cevolta <em>protocol</em> is a separate, non-custodial system
        that never takes custody of anyone&apos;s funds; this page is only
        about the site you&apos;re reading right now.
      </p>

      <h2>Waitlist</h2>
      <p>
        When you submit an email on this site, it&apos;s stored, together
        with the time you joined, in a single private object in Vercel
        Blob storage. It&apos;s used only to email you when Cevolta opens
        on Testnet. It is not sold, shared with third parties, or used
        for anything else. There&apos;s no self-service way to remove it
        yet &mdash; ask via{" "}
        <Link className="link" href="/contact">
          Contact
        </Link>{" "}
        and it&apos;ll be removed by hand.
      </p>

      <h2>Analytics</h2>
      <p>
        This site uses Vercel Analytics and Vercel Speed Insights to see
        page views and page-load performance. Both are cookieless: they
        don&apos;t set tracking cookies, don&apos;t use a persistent
        identifier, and don&apos;t know who you are beyond the email you
        choose to submit to the waitlist. Data is aggregated, not tied to
        an individual visitor.
      </p>

      <h2>Access</h2>
      <p>
        Waitlist entries are readable only by whoever holds Cevolta&apos;s
        admin key, an environment variable set outside this repository,
        not by anyone who can view the site&apos;s source.
      </p>
    </ContentPage>
  );
}
