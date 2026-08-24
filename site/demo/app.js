/*
 * Cevolta interactive demo.
 * Everything here is a client-side simulation: no wallet is really connected,
 * no transaction is submitted, no funds move. It exists to make the
 * subscription lifecycle (create plan -> subscribe -> auto-renew -> cancel)
 * concrete before the real Soroban contracts are wired up.
 *
 * Vocabulary follows CONTEXT.md: Merchant, Subscriber, Smart Wallet,
 * Policy Signer, Subscription Registry, Renewal Trigger, Subscription Status.
 */

const STORAGE_KEY = "cevolta-demo-state-v1";

const defaultState = () => ({
  merchantWallet: null,
  subscriberWallet: null,
  plans: [],
  subscriptions: [],
  log: [],
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or storage disabled: demo still works, just doesn't persist */
  }
}

let state = loadState();

function fakeAddress(prefix) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = prefix;
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + "…" + chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function log(message) {
  state.log.unshift({ time: new Date().toLocaleTimeString(), message });
  state.log = state.log.slice(0, 50);
}

function planById(id) {
  return state.plans.find((p) => p.id === id);
}

/* ---------- actions ---------- */

function connectMerchantWallet() {
  state.merchantWallet = fakeAddress("CMER");
  log(`Merchant Smart Wallet connected: ${state.merchantWallet}`);
  persistAndRender();
}

function connectSubscriberWallet() {
  state.subscriberWallet = fakeAddress("CSUB");
  log(`Subscriber Smart Wallet connected via passkey: ${state.subscriberWallet}`);
  persistAndRender();
}

function createPlan(name, price, cadenceDays) {
  const plan = {
    id: uid(),
    name,
    priceUsdc: price,
    cadenceDays,
    merchantAddress: state.merchantWallet,
  };
  state.plans.push(plan);
  log(`Merchant created plan "${name}" — ${price} USDC every ${cadenceDays} days`);
  persistAndRender();
}

function subscribe(planId) {
  const plan = planById(planId);
  if (!plan) return;
  const sub = {
    id: uid(),
    planId,
    subscriberAddress: state.subscriberWallet,
    status: "active",
    periodsPaid: 0,
    retryCount: 0,
  };
  state.subscriptions.push(sub);
  log(
    `Subscriber installed a Policy Signer: max ${plan.priceUsdc} USDC to ${plan.merchantAddress}, every ${plan.cadenceDays} days. No further approval needed.`
  );
  persistAndRender();
}

function simulateRenewal(subId, succeed) {
  const sub = state.subscriptions.find((s) => s.id === subId);
  if (!sub || sub.status === "cancelled") return;
  const plan = planById(sub.planId);

  if (succeed) {
    sub.status = "active";
    sub.periodsPaid += 1;
    sub.retryCount = 0;
    log(
      `Renewal Trigger called renew() — Policy Signer authorized ${plan.priceUsdc} USDC to ${plan.merchantAddress}. Period #${sub.periodsPaid} charged.`
    );
  } else {
    if (sub.status === "active") {
      sub.status = "past_due";
      sub.retryCount = 1;
      log(`renew() failed (insufficient funds) — subscription marked past_due, retry scheduled.`);
    } else if (sub.status === "past_due" && sub.retryCount >= 2) {
      sub.status = "cancelled";
      log(`renew() failed again after retries — subscription auto-cancelled, no further charges attempted.`);
    } else {
      sub.retryCount += 1;
      log(`renew() failed again — retry ${sub.retryCount}/2 before auto-cancel.`);
    }
  }
  persistAndRender();
}

function cancelSubscription(subId) {
  const sub = state.subscriptions.find((s) => s.id === subId);
  if (!sub) return;
  sub.status = "cancelled";
  log(
    `Subscriber called cancel() — Subscription Registry updated to cancelled and the Policy Signer was revoked in the same atomic transaction. No merchant involved.`
  );
  persistAndRender();
}

function resetDemo() {
  state = defaultState();
  log("Demo reset.");
  persistAndRender();
}

function persistAndRender() {
  saveState();
  render();
}

/* ---------- rendering ---------- */

function statusPill(status) {
  return `<span class="status-pill status-${status}">${status.replace("_", " ")}</span>`;
}

function renderMerchantPanel() {
  const el = document.getElementById("panel-merchant");

  if (!state.merchantWallet) {
    el.innerHTML = `
      <div class="empty-state">
        <p>Connect a Merchant Smart Wallet to create a subscription plan.</p>
        <button class="btn btn-primary" id="btn-connect-merchant">Connect Smart Wallet</button>
      </div>`;
    document.getElementById("btn-connect-merchant").onclick = connectMerchantWallet;
    return;
  }

  const myPlans = state.plans.filter((p) => p.merchantAddress === state.merchantWallet);

  el.innerHTML = `
    <div class="panel" style="margin-bottom: 24px;">
      <div class="row-between">
        <div>
          <div style="font-size:0.8rem;color:var(--text-dim);">Merchant Smart Wallet</div>
          <div class="mono">${state.merchantWallet}</div>
        </div>
      </div>
      <div style="margin-top:20px;">
        <div class="field"><label>Plan name</label><input id="plan-name" placeholder="Weekly coffee" /></div>
        <div class="field"><label>Price (USDC)</label><input id="plan-price" type="number" min="0" step="0.01" placeholder="5.00" /></div>
        <div class="field">
          <label>Cadence</label>
          <select id="plan-cadence">
            <option value="7">Weekly</option>
            <option value="30" selected>Monthly</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="btn-create-plan">Publish plan</button>
      </div>
    </div>
    <h3 style="font-size:1rem;color:var(--text-dim);margin-bottom:14px;">Your plans</h3>
    <div id="merchant-plans">
      ${
        myPlans.length === 0
          ? `<div class="empty-state">No plans yet — create one above.</div>`
          : myPlans
              .map((p) => {
                const subs = state.subscriptions.filter((s) => s.planId === p.id);
                const activeCount = subs.filter((s) => s.status === "active").length;
                return `
                <div class="plan-card">
                  <div class="row-between">
                    <div>
                      <strong>${p.name}</strong>
                      <div class="mono">${p.priceUsdc} USDC / ${p.cadenceDays} days</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:0.85rem;color:var(--text-dim);">${activeCount} active subscriber(s)</div>
                      <button class="btn btn-ghost btn-small" data-copy="${p.id}">Copy checkout link</button>
                    </div>
                  </div>
                </div>`;
              })
              .join("")
      }
    </div>
  `;

  document.getElementById("btn-create-plan").onclick = () => {
    const name = document.getElementById("plan-name").value.trim() || "Untitled plan";
    const price = parseFloat(document.getElementById("plan-price").value) || 0;
    const cadence = parseInt(document.getElementById("plan-cadence").value, 10);
    createPlan(name, price, cadence);
  };

  el.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.onclick = () => {
      const link = `${location.origin}/demo/#plan=${btn.dataset.copy}`;
      navigator.clipboard?.writeText(link).catch(() => {});
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy checkout link"), 1200);
    };
  });
}

function renderSubscriberPanel() {
  const el = document.getElementById("panel-subscriber");

  if (!state.subscriberWallet) {
    el.innerHTML = `
      <div class="empty-state">
        <p>Connect a Subscriber Smart Wallet (passkey) to see available plans.</p>
        <button class="btn btn-primary" id="btn-connect-subscriber">Connect Smart Wallet</button>
      </div>`;
    document.getElementById("btn-connect-subscriber").onclick = connectSubscriberWallet;
    return;
  }

  const mySubs = state.subscriptions.filter((s) => s.subscriberAddress === state.subscriberWallet);
  const subscribedPlanIds = new Set(mySubs.filter((s) => s.status !== "cancelled").map((s) => s.planId));
  const available = state.plans.filter((p) => !subscribedPlanIds.has(p.id));

  el.innerHTML = `
    <div class="panel" style="margin-bottom: 24px;">
      <div style="font-size:0.8rem;color:var(--text-dim);">Subscriber Smart Wallet</div>
      <div class="mono">${state.subscriberWallet}</div>
    </div>

    <h3 style="font-size:1rem;color:var(--text-dim);margin-bottom:14px;">Available plans</h3>
    <div style="margin-bottom:32px;">
      ${
        available.length === 0
          ? `<div class="empty-state">No plans to subscribe to yet — create one from the Merchant tab.</div>`
          : available
              .map(
                (p) => `
                <div class="plan-card">
                  <div class="row-between">
                    <div>
                      <strong>${p.name}</strong>
                      <div class="mono">${p.priceUsdc} USDC / ${p.cadenceDays} days · ${p.merchantAddress}</div>
                    </div>
                    <button class="btn btn-primary btn-small" data-subscribe="${p.id}">Subscribe</button>
                  </div>
                </div>`
              )
              .join("")
      }
    </div>

    <h3 style="font-size:1rem;color:var(--text-dim);margin-bottom:14px;">Your subscriptions</h3>
    <div>
      ${
        mySubs.length === 0
          ? `<div class="empty-state">No subscriptions yet.</div>`
          : mySubs
              .map((s) => {
                const p = planById(s.planId);
                const cancelled = s.status === "cancelled";
                return `
                <div class="sub-card">
                  <div class="row-between">
                    <div>
                      <strong>${p ? p.name : "Unknown plan"}</strong> ${statusPill(s.status)}
                      <div class="mono">${p ? p.priceUsdc : "?"} USDC / ${p ? p.cadenceDays : "?"} days · ${s.periodsPaid} period(s) charged</div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      ${
                        cancelled
                          ? ""
                          : `
                        <button class="btn btn-ghost btn-small" data-renew-ok="${s.id}">Simulate next billing cycle</button>
                        <button class="btn btn-ghost btn-small" data-renew-fail="${s.id}">Simulate failed charge</button>
                        <button class="btn btn-ghost btn-small" data-cancel="${s.id}" style="color:var(--bad);border-color:var(--bad);">Cancel</button>
                      `
                      }
                    </div>
                  </div>
                </div>`;
              })
              .join("")
      }
    </div>
  `;

  el.querySelectorAll("[data-subscribe]").forEach((btn) => {
    btn.onclick = () => subscribe(btn.dataset.subscribe);
  });
  el.querySelectorAll("[data-renew-ok]").forEach((btn) => {
    btn.onclick = () => simulateRenewal(btn.dataset.renewOk, true);
  });
  el.querySelectorAll("[data-renew-fail]").forEach((btn) => {
    btn.onclick = () => simulateRenewal(btn.dataset.renewFail, false);
  });
  el.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.onclick = () => cancelSubscription(btn.dataset.cancel);
  });
}

function renderLog() {
  const el = document.getElementById("activity-log");
  if (state.log.length === 0) {
    el.innerHTML = `<div class="entry">No activity yet.</div>`;
    return;
  }
  el.innerHTML = state.log
    .map((e) => `<div class="entry"><span class="t">[${e.time}]</span> ${e.message}</div>`)
    .join("");
}

function render() {
  renderMerchantPanel();
  renderSubscriberPanel();
  renderLog();
}

/* ---------- tabs ---------- */

function initTabs() {
  const tabMerchant = document.getElementById("tab-merchant");
  const tabSubscriber = document.getElementById("tab-subscriber");
  const panelMerchant = document.getElementById("panel-merchant");
  const panelSubscriber = document.getElementById("panel-subscriber");

  tabMerchant.onclick = () => {
    tabMerchant.classList.add("active");
    tabSubscriber.classList.remove("active");
    panelMerchant.style.display = "";
    panelSubscriber.style.display = "none";
  };
  tabSubscriber.onclick = () => {
    tabSubscriber.classList.add("active");
    tabMerchant.classList.remove("active");
    panelSubscriber.style.display = "";
    panelMerchant.style.display = "none";
  };
}

document.getElementById("reset-demo").onclick = resetDemo;

initTabs();
render();
