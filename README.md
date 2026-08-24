# Cevolta

Protocolo de suscripciones recurrentes no-custodial en Stellar. La autorización del cobro vive en la Smart Wallet del propio Subscriber (vía un Policy Signer con monto, destinatario y cadencia fijos), no en un allowance abierto en manos del Merchant.

Ver el dominio y las decisiones de arquitectura en [`CONTEXT.md`](./CONTEXT.md) y [`docs/adr`](./docs/adr).

## Estado

Idea validada con landing page y demo. El contrato Soroban (Subscription Registry) y las interfaces conectadas a Testnet están en construcción — ver [`docs`](./docs).

## Estructura

- `site/` — landing page estática + waitlist (Vercel)
- `docs/` — glosario de dominio, ADRs, notas de agentes
- `CONTEXT.md` — glosario de términos del dominio

## Landing page

```
cd site
npm install
vercel dev
```

Sitio en producción: [cevolta.xyz](https://cevolta.xyz)
