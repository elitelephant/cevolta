"use client";

import { useEffect, useState } from "react";
import styles from "./DotNav.module.css";
import { slides } from "@/content/navigation";

export default function DotNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = slides
      .map((slide) =>
        document.querySelector<HTMLElement>(`section${slide.href}`)
      )
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.dotnav} aria-label="Slide navigation">
      {slides.map((slide, i) => (
        <a
          key={slide.href}
          href={slide.href}
          aria-label={slide.label}
          aria-current={i === active ? "true" : undefined}
          className={i === active ? styles.active : undefined}
        />
      ))}
    </nav>
  );
}
