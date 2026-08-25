import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <a className={styles.logo} href="#overview">
          <span className={styles.logoDot} />
          Cevolta
        </a>
        <nav className={styles.siteNav}>
          <a className={styles.navLink} href="#for-merchants">
            How it works
          </a>
          <a className={styles.navLink} href="#use-cases">
            Use cases
          </a>
          <a className="btn" href="#waitlist">
            Join the waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}
