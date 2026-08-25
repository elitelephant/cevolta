"use client";

import { useRef, useState } from "react";
import styles from "./WaitlistForm.module.css";

type Status = "idle" | "submitting" | "success" | "already" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  invalid: "Enter a valid email address.",
  networkError: "Network error. Please try again.",
  serverError: "Something went wrong. Please try again.",
  success: "Done. We'll email you when Cevolta opens on Testnet.",
  alreadyJoined: "You're already on the list.",
  idleNote: "No spam. One email, when we open on Testnet.",
};

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const honeypot = String(data.get("company") ?? "");
    if (honeypot) {
      form.reset();
      return;
    }

    const email = String(data.get("email") ?? "").trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      setInvalid(true);
      setMessage(MESSAGES.invalid);
      emailRef.current?.focus();
      return;
    }

    setInvalid(false);
    setMessage("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error || MESSAGES.serverError);
      } else if (json.alreadyJoined) {
        setStatus("already");
        setMessage(MESSAGES.alreadyJoined);
      } else {
        setStatus("success");
        setMessage(MESSAGES.success);
      }
    } catch {
      setStatus("error");
      setMessage(MESSAGES.networkError);
    }

    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const done = status === "success" || status === "already";
  const announced = done || status === "error";

  return (
    <>
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        hidden={done}
      >
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <label className="sr-only" htmlFor="waitlist-email">
          Email address
        </label>
        <input
          ref={emailRef}
          className={`${styles.input}${invalid ? ` ${styles.inputInvalid}` : ""}`}
          type="email"
          id="waitlist-email"
          name="email"
          placeholder="you@email.com"
          autoComplete="email"
          required
          aria-invalid={invalid || undefined}
        />
        <button className="btn" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Joining…" : "Join"}
        </button>
        {invalid && <p className={styles.errorMsg}>{message}</p>}
      </form>
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={`trust-note ${styles.status}${
          status === "error" ? ` ${styles.statusError}` : ""
        }`}
      >
        {announced ? message : MESSAGES.idleNote}
      </p>
    </>
  );
}
