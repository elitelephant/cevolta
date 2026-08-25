import styles from "./Slide.module.css";

export default function Slide({
  id,
  last = false,
  children,
}: {
  id: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={last ? `${styles.slide} ${styles.slideLast}` : styles.slide}
    >
      <div className={styles.card}>
        <div className={styles.inner}>{children}</div>
      </div>
    </section>
  );
}
