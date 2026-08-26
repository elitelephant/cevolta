import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import styles from "./ContentPage.module.css";

export default function ContentPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.prose}>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
