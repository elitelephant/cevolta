# Stellar Recurring Subscriptions

Non-custodial recurring-subscription protocol on Stellar where charge authorization lives in the Subscriber's own wallet, not with the Merchant or the protocol.

## Language

**Merchant**:
A business that creates subscription plans and receives recurring payments.
_Avoid_: negocio, seller

**Subscriber**:
A person who subscribes to a Merchant's plan and pays recurring charges from their own Smart Wallet.
_Avoid_: persona, customer, user

**Smart Wallet**:
A Soroban contract account belonging to a Subscriber, implementing `CustomAccountInterface`, holding the Subscriber's signers (passkey/Ed25519) plus any Policy Signers.
_Avoid_: account, wallet (bare)

**Policy Signer**:
A signer inside a Subscriber's Smart Wallet that authorizes only charges matching one Subscription's amount, recipient, and cadence — and nothing else, even if compromised.
_Avoid_: allowance, approval

**Subscription Registry**:
The Soroban contract that stores Merchant plans and Subscription records and triggers charge attempts. It never holds an allowance or custody of funds — only the Policy Signer actually authorizes fund movement.
_Avoid_: subscription contract (bare), sb_subscription

**Renewal Trigger**:
The off-chain process that calls the Subscription Registry's renewal function once a Subscription's next renewal ledger is reached. It has no spending power of its own — the Policy Signer is what authorizes or rejects the charge.
_Avoid_: keeper, cron job (as the canonical name)

**Subscription Status**:
One of three states on a Subscription record — `active` (charges authorized, on schedule), `past_due` (last renewal attempt failed, automatic retries in progress), or `cancelled` (no further charges will be attempted).
_Avoid_: subscription state (as a separate term — same concept)
