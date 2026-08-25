# Cevolta

Non-custodial recurring payments on Stellar. Charge authorization lives in the Subscriber's own Smart Wallet (via a Policy Signer with a fixed amount, recipient, and cadence), not in an open-ended allowance held by the Merchant.

See the domain and architecture decisions in [`CONTEXT.md`](./CONTEXT.md) and [`docs/adr`](./docs/adr).

## Status

Idea validated with a landing page. The Soroban contract (Subscription Registry) and the Testnet-connected interfaces are under construction; see [`docs`](./docs).

## Structure

- `site/`: landing page + waitlist, a Next.js app in its own small Turborepo (deployed on Vercel)
- `docs/`: domain glossary, ADRs, agent notes
- `CONTEXT.md`: domain terminology glossary

## Landing page

```
cd site
npm install
npm run dev
```

Production site: [cevolta.xyz](https://cevolta.xyz)
