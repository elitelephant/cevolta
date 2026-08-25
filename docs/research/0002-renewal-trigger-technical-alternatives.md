# Research: technical alternatives for who/what submits `renew()`

Strictly technical catalog, run against primary sources via the stellar-raven MCP gateway
(`stellarDocs` = official developers.stellar.org docs, including CAP text mirrored from
`stellar/stellar-protocol` on GitHub; `scout` = live ecosystem/repo/audit directory; direct
GitHub reads via `gh api` for repo source/READMEs; `WebFetch`/`WebSearch` against Chainlink's
and Gelato's own docs) on 2026-08-25. This is a follow-on to
`docs/research/0001-renewal-trigger-and-market-viability.md`, scoped narrowly to the technical
question that document's §1 opened and did not fully catalog: **once you accept that Soroban has
no native scheduler and something external must submit the Subscription Registry's `renew()`
call each cycle, what are all the concrete ways to build that "something external"?**

This document does not rank the alternatives, does not make a business or competitive argument,
and does not recommend one. Each section states what the alternative is, how it would concretely
work for Cevolta's `renew()` call, its pros/cons/trade-offs, and the primary-source evidence (or
explicit absence of evidence) behind it. A comparison table is at the end.

## 0. Baseline, re-confirmed

The prior pass already established, from official docs, that Soroban has no native cron/scheduler
and that time-based rules in a custom account (`__check_auth`) only **gate or expire** an
authorization — they never cause a contract to act on its own. This pass re-searched the docs
corpus for anything that might have changed that (see §9 below) and found nothing that
contradicts it. Every alternative catalogued here is therefore a way of building the "something
external calls `renew()`" piece, not a way of eliminating the need for it.

## 1. Centralized poller via OpenZeppelin Relayer

**What it is.** A single off-chain process Cevolta operates that watches Subscription Registry
state, determines which subscriptions are due, builds and signs `renew()` transactions, and
submits them through OpenZeppelin Relayer (branded "Stellar Channels Service" in the official
docs) rather than directly to Stellar RPC.

**How it would work for Cevolta.** The poller reads subscription due-dates from the Registry
(directly via RPC/Horizon, or from its own indexed copy), builds `renew(subscription_id)`
invocations, simulates them to obtain auth XDRs, and calls `ChannelsClient.submitSorobanTransaction()`
or `submitTransaction()` from `@openzeppelin/relayer-plugin-channels`. Relayer handles nonce
management, fee bidding, and parallel submission; Cevolta still owns and runs the actual
scheduling logic (the polling loop and due-date computation).

**What Relayer does and does not do (verified from its own docs page).** Reading the full page
at `/docs/tools/openzeppelin-relayer` confirms it is purely a **submission and fee-sponsorship**
service: initialize a client, build a `TransactionBuilder` transaction yourself, simulate it,
extract the function/auth XDRs (or sign a full classic transaction), and hand the already-built
payload to Relayer's `submitSorobanTransaction()` / `submitTransaction()`. There is no scheduling,
cron, or "call this again in N days" primitive anywhere in the walked example — every code sample
in the docs is triggered by an explicit caller action (a button click in the worked Next.js demo).
This directly answers open question 4 from the task: **Relayer has no built-in scheduling
capability of its own; it is exclusively a transaction-submission/relay layer that something else
(here, Cevolta's poller) must invoke on a schedule it maintains itself.**

**Maturity nuance (re-verified from this pass).** `OpenZeppelin/openzeppelin-relayer` (the
core, chain-agnostic engine) remains mature multi-chain infrastructure. The Stellar-specific
plugin, `OpenZeppelin/relayer-plugin-channels`, is the thin, comparatively new layer the docs
actually walk you through — this was already flagged in the prior pass and nothing in this pass's
searches changed that picture.

**Precedent for exactly this shape.** `vowena/sdk` — a real (if small, unlisted, unaudited)
Stellar subscription-billing SDK — documents "the keeper bot that drives on-chain billing" as a
first-class part of its architecture (its README: *"the same client powers the Vowena dashboard
and the keeper bot that drives on-chain billing"*; its docs index links a page titled "Charging
the keeper way"). That is independent, real-world convergence on the same single-operator-poller
shape as this alternative, from a different builder solving the identical problem.

**Pros.** Simplest to build and reason about; one component to operate; Relayer absorbs nonce/fee
complexity; straightforward to add monitoring/alerting on a single process.

**Cons.** Single point of failure for liveness — if the poller process or its host goes down,
renewals silently stop until someone notices; the operator (Cevolta) is a centralized trust
anchor for on-time execution, even though it has no spending power (the Policy Signer still gates
the actual charge); the Stellar-specific Relayer glue code is less battle-tested than the core
engine.

**Open questions/risks.** What retry/backoff policy on submission failure; how staleness is
detected and alerted on; whether Relayer's fee-bidding logic is transparent/predictable enough
for cost budgeting; whether the "Stellar Channels Service" itself has an SLA or is itself a
single point of failure upstream of Cevolta's own poller.

## 2. Redundant independent pollers racing to submit the same call

**What it is.** 2-3 independently operated poller processes (different hosts, potentially
different operators) that each independently compute due subscriptions and submit `renew()`,
relying on the Subscription Registry to make a second/third submission for the same subscription
a cheap no-op (idempotent) rather than a double-charge.

**How it would work for Cevolta.** `renew()` checks the subscription's `next_renewal_ledger`
(or a per-cycle nonce) before acting; if a poller submits after another poller's transaction for
the same cycle already landed, the second call fails cheaply (e.g., a `require`/error path) rather
than double-charging the Subscriber. This is an application-level idempotency guarantee Cevolta
must build into the Registry contract — Stellar's protocol offers no native "exactly-once
scheduled call" primitive to lean on.

**Pros.** Removes the single-operator liveness risk from alternative 1 without needing a
tokenomics/incentive layer (alternative 3); operators can be Cevolta itself running on
independent infrastructure, or a small number of trusted third parties, without opening execution
to a fully permissionless market.

**Cons.** Multiplies operating cost/complexity by the number of redundant pollers; "redundant
trust" is still trust — if all pollers are Cevolta-run, this only protects against infrastructure
failure, not operator failure/exit; races waste gas on the losing submission(s) unless the
contract can reject early (e.g., via `simulateTransaction` catching the failure before broadcast).

**Precedent for the racing/idempotent-execution pattern.** Nectar Network's actual keeper
race for Blend liquidations is the closest documented analog on Stellar (see §3): its README
states the liquidation fill is "ONE atomic `submit([fill, repay…, withdraw_collateral…])`: either
the keeper ends holding real tokens and no debt, or nothing happened. **First confirmed
transaction wins the race**… The losing keeper detects the already-filled auction and rolls its
draw back — no capital lost." This is evidence that the "let redundant off-chain actors race,
make the contract state the arbiter" pattern is real, live (testnet), and works for a
structurally similar "someone must call this before a deadline" problem on Soroban — though
Nectar's redundancy is economically incentivized competition (§3), not simple operational
redundancy of a single non-profit-seeking process.

**Open questions/risks.** Exact idempotency-check design (nonce vs. ledger-range vs. status flag)
and its gas cost; how operators are chosen/trusted if not all Cevolta-run; whether losing
submissions should fail during `simulateTransaction` (cheap) or only on-ledger (wastes a
submission fee).

## 3. Permissionless keeper marketplace with rewards

**What it is.** Open the `renew()` call to any address, with an on-chain bounty/fee paid to
whichever keeper successfully executes it, so market incentives (not Cevolta's own operations)
guarantee liveness.

Three concrete Stellar/Soroban precedents were examined in more depth than the prior pass went
into, by reading each repo's actual source and/or README rather than only its directory metadata:

### 3a. `Nectar-Network/nectar` — competing-keeper liquidation network for Blend Protocol

Read directly from its README and architecture diagram (repoScore 69, SCF-funded, last commit
2026-08-16, live on Soroban **testnet**, contracts frozen at an audit-freeze tag for an SCF
security-audit-bank engagement — not yet independently audited as of this pass).

Verified mechanism: a `KeeperRegistry` contract requires keepers to self-register and post a
stake (`register()` pulls `min_stake` USDC via SAC transfer); a `NectarVault` contract pools
depositor capital that keepers `draw()` against to fund a liquidation, then `return_proceeds()`;
a `slash()` function is **permissionless after a timeout** — anyone can call it to slash a keeper
that drew capital and never returned it, redirecting the slashed stake to the vault. Competing
keepers watch the same on-chain auction state; "first confirmed transaction wins the race," and
the loser detects the already-filled auction and rolls back with no capital lost (see §2).
Keeper performance (executions, response time, profit) is tracked on-chain via
`record_execution()`. This is a genuine, documented, code-verified instance of a permissionless
(stake-gated, not whitelist-gated) competing-keeper design shipping on Soroban testnet for a
structurally identical "someone must call this before a deadline, and if nobody does, value is
lost" problem.

**Applicability caveat:** Nectar's incentive is the liquidation profit itself (bid/lot spread) —
keepers are drawing on a shared vault and keeping a cut of a value-capture event. A subscription
`renew()` call has no comparable intrinsic profit opportunity for the caller unless Cevolta
explicitly funds a bounty per call (see below); the economic model does not transfer directly.

### 3b. `SoroLabs/SoroTask` — general-purpose keeper/automation marketplace

Read directly from its README, architecture diagrams, and ~10,700-line `contract/src/lib.rs`
(repoScore 39, 444 commits/90d per the prior pass, 70 open issues, not SCF-funded, no verified
mainnet contract; testnet demo at soro-task.vercel.app).

Its own description: *"On most blockchains smart contracts just sit there — they only run when
someone calls them. That makes recurring things like yield harvesting, auto-drip, or liquidation
checks hard. SoroTask fixes this by letting users pay a small XLM fee to Keepers (bots) that
watch the network and trigger the transaction at the right time."* — i.e., it is explicitly framed
as a general renewal-trigger-shaped problem solver, not domain-specific.

Verified from source, not just the README:
- `register(config: TaskConfig)` lets any task creator register a recurring task with an
  `interval`, a `gas_balance` (must meet a contract-wide `min_bounty`), and an optional
  `whitelist: Vec<Address>` of allowed keepers.
- `execute(keeper: Address, task_id: u64)` requires only the calling keeper's own
  `require_auth()` — **not** an admin or contract-owner signature. If `whitelist` is non-empty,
  the calling keeper must be in it (verified directly in `execute_internal`'s "Check whitelist"
  step and in the test suite, e.g. an unauthorized keeper's `try_execute` call fails with
  `Error::Unauthorized`); an **empty whitelist makes the task fully permissionless** — any keeper
  may execute it and presumably collect the bounty. This gives a task creator (in Cevolta's case,
  potentially the Merchant or Cevolta itself) a real, code-level choice between "anyone may
  trigger renewal" and "only these specific addresses may."
- The contract also defines `create_policy` / `submit_claim` / `settle_claim` entry points for an
  **on-chain insurance mechanism**: a policy owner pays a premium for coverage tied to a task,
  submits a claim (`policy.owner.require_auth()`) if the keeper network fails to execute, and can
  have the claim settled once submitted. This is architecturally interesting for the general "what
  happens if literally zero keepers show up" gap identified in the prior pass, though it is scoped
  per-task-owner insurance (an opt-in, paid safety net), not a network-wide liveness guarantee.
- The contract also exposes VRF-based keeper assignment (`VrfKeeperAssignment`), keeper
  reputation tracking, keeper staking/slashing types, and keeper delegation-pool storage — i.e.
  a materially more elaborate design than a simple bounty-per-call model, though (per repo
  maturity signals) unaudited and not yet deployed to mainnet.

**Applicability.** SoroTask's `register`/`execute`/whitelist pattern maps onto Cevolta's problem
almost directly: a Subscription Registry `renew()` could adopt the same "optional per-subscription
allowlist, default-permissionless, bounty-funded" shape without needing to depend on SoroTask
itself — it is evidence of a workable contract-level design more than a drop-in dependency,
given its current unaudited/pre-mainnet status.

### 3c. `soroban-tooling/soroban-keeper-network`

Re-confirmed as the least mature of the three: repoScore 21, 85 open issues, no SCF funding, no
mainnet contract on record, and (per this pass's `scout.searchRepos` call) no description string
populated in the directory at all. Nothing in this pass changes the prior pass's conclusion that
this is the weakest of the three data points — it is listed here for completeness per the task's
request to verify all three, not because it adds new evidence.

**Pros (marketplace model generally).** Removes Cevolta as an operational or trust bottleneck for
liveness entirely, once bootstrapped; SoroTask's design shows the contract-level mechanics
(whitelist toggle, insurance) are buildable on Soroban today.

**Cons.** Requires either (a) Cevolta funding a per-call bounty out of protocol revenue (a direct
cost that scales with subscription volume) or (b) accepting a token/incentive design of its own —
neither is a purely technical decision, but the *requirement* to solve it is a technical
consequence of choosing this alternative; cold-start liveness risk before a keeper market
develops depth (this is exactly the gap SoroTask's insurance module and Nectar's SCF funding are
each independently trying to address in their own domains); all three precedent projects are
testnet-only or unaudited-on-mainnet as of this pass, so there is no production-proven Soroban
keeper marketplace to point to yet.

**Open questions/risks.** Bounty sizing (too low: no keeper shows up; too high: erodes protocol
economics); whether a per-subscription whitelist (SoroTask's model) or fully open execution suits
Cevolta's trust model better; what recourse exists on a missed cycle if no insurance-style
mechanism is built.

## 4. Reflector Subscriptions' condition-triggered model

**What it is.** Reflector Network — Stellar's most credible decentralized oracle
operator — ships a second product beyond price feeds: Reflector Subscriptions, described in
official Stellar docs as a service where *"user-defined customized triggers [are] invoked
automatically once the price change for a specified symbol reaches a certain threshold. When the
condition is met, cluster nodes simultaneously push a notification to the WebHook URL provided in
the subscription and publish an on-chain proof of the triggered event"* (developers.stellar.org,
Oracle Providers page). Its contract, `reflector-network/reflector-subscription-contract`, has
been through three independent security audits by name (Code4rena, Certora, OtterSec) though it
has been dormant since 2025-10-20 with no `codeInUse` mainnet signal.

**What the actual contract does — read directly from source, correcting the prior pass's
framing.** This pass fetched `src/lib.rs` (616 lines) directly from GitHub rather than relying on
the docs' marketing description or directory metadata. Two findings materially change how
directly this precedent applies to Cevolta:

1. **The on-chain trigger surface is a single admin-gated call, not an on-chain multi-node
   consensus mechanism.** `pub fn trigger(e: Env, timestamp: u64, trigger_hash: BytesN<32>)`
   begins with `e.panic_if_not_admin();` and simply emits an event containing the timestamp and a
   hash. The docs' "cluster nodes simultaneously push a notification… and publish an on-chain
   proof" describes real off-chain behavior of Reflector's node cluster, but the on-chain contract
   itself only records that *one* admin-authorized call happened — it contains no code that
   verifies or requires multiple independent node signatures before `trigger()` succeeds. Whether
   the "admin" address is itself a Reflector-node-controlled multisig/threshold account is not
   something the contract reveals; that would need to be verified independently (e.g., by
   inspecting the deployed admin account's signers on mainnet), which is out of scope for a
   source-code read. **The precedent is weaker for "verifiably decentralized on-chain triggering"
   than the docs' prose alone suggests**, and stronger for "off-chain multi-node infrastructure
   feeding a single authorized on-chain call" — which is architecturally closer to alternative 1
   (a centralized/operator-controlled poller) than to alternative 3 (a permissionless market).
2. **The billing model is prepaid-balance and custodial to the contract, not a pull-authorization
   against the subscriber's own wallet.** `create_subscription()` requires the subscriber to
   `deposit()` Reflector tokens into the contract up front; a separate admin-gated `charge()`
   function (structurally the closest analog to Cevolta's `renew()`) iterates a list of
   `subscription_ids`, computes each one's daily retention fee, deducts it from the
   **contract-held balance**, and suspends the subscription once the balance runs out — burning
   the charged tokens. This is a materially different trust model from Cevolta's Policy-Signer
   design: Reflector Subscriptions holds subscriber funds in the contract and debits down a
   balance, whereas Cevolta is explicitly non-custodial (the Subscription Registry "never holds
   an allowance or custody of funds," per `docs/CONTEXT.md`). The `charge()` function's
   batch-processing shape — iterate a list of IDs, compute and deduct what's owed, gracefully catch up on missed
   cycles ("we can charge fees for several days in case there was an interruption in background
   worker charge process") — is a directly reusable *pattern* for a Renewal Trigger's batch design,
   independent of the custody-model difference.

**Pros.** Real, audited, DAO-adjacent infrastructure exists and is proven to be fundable
(three paid audit engagements) for "watch a condition, act automatically" on Soroban; the
`charge()` batch/catch-up pattern is directly reusable design inspiration regardless of custody
model.

**Cons.** Currently dormant, no live mainnet usage signal; the on-chain trigger mechanism is
simpler (single admin call) than the marketing framing implies, so it is not turnkey evidence of
a decentralized triggering primitive at the contract level; its custodial-balance billing model
does not match Cevolta's non-custodial Policy-Signer architecture, so adopting it wholesale would
require a design change, not just a dependency.

**Open questions/risks.** Whether Reflector's admin address is in practice a threshold/multisig
account controlled by the node cluster (unverified from source alone); whether the dormancy
reflects a design dead-end or simply low current demand; what "publish an on-chain proof" means
precisely beyond the `trigger()` event given the contract has no verification logic for the
underlying off-chain condition.

## 5. Merchant-self-interest triggering

**What it is.** The Merchant profits from a successful `renew()` (it is how they get paid), so
the Merchant's own backend could simply be the Renewal Trigger, with no separate keeper
infrastructure, poller, or relayer required at all.

**How it would work for Cevolta.** Each Merchant integrating with Cevolta runs (or has Cevolta's
SDK run inside their existing billing backend) a scheduled job that calls `renew()` for its own
Subscribers when due, submitting directly to Stellar RPC or through a relayer of the Merchant's
choosing.

**No Stellar-ecosystem precedent search was applicable here** — this is a deployment-topology
choice (who operates the trigger process), not a distinct technical mechanism; it can be combined
with alternative 1's or 2's architecture (a poller/relayer), just operated by the Merchant instead
of by Cevolta.

**Trust/liveness trade-offs.**
- **Liveness incentive:** structurally strong — the Merchant directly loses revenue on every
  missed renewal, which is a stronger and more naturally aligned incentive than a
  flat-fee-per-call bounty in alternative 3, and requires no incentive design or token economics
  to bootstrap.
  and requires no incentive design or token economics to bootstrap.
- **Liveness risk:** concentrated per-Merchant rather than protocol-wide — a Merchant with a
  broken or neglected billing job silently stops collecting its own revenue, but this does not
  cascade to other Merchants on Cevolta the way a single shared centralized poller's outage would
  (contrast alternative 1). It does mean Cevolta has as many single points of failure as it has
  Merchants, each independently operated and independently reliable (or not).
- **Trust:** the Merchant gains no spending power it doesn't already have from being the
  authorized recipient in the Policy Signer's rules — a malicious or compromised Merchant backend
  can only ever attempt calls the Policy Signer would already reject (wrong amount, wrong
  recipient, wrong cadence), so this does not weaken Cevolta's core non-custodial security
  property. The only new risk surface is availability/liveness, not fund safety.
- **Operational burden shifts to the Merchant:** every Merchant integrating Cevolta must run and
  maintain scheduling infrastructure themselves (or embed an SDK that does), rather than this
  being centralized in one place Cevolta controls and can monitor/upgrade uniformly. This is a
  meaningfully different integration burden than a "drop in our checkout button" model.

**Open questions/risks.** How Cevolta would detect/alert on a Merchant's trigger going silent
(from the Subscriber's perspective, a missed renewal due to Merchant negligence looks identical
to one due to insufficient Policy Signer balance); whether Cevolta would want to offer this as
one operator option among several rather than the sole mechanism, given the operational-burden
trade-off; whether a Merchant could be incentivized to over-trigger (attempt renewal earlier than
the agreed cadence) — mitigated entirely by the Policy Signer's own cadence rule rejecting
early attempts, not by anything in the trigger layer.

## 6. Client-side / wallet-triggered background execution

**What it is.** The Subscriber's own wallet app periodically checks for and submits its own due
renewals in the background, with no third-party trigger infrastructure at all.

**Search result.** No Stellar-ecosystem precedent for this pattern was found. Searches of the
official wallet/dapp docs (`search_wallet_dapp_docs`, `search_docs` for "background sync service
worker wallet mobile app automatic") surfaced only unrelated material: the Wallet SDK tutorial
series, SEP-24/SEP-30 recovery flows, and MPP's server-side "push mode" (a different concept —
a merchant-side webhook receiver, not a subscriber wallet background job). No Stellar wallet
(Freighter, passkey-kit-based wallets, or otherwise) advertises or documents a background-execution
or service-worker-driven autonomous transaction-submission capability in the corpus searched.

**Reliability trade-offs (reasoned from first principles, since no precedent exists to draw
from).** This is the weakest alternative on pure liveness grounds:
- A **browser-extension wallet** (e.g., Freighter) has no persistent background execution context
  at all outside of when the browser is open and the extension is active — there is no standard
  way for it to "wake up" and submit a transaction on a schedule the user isn't actively present
  for.
- A **mobile wallet app** could in principle use OS-level background task scheduling (iOS
  BGTaskScheduler, Android WorkManager) to periodically check and submit, but this is
  unreliable by OS design: background execution windows are opportunistic, battery- and
  network-dependent, and can be suspended entirely by the OS, by the user force-quitting the app,
  or by the device being off — none of which is under the Subscriber's, the Merchant's, or
  Cevolta's control.
- Because Cevolta's architecture explicitly does not require a fresh Subscriber signature per
  cycle (that is the entire point of the Policy Signer), this alternative would be strictly worse
  than alternatives 1-5 on liveness while gaining nothing on trust (the Policy Signer already
  provides the non-custodial guarantee regardless of who submits the call) — its only structural
  advantage would be requiring zero third-party trigger infrastructure, at the cost of tying
  liveness to whether the Subscriber's specific device happens to be on, online, and running the
  wallet app at the right moment, for every single cycle, for the life of every subscription.

**Open questions/risks.** Whether any hybrid is worth exploring (e.g., wallet-triggered as a
fallback path only, layered under a primary poller/keeper mechanism) rather than as the sole
trigger; this was not evaluated in depth here as it falls outside a pure "client-triggered"
framing and starts to resemble alternative 2's redundancy model with one of the redundant actors
being unreliable by design.

## 7. Existing generalized automation networks (Chainlink Automation, Gelato Network)

**Chainlink Automation.** Fetched directly from Chainlink's own official supported-networks page
(`docs.chain.link/chainlink-automation/overview/supported-networks`). The complete, exhaustive
list of supported networks is: Arbitrum, Avalanche, Base, BNB Chain, Ethereum, Gnosis, OP
(Optimism), Polygon, Scroll, and zkSync — all EVM chains. **Stellar and Soroban do not appear
anywhere on this list.** Separately, a `WebSearch` found that Stellar joined the Chainlink Scale
Program in October 2025 for Chainlink **Data Feeds, Data Streams, and CCIP** — i.e., Chainlink's
oracle/data and cross-chain-messaging products have some Stellar integration story, and Chainlink
Data Streams reports can reportedly be verified inside Soroban contracts — but this is a
completely separate product line from Chainlink Automation, and nothing found in this pass
indicates Automation itself has any Stellar/Soroban support, planned or shipped.

**Gelato Network.** Fetched directly from Gelato's own official docs
(`docs.gelato.cloud/web3-services/web3-functions`, after a redirect from the older
`docs.gelato.network` domain). The page describes Gelato's automation/Web3 Functions product but
lists no specific supported-chains enumeration on that page itself, and a `WebSearch` corroborates
that Gelato's documented chain support is exclusively EVM-compatible chains (Ethereum, Arbitrum,
Optimism, Polygon, BNB Chain, and 100+ other EVM/rollup chains via ERC-4337/7702 smart-wallet
support). **No mention of Stellar or Soroban was found anywhere in Gelato's own documentation or
in web search results about Gelato's chain support.**

**Conclusion for this alternative.** As of this pass, **neither Chainlink Automation nor Gelato
Network has any documented Stellar/Soroban support** — this is not an available alternative today,
confirmed against each vendor's own primary documentation rather than assumed from their
EVM-ecosystem reputation, per the task's explicit instruction.

## 8. CAP-71 and the protocol-level automation/delegation roadmap

This section researches the task's item 5 in depth, since a major fact changed since the prior
research pass: **CAP-71 is no longer a future/proposed item — it has already shipped.**

**Protocol 27 ("Zipper") activated on Stellar mainnet on July 9, 2026**, per SDF's own blog post
("Stellar Zipper, Protocol 27 Upgrade Guide," stellar.org/blog, 2026-06-04) and corroborated by a
dated ecosystem roundup ("Stellar Weekly Roundup — week of Jul 3, 2026," lumenloop.com,
2026-07-10): *"Protocol 27 activated on Stellar mainnet July 9. The Zipper upgrade ships auth
delegation as a first-class smart account feature, combines all signer auth into one entry per
transaction, simplifies simulation, and prevents signature replay."*

**What CAP-71 actually does — read directly from its GitHub-hosted spec
(`stellar/stellar-protocol/blob/master/core/cap-0071.md` and its `cap-0071-01.md` sub-spec).**
CAP-71 is an umbrella covering two related changes:
- **CAP-71-01 (authentication delegation for custom accounts):** adds two host functions,
  `delegate_account_auth(address)` (callable inside a custom account's `__check_auth` to delegate
  authentication to another address, requiring that address to have authorized the identical call
  tree) and `get_delegated_signers_for_current_auth_check()`. This lets a "root" account delegate
  its cryptography/authorization logic to sub-account contracts, reducing transaction size (no
  separate authorization entry with its own nonce per delegated signer) and simplifying
  simulation, versus the pre-existing (protocol 20+) but UX-poor delegation mechanism.
- **CAP-71-02:** introduces `SOROBAN_CREDENTIALS_ADDRESS_V2`, an address-bound credential format
  used by both the delegation mechanism and non-delegated address authorization.

**Critically for this task's question: CAP-71 changes *who/what may authorize* a call, not
*whether calls execute automatically*.** Directly quoting the spec text surfaced in this pass:
delegation still requires "the addresses for which `delegate_account_auth` is called" to be
present in the credentials of a submitted transaction — i.e., **the delegation framework remains
passive**. A wallet, user, or external service must still submit a signed transaction to the
network for anything to happen; nothing about CAP-71 introduces a way for a contract to trigger
its own execution or for an authorization to fire without an external submitter. **This
confirms, on newly-live protocol code rather than a future proposal, that the core premise
underlying Cevolta's entire Renewal Trigger problem is unchanged by the most relevant recent
protocol upgrade.** (A companion example contract, "Delegate Auth," now exists in the official
`soroban-examples` repo demonstrating CAP-71 usage — see `/docs/build/smart-contracts/example-contracts/delegate-auth`.)

**A related but separate CAP is also worth noting for completeness: CAP-72** ("Contract signers
for Stellar accounts") introduces a new class of G-account signer — "delegated signers," usable
only from within the smart contract environment to sign `SorobanAuthorizationEntry` values (not
directly for transaction signing) — stored in the classic `AccountEntry` and manageable via
`SetOptionsOp`. This is a related but distinct primitive from CAP-71's custom-account delegation;
it did not surface anything relevant to scheduled/automatic execution either.

**One more CAP surfaced by a "scheduling" keyword search that turned out to be unrelated:**
**CAP-63 ("Parallelism-friendly Transaction Scheduling")** — despite the name, this is a
consensus/ledger-close-level change to how *already-submitted* transactions are batched into
parallel-executable clusters within one ledger close; it has nothing to do with
application-level scheduled/deferred/time-triggered execution and does not change anything about
the Renewal Trigger problem. Flagged here explicitly so the "scheduling" keyword match is not
mistaken for relevant prior art by a future reader.

**No other in-progress or proposed CAP surfaced across this pass's docs, meeting-notes, and
research-corpus searches that targets scheduled execution, cron, or automation as a protocol-level
primitive.** The meeting-notes search for CAP-71 itself (`search_meeting_notes`) returned only the
2026-04-30 developer-meeting recap already cited above, confirming CAP-71 "has been around for a
while and hasn't changed" prior to its protocol-27 implementation — there is no visible roadmap
item beyond what shipped.

## 9. Hybrid: short-window pre-signed auth delivered in advance

**What it is.** Instead of a persistent Policy Signer contract that auto-approves matching charges
indefinitely, the Subscriber's wallet signs a single short-window `SorobanAuthorizationEntry`
(governed by `signatureExpirationLedger`) a few days before an actual renewal date, and delivers
that pre-signed authorization to the Merchant (e.g., via an API) for the Merchant to submit
whenever convenient within that window.

**The mechanics, confirmed directly from official docs.** The authorization data structure is
`SorobanAddressCredentials { address, nonce, signatureExpirationLedger, signature }`. Per the
docs' own text: *"`signatureExpirationLedger` [is] the ledger sequence number on which the
signature expires. Signature is still considered valid on `signatureExpirationLedger`, but it is
no longer valid on `signatureExpirationLedger + 1`. It is recommended to keep this as small as
viable, as it makes the transaction cheaper."* — confirming the ADR's premise that this window is
conventionally kept short (the prior pass's cited range of roughly 12-60 ledgers, ~1-5 minutes,
is a convention driven by that cost-minimization recommendation, not a protocol-enforced hard
cap — nothing in the spec text itself limits how far in the future a `signatureExpirationLedger`
value could be set, only that doing so costs more and is discouraged).

**What this design would fix.** It removes the need for the Renewal Trigger to interact with a
*live, currently-installed* Policy Signer at the moment of renewal — the authorization is already
fully formed and self-contained days in advance. The Merchant (or anyone holding the pre-signed
entry) only needs to submit it within the validity window; there is no dependency on a
long-lived on-chain policy contract being correctly configured and reachable at renewal time.

**What this design trades away.** This is the load-bearing question the task asked, and the
answer follows directly from removing the persistent Policy Signer: **the Subscriber's wallet
must actively participate — sign something new — before every single cycle**, which is exactly
the UX/liveness burden the Policy Signer pattern (ADR-0001) was built to eliminate ("auto-approves
matching charges without a fresh Subscriber signature each cycle"). Concretely:
- **Lost:** the "fire and forget" property — a Subscriber whose wallet app is closed, whose device
  is off, or who has simply forgotten about the subscription will not have a fresh pre-signed
  authorization ready when the next cycle approaches, silently breaking the "long-running,
  no-re-authorization-needed" subscription model. This reintroduces exactly the liveness problem
  discussed in alternative 6 (client-side triggering), just shifted from "submitting the renewal"
  to "producing the authorization the renewal needs" — a smaller but structurally identical
  dependency on the Subscriber's device/app being active on a schedule.
- **Lost:** revocation simplicity. ADR-0002's cancellation design revokes a single
  Policy Signer inside the Smart Wallet and is immediately consistent with the Subscription
  Registry via one `cancel()` call. In a pre-signed-entry model, a Subscriber who cancels after a
  short-window auth has already been delivered to the Merchant cannot "unsign" that
  already-issued authorization — cancellation would need either to race the delivery/validity
  window, or the Registry's `cancel()` would need an explicit check against a still-valid,
  not-yet-submitted pre-signed entry (a new mechanism ADR-0002 does not currently need, since a
  Policy Signer can simply be deactivated at any time before its next matching charge is even
  attempted).
- **Gained:** removes the requirement that a Policy Signer contract be persistently installed,
  correctly configured, and reachable in the Subscriber's Smart Wallet for the whole subscription
  lifetime — the trust/complexity surface shifts from "a long-lived policy contract must keep
  working correctly" to "a short-lived signature must be freshly produced and delivered on time,
  every cycle." Whether that is a net simplification depends entirely on whether producing and
  delivering a fresh signature every cycle is judged easier to make reliable than keeping a
  Policy Signer contract correctly configured — this pass found no Stellar-ecosystem precedent
  that has actually built and shipped this exact pattern to draw an empirical answer from.

**Search result for precedent.** No project or contract implementing this specific
"advance-delivered short-window pre-signed recurring authorization" pattern was found in this
pass's searches of the docs corpus, meeting notes, or ecosystem/repo directories. It appears to be
a design this pass could only evaluate from first principles against the documented
`signatureExpirationLedger` mechanics, not one with existing Stellar-ecosystem prior art.

**Open questions/risks.** How the Subscriber's wallet would be prompted/reminded to produce the
next signature (this reintroduces a scheduling problem of its own, just on the client side, one
layer removed from the original Renewal Trigger problem); how many cycles of pre-signed entries
could safely be batched/delivered at once to reduce this frequency (trading off against the "keep
`signatureExpirationLedger` small" cost recommendation and the revocation problem above, which
gets worse the more cycles are pre-signed at once); what happens on a missed delivery window
(does the subscription lapse, retry, or fall back to a different mechanism).

## 10. Additional pattern found: MPP Session mode (payment channels) — adjacent, not a direct fit

While searching broadly for "automation," "scheduler," and "recurring execution" per the task's
instruction not to stop at the given list, this pass surfaced Stellar's own **Machine Payments
Protocol (MPP)**, an official first-party pattern (`/docs/build/agentic-payments/mpp`) built for
agent-to-agent payments, not consumer subscriptions — but structurally adjacent enough to note.
Its "Session" intent (formerly "Channel mode") is described as enabling *"high-frequency,
pay-as-you-go payments over unidirectional payment channels. The funder deposits tokens into"* a
channel contract, after which off-chain commitments settle later. This is a genuinely different
mechanism from everything above: rather than solving "who submits a fresh on-chain call each
cycle," it solves "how do we avoid needing an on-chain call for every individual charge at all" by
pre-funding a channel and settling many off-chain-agreed payments against it periodically. It does
not resolve Cevolta's Renewal Trigger problem directly (something must still periodically settle
the channel on-chain, and MPP's own docs frame this for high-frequency micropayments between
machines, not calendar-cadence consumer billing), and it is custodial to the channel contract in
the same way Reflector Subscriptions is (§4) — but it is documented, real, first-party Stellar
infrastructure worth being aware of as a different category of solution to a related problem, not
a Renewal Trigger alternative in the same sense as sections 1-6.

## Comparison table

No ranking or recommendation column — dimensions only, as specified.

| Alternative | Trust assumptions | Liveness guarantees | Build complexity | Cost | Degree of decentralization |
|---|---|---|---|---|---|
| 1. Centralized poller + OZ Relayer | Cevolta-operated process; no spending power beyond what Policy Signer already allows | Single process/host — no guarantee beyond Cevolta's own uptime practices | Low — one component, Relayer absorbs submission/fee mechanics | Relayer fees + Cevolta's own infra cost | None — fully centralized trigger, non-custodial charge authorization unaffected |
| 2. Redundant independent pollers | Same as (1), spread across N operators/hosts | Better than (1) if at least one poller is up; requires contract-level idempotency | Medium — N× infra, plus idempotency logic in the Registry | N× poller infra cost; some wasted-submission cost on races | Low-to-medium, depending on whether all pollers are Cevolta-run or third-party |
| 3. Permissionless keeper marketplace | Keepers are stake/incentive-gated (Nectar, SoroTask) or open (SoroTask empty-whitelist mode); no custody of funds | Depends on market depth/bootstrapping; unproven at Cevolta's scale; SoroTask's insurance module addresses partial-failure, not total absence of keepers | High — bounty/incentive design, potentially staking/slashing, cold-start problem | Per-call bounty cost, scales with subscription volume; no proven production precedent to cost-benchmark against | High, once bootstrapped; low during cold-start |
| 4. Reflector-style condition-triggered oracle model | On-chain: single admin-authorized call (verified from source); off-chain node-cluster composition of that admin key is unverified from the contract alone | Depends entirely on Reflector-style infrastructure being live; the actual contract examined is currently dormant | High — requires operating or depending on an oracle-cluster-grade off-chain system; custodial billing model differs from Cevolta's non-custodial design | Unknown — no live deployment to observe cost from | Contract-level: low (single authorized caller); off-chain: unverified |
| 5. Merchant-self-interest triggering | Merchant has no more spending power than the Policy Signer already grants it; risk is availability, not fund safety | Per-Merchant — one Merchant's outage doesn't cascade, but there are as many single points of failure as Merchants | Low for Cevolta; shifts operational burden to every integrating Merchant | Borne by each Merchant, not centralized in Cevolta | Distributed across Merchants, but each individually centralized |
| 6. Client-side/wallet-triggered | No new trust surface beyond the Policy Signer | Weakest — depends on the Subscriber's specific device being on, online, and running the wallet app at the right moment, every cycle | Low mechanically, but no existing wallet in the corpus searched implements background scheduled submission | No third-party infra cost | Maximally decentralized (each Subscriber is their own trigger), at a direct cost to reliability |
| 7. Chainlink Automation / Gelato | N/A — not usable | N/A | N/A | N/A | Not available: neither has documented Stellar/Soroban support as of this pass |
| 9b. Short-window pre-signed auth delivered in advance | Removes dependency on a persistent Policy Signer contract; adds dependency on timely per-cycle signature production/delivery | Weaker than the Policy Signer model for "fire and forget" — requires the Subscriber's wallet to actively produce a new signature before every cycle | Medium — no persistent policy contract needed, but requires a delivery/reminder mechanism and a harder cancellation-race design | Smaller `signatureExpirationLedger` windows are cheaper per the docs' own guidance; batching multiple cycles trades this off against revocation risk | No ecosystem precedent found to assess in practice |

## Sources

- Stellar developer docs (developers.stellar.org, retrieved 2026-08-25 via `stellarDocs`):
  `/docs/tools/openzeppelin-relayer` (full page walked section-by-section),
  `/docs/learn/fundamentals/contract-development/authorization`,
  `/docs/learn/fundamentals/contract-development/contract-interactions/stellar-transaction`
  (`signatureExpirationLedger` semantics, quoted directly),
  `/docs/build/guides/transactions/signing-soroban-invocations`,
  `/docs/build/smart-contracts/example-contracts/complex-account`,
  `/docs/build/smart-contracts/example-contracts/delegate-auth`,
  `/docs/build/agentic-payments/mpp` and `/docs/build/agentic-payments/mpp/channel-guide`,
  `/docs/build/guides/transactions/fee-bump-transactions`,
  `/docs/data/oracles/oracle-providers`, `/meetings/2026/04/30` (CAP-71 recap)
- Stellar CAP specifications (github.com/stellar/stellar-protocol, retrieved via `stellarDocs`
  research index and direct `WebFetch`): `cap-0071.md` and `cap-0071-01.md` (Authentication
  delegation and address-bound Soroban credentials — quoted directly), `cap-0072.md` (Contract
  signers for Stellar accounts), `cap-0063.md` (Parallelism-friendly Transaction Scheduling —
  confirmed unrelated), `cap-0046.md` (Soroban overview)
- SDF blog: "Stellar Zipper, Protocol 27 Upgrade Guide" (stellar.org/blog, 2026-06-04, quoted
  directly for CAP-71's mainnet activation date)
- Ecosystem/dated news (lumenloop.com, via `lumenloop.search_content_semantic` /
  `scout.searchResearch`): "Stellar Weekly Roundup — week of Jul 3, 2026" (2026-07-10, corroborates
  Protocol 27 mainnet activation)
- GitHub repositories, read directly (`gh api` for README/source content, plus
  `scout.searchRepos`/`scout.explainRepo` for directory metadata and repoScore, all as of
  2026-08-25): `OpenZeppelin/openzeppelin-relayer`, `OpenZeppelin/relayer-plugin-channels`,
  `reflector-network/reflector-subscription-contract` (README and full `src/lib.rs` read
  directly — `trigger()` and `charge()` functions quoted from source),
  `SoroLabs/SoroTask` (README, architecture diagrams, and `contract/src/lib.rs` read directly —
  `register`/`execute`/`whitelist` logic and `create_policy`/`submit_claim`/`settle_claim`
  entry points confirmed from source), `Nectar-Network/nectar` (full README read directly —
  architecture, `KeeperRegistry`/`NectarVault` interfaces, racing/slashing mechanics quoted),
  `soroban-tooling/soroban-keeper-network`, `vowena/sdk` (README read directly — "keeper bot that
  drives on-chain billing" quoted), `stellar/smart-account-kit`, `stellar/passkey-kit`
- Security audits (via `scout.listAudits`): Reflector Subscriptions — Code4rena (2025-11-11),
  Certora (2024-10-09), OtterSec (2024-01-24)
- Chainlink Automation official docs: `docs.chain.link/chainlink-automation/overview/supported-networks`
  (fetched directly, full supported-network list enumerated — Stellar/Soroban absent)
- Gelato Network official docs: `docs.gelato.cloud/web3-services/web3-functions` (fetched
  directly after a redirect from `docs.gelato.network`; corroborated by `WebSearch` that Gelato's
  documented chain support is EVM-only)
- `docs/CONTEXT.md`, `docs/adr/0001-smart-account-kit-for-smart-wallet.md`,
  `docs/adr/0002-cancel-through-subscription-registry.md`,
  `docs/research/0001-renewal-trigger-and-market-viability.md` (internal repo context, not
  re-verified in this pass except where explicitly noted as a correction or update)
