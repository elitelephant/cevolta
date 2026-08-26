import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <p className="eyebrow">404</p>
        <h1>There&apos;s no page here</h1>
        <p className="lead">
          The link you followed doesn&apos;t match anything on Cevolta.
          Here&apos;s where to look instead:
        </p>
        <ul className={styles.links}>
          <li>
            <Link className="link" href="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="link" href="/about">
              About
            </Link>
          </li>
          <li>
            <Link className="link" href="/contact">
              Contact
            </Link>
          </li>
          <li>
            <a className="link" href="/sitemap.xml">
              Sitemap
            </a>
          </li>
          <li>
            <a className="link" href="/llms.txt">
              llms.txt
            </a>
          </li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
