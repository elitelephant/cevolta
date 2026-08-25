import styles from "./SiteFooter.module.css";
import { GITHUB_URL } from "@/content/navigation";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© 2026 Cevolta. Built in Chile, on Stellar.</span>
        <span>
          <a href={GITHUB_URL} target="_blank" rel="noopener">
            GitHub
          </a>
          {" · "}
          <a href="#waitlist">Join the waitlist</a>
        </span>
      </div>
    </footer>
  );
}
