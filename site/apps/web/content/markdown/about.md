# About Cevolta

Cevolta is a non-custodial recurring-payments protocol being designed for
Stellar, using Soroban smart contracts. It's a solo project, built in
Chile.

## The idea

Most recurring payments today — subscriptions, rent, sending money home —
run on trust. A business asks for standing authorization over a card or
account and hopes it's never misused. Cevolta puts that authorization
inside the payer's own wallet instead.

A Payer enrolls in a Payee's Plan, and their wallet's Policy Signer
authorizes only charges matching that Plan's amount, recipient, and
cadence — nothing else, even if the Payee or the protocol itself is
compromised. Cancelling is always the Payer's call, and it's immediate.
See [CONTEXT.md](https://github.com/elitelephant/cevolta/blob/main/CONTEXT.md)
in the GitHub repo for the full terminology and mechanism.

## Current stage

Cevolta is pre-Testnet. Only this landing page and its waitlist exist
today — the Soroban contracts (Payment Registry, Smart Wallet
integration) haven't been written yet. This site exists to collect a
waitlist ahead of the first Testnet release.

## Open source

The repository, terminology reference, and design decisions are public
on [GitHub](https://github.com/elitelephant/cevolta).

## More

- [Home](https://cevolta.xyz/)
- [Contact](https://cevolta.xyz/contact)
- [Privacy](https://cevolta.xyz/privacy)
