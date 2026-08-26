# Stellar Recurring Payments

Non-custodial recurring-payments protocol on Stellar where charge authorization lives in the Payer's own wallet, not with the Payee or the protocol. Subscriptions are the flagship use case; the terms below describe the general mechanism so it also covers peer-to-peer cases (rent, an allowance to someone) where neither side is a "merchant" or a "subscriber" in the traditional sense.

## Language

**Payee**:
Whoever creates a Plan and receives its recurring payments: a business running subscription billing, or a person receiving rent or a regular payment from someone else.
_Avoid_: merchant, negocio, seller, business (as the canonical name)

**Payer**:
Whoever enrolls in a Plan from their own Smart Wallet and pays it on schedule: a subscriber paying a business, or a person paying rent, an allowance, or anyone else.
_Avoid_: subscriber, persona, customer, user

**Plan**:
A Payee-defined template for a recurring payment: an amount, a cadence, and optional metadata. Created via `create_plan`, read via `get_plan`. Not itself a charge or an authorization. A Payer must Enroll in it before any money moves.
_Avoid_: subscription plan (as the canonical name), tier, product

**Enrollment**:
A specific Payer's commitment to a Plan: the fixed amount, recipient, and cadence a Policy Signer will authorize, plus its current Enrollment Status. Created via `enroll`, read via `get_enrollment`.
_Avoid_: subscription (as the canonical name)

**Smart Wallet**:
A Soroban contract account belonging to a Payer, implementing `CustomAccountInterface`, holding the Payer's signers (passkey/Ed25519) plus any Policy Signers.
_Avoid_: account, wallet (bare)

**Policy Signer**:
A signer inside a Payer's Smart Wallet that authorizes only charges matching one Enrollment's amount, recipient, and cadence, and nothing else, even if compromised.
_Avoid_: allowance, approval

**Payment Registry**:
The Soroban contract that stores Plans and Enrollments and triggers charge attempts. It never holds an allowance or custody of funds; only the Policy Signer actually authorizes fund movement.
_Avoid_: subscription registry, subscription contract (bare), sb_subscription

**Renewal Trigger**:
The off-chain process that calls the Payment Registry's renewal function once an Enrollment's next renewal ledger is reached. It has no spending power of its own; the Policy Signer is what authorizes or rejects the charge.
_Avoid_: keeper, cron job (as the canonical name)

**Enrollment Status**:
One of three states on an Enrollment record: `active` (charges authorized, on schedule), `past_due` (last renewal attempt failed, automatic retries in progress), or `cancelled` (no further charges will be attempted).
_Avoid_: subscription status, subscription state (as a separate term, same concept)
