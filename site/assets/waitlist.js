(function () {
  const form = document.getElementById("waitlist");
  if (!form) return;

  const emailField = document.getElementById("waitlist-email");
  const honeypot = document.getElementById("company");
  const status = document.getElementById("waitlist-status");
  const defaultStatus = status.innerHTML;
  const submitBtn = form.querySelector("button[type=submit]");

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "var(--bad)" : "var(--good)";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (honeypot.value) {
      form.reset();
      status.innerHTML = defaultStatus;
      return;
    }

    const email = emailField.value.trim();
    if (!email) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Joining…";

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.error || "Something went wrong. Please try again.", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "Join the waitlist";
        return;
      }

      form.reset();
      form.hidden = true;
      setStatus(
        data.alreadyJoined
          ? "You're already on the list."
          : "You're on the list — we'll email you when Cevolta opens.",
        false
      );
    } catch (err) {
      setStatus("Network error. Please try again.", true);
      submitBtn.disabled = false;
      submitBtn.textContent = "Join the waitlist";
    }
  });
})();
