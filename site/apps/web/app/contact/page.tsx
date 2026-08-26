import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { GITHUB_URL } from "@/content/navigation";

export const metadata: Metadata = {
  title: "Contact - Cevolta",
  description:
    "How to reach Cevolta: open a GitHub issue, or join the waitlist to hear when it opens on Testnet.",
  alternates: {
    canonical: "/contact",
    types: { "text/markdown": "/contact.md" },
  },
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Contact" title="Contact">
      <p>
        Cevolta doesn&apos;t have a support inbox yet. It&apos;s a solo,
        pre-launch project, so there are two real ways to reach it, and
        both go straight to the person building it, not a team or a
        ticket queue.
      </p>

      <h2>GitHub</h2>
      <p>
        Open an issue on the{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener">
          repository
        </a>{" "}
        for bug reports, protocol questions, or anything you think should
        be documented. This is the fastest way to get a direct answer,
        and it&apos;s public, so the answer helps the next person with the
        same question.
      </p>

      <h2>Waitlist</h2>
      <p>
        <Link className="link" href="/#waitlist">
          Join the waitlist
        </Link>{" "}
        and you&apos;ll be the first to hear when Cevolta opens on
        Testnet. It&apos;s also a way to signal that you want to hear
        more, even without a specific question.
      </p>

      <p>
        There&apos;s no chatbot and no support ticket system behind this
        page &mdash; just those two channels.
      </p>
    </ContentPage>
  );
}
