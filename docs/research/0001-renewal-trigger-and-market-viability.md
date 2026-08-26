# Research: renewal-trigger design and non-custodial-subscriptions viability on Stellar

Independent second-opinion pass, run against primary sources via the stellar-raven MCP gateway
(`stellarDocs` = official developers.stellar.org docs; `scout` = live ecosystem/repo/audit
directory; `lumenloop` = community/editorial/SCF corpus) on 2026-08-25. This stress-tests the
conclusions of a prior research pass rather than restating them. Every claim below is sourced;
where I disagree with or want to add nuance to the prior pass, it's called out explicitly under
**Disagreements / additions**.

## 1. The renewal-trigger problem

### 1.1 Launchtube → OpenZeppelin Relayer: confirmed, with one nuance

The prior pass's claim is correct and is stated almost verbatim in the official docs:

> "Launchtube, which served as an experimental service for fee sponsorship and contract
> invocations, has been instrumental in early-stage deployments and developer experimentation.
> However, while functional for testing and early use cases, Launchtube does not have the
> maturity, scalability and auditing as OpenZeppelin's Relayer service, which is why the Stellar
> Development Foundation is discontinuing the Launchtube service and provides the Relayer service
> as a replacement."
> Source: [developers.stellar.org/docs/tools/openzeppelin-relayer](https://developers.stellar.org/docs/tools/openzeppelin-relayer)

OpenZeppelin Relayer is also branded "Stellar Channels Service" in the same docs, with a live
status page at `status.channels.openzeppelin.com`, an SDK (`@openzeppelin/relayer-plugin-channels`),
and worked examples for both smart-contract invocation and plain account transfers.

**Nuance the prior pass didn't surface:** repo-level evidence shows a maturity split inside
"OpenZeppelin Relayer" itself.
- `OpenZeppelin/openzeppelin-relayer` (the core, chain-agnostic relayer product): repoScore 53,
  147 stars, actively committed (last commit 2026-08-20). This is genuinely mature, multi-chain
  infrastructure.
- `OpenZeppelin/relayer-plugin-channels` (the Stellar-specific integration the docs above actually
  walk you through): repoScore 21 ("low" tier), 4 stars, last commit 2026-04-03.

So "audited and mature" is true of the underlying OSS relayer engine, but the Stellar-facing glue
code is comparatively new and thin. Worth treating as a dependency to watch, not a settled given.
(Source: `scout.searchRepos` q="openzeppelin relayer".)

### 1.2 The custom-account / policy-signer pattern: confirmed as the documented Soroban idiom

Official docs confirm the mechanics ADR-0001 relies on:
- `CustomAccountInterface` + `__check_auth` is the documented way to build a Soroban contract
  account ([Authorization docs](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization#contract-account)).
- The canonical `Complex Account` example contract in `soroban-examples` (tag v23.0.0) implements
  exactly this: ed25519 multisig plus a per-token spend-limit policy enforced inside
  `verify_authorization_policy`, and its "Further Reading" footer explicitly points to a
  **"Delegate Auth" example that "extends this example with CAP-71 auth delegation to registered
  delegate signers"**. In other words, CAP-71 ("Authentication delegation and address-bound Soroban
  credentials", targeting protocol 27) is the underlying protocol feature that makes
  delegated/policy signers a first-class concept, not just an app-level convention.
- A separate official tutorial ("Using `__check_auth` in interesting ways: Tutorial 1: time based
  restriction on token transfers") confirms the ADR's load-bearing claim: time-based rules in a
  custom account **gate or expire** an authorization, they do not cause the contract to act on its
  own. There is no Soroban-native cron/scheduler primitive anywhere in the docs corpus I could
  find (`stellarDocs.search_docs` for "scheduled transaction cron trigger automation" surfaces
  only unrelated hits: RPC ingestion filters, fee-bump resubmission, Reflector's own trigger
  service below). **This is the strongest confirmation in this pass: the "someone external must
  call renew()" premise holds up.**

I could not independently verify that "external policy contracts" is itself an official, named
Stellar term (I didn't find that exact phrase in the docs corpus). Treat it as ADR-0001's own
descriptive label for the pattern above, not a documented API name. This doesn't change the
architecture's validity, just a terminology caveat.

`stellar/smart-account-kit` is confirmed real, active, and distinct from `stellar/passkey-kit`:
repoScore 80 vs 58, both last-committed 2026-08-19, smart-account-kit's own description is
"TypeScript SDK for OpenZeppelin Stellar smart accounts with passkeys, multi-signers,
**authorization policies**, and fee-sponsored transactions", matching ADR-0001's rationale.
(Source: `scout.searchRepos`.)

### 1.3 Reflector: a more interesting precedent than "just an oracle quorum" (disagreement with the prior pass)

The prior pass used Reflector purely as the "consensus, not redundancy" contrast case (oracle
nodes must agree on a *value*). That's true for price feeds, but it undersells what Reflector
actually ships. Official docs describe a second, directly relevant product:

> "**Reflector Subscriptions** provide a service for user-defined customized triggers invoked
> automatically once the price change for a specified symbol reaches a certain threshold. When the
> condition is met, cluster nodes simultaneously push a notification to the WebHook URL provided in
> the subscription and publish an on-chain proof of the triggered event."
> Source: [developers.stellar.org/docs/data/oracles/oracle-providers#reflector-network](https://developers.stellar.org/docs/data/oracles/oracle-providers#reflector-network)

There is a real, separately-deployed `reflector-network/reflector-subscription-contract` repo
("Soroban smart contract for subscriptions management"), dormant since 2025-10-20, repoScore 54,
no `codeInUse` signal (i.e., not detected as actively invoked on mainnet right now), but it has
been through **three independent security audits** that explicitly cover it by name: Code4rena
(Nov 2025, 1 high + 5 medium finding), Certora (Oct 2024), and OtterSec (Jan 2024, 6 findings)
(source: `scout.listAudits`, `scout.searchResearch`).

**Why this matters for Cevolta:** Reflector already runs a live, audited, DAO-governed node
cluster whose job is literally "watch for a condition and trigger an action automatically,
independent of any single caller." It's condition-triggered (price threshold) rather than
time-triggered (renewal date), and it pushes a webhook + on-chain proof rather than directly
calling an arbitrary third-party contract's `renew()`, so it isn't a drop-in Renewal Trigger.
But it's real evidence that Stellar's most credible decentralized-infrastructure team has already
built and shipped (and paid three auditors to review) a generalized "automatic trigger" primitive
on top of their quorum. That's a stronger existence proof for "decentralized triggering is
buildable and fundable on Stellar" than the prior pass's framing suggested, and it's worth
studying reflector-subscription-contract's design even though it's dormant. I'd treat this as the
single most underused piece of prior art the earlier pass missed.

### 1.4 Keeper networks: soroban-keeper-network is the weakest of three, not the state of the art (disagreement with the prior pass)

The prior pass cited `soroban-tooling/soroban-keeper-network` as *the* ecosystem precedent for
"redundant, unprivileged keepers." Confirmed details: repoScore 21, active (commit 2026-08-03),
1 star, **85 open issues**, no SCF funding, no mainnet contract on record. That characterization
("small, unaudited, no mainnet") is accurate, but it's also the least developed of three
comparable projects I found that the prior pass didn't surface:

| Repo | repoScore | Activity | Notes |
|---|---|---|---|
| `soroban-tooling/soroban-keeper-network` | 21 | active, 85 open issues | generic keeper marketplace; no SCF; no mainnet |
| `SoroLabs/SoroTask` | 39 | active, **444 commits in 90 days**, tests present | keeper marketplace *purpose-built* for "recurring things like yield harvesting, auto-drip... hard [without keepers]". It has an on-chain insurance/bounty mechanism for keeper failure (`create_policy`/`submit_claim`/`settle_claim`), VRF-randomized keeper assignment, batch/portfolio task execution, guardian-based emergency pause. No SCF funding, no mainnet contract id yet (testnet demo at soro-task.vercel.app), but architecturally the most sophisticated of the three by far. |
| `Nectar-Network/nectar` | 69 | active | "Keeper Infrastructure for Soroban: Multi-operator liquidation network for **Blend Protocol** [a live, audited, major Soroban lending market]. Distributed across competing keepers. No single point of failure." SCF-funded. |

(Sources: `scout.searchRepos` q="keeper network soroban" / "SoroTask" / "Nectar-Network".)

Nectar in particular is a materially better validation of the prior pass's "redundancy, not
consensus" argument than what it cited: it's SCF-funded, live-adjacent competing-keeper
infrastructure already serving a real, audited, mainnet DeFi protocol (Blend) for the structurally
identical problem (liquidations also need "someone, anyone, calls this function before a
deadline"). If Cevolta wants an existence proof that unprivileged competitive keepers work in the
Stellar/Soroban ecosystem today, Nectar-for-Blend is the citation, not soroban-keeper-network.
SoroTask is the one to actually borrow a design from (its insurance/bounty economics solve "what
happens when the keeper market itself fails", a gap in Cevolta's current "redundancy is enough"
framing, since redundancy alone doesn't answer who eats a fee if literally zero keepers show up).

**Bottom line on 1.4:** the prior pass's "redundancy not consensus" framing survives, but it was
backed by the weakest of three available data points. I'd upgrade the future-work citation from
soroban-keeper-network to Nectar Network (validation) + SoroTask (design reference), and note
Reflector Subscriptions (1.3) as a third, audited-but-dormant data point for a different (threshold,
not time) trigger shape.

## 2. Competitive landscape

### 2.1 Named "subscription protocol" competitors: mixed verification results (partial disagreement)

| Project | Found? | Detail |
|---|---|---|
| **Subs** | Yes, in ecosystem directory. SCF round 30, **$139,480** (matches prior pass). France-based, category "Developer Tooling." `mainnet.tokens: []`, `mainnet.audits: []` in the directory record. | Confirmed real. |
| **Vowena** | Not in the lumenloop ecosystem directory (no substring match, and the semantic fallback returned unrelated wallets, not a real match). **Does** exist as a GitHub repo: `vowena/sdk`, "TypeScript SDK for the Vowena subscription billing protocol on Stellar." repoScore 33, 1 star, "maintained," last commit 2026-04-22, **not SCF-funded**, not directory-listed. | Real but tiny/unlisted; supports "no traction," doesn't fully support treating it as a peer competitor. |
| **Subfy** | **Not found anywhere**: zero hits in the ecosystem directory (semantic fallback returned only generic subscription-adjacent noise, similarity ≤0.42), and `scout.searchRepos` for "subfy" returned zero repos. | **I could not verify Subfy exists as a real Stellar project at all.** This is a disagreement worth flagging plainly: the prior pass named it alongside Subs/Vowena as a "zero-mainnet-contracts attempt," but I found no primary-source trace of it whatsoever. Either it's extremely obscure/unindexed, or it shouldn't be cited with the same confidence as Subs/Vowena. |

Cross-checked against `scout.listContracts`, the **evidence-gated registry of verified mainnet
Soroban contracts** (only entries where a scanner echo-verified a contract id live on-chain, or
weekly on-chain enrichment attributed real usage): querying `domain: "payments-x402"` returns
**zero rows**, and querying `q: "subscription"` also returns **zero rows**, across the whole
directory, not just these three projects. This is stronger, independently-sourced corroboration of
the prior pass's "zero verified mainnet contracts" claim than the prior pass itself had. It's not
just true of Subs/Vowena/Subfy, it's true of the entire "subscription" and "x402 payments" search
space in Stellar's most rigorous contract registry as of 2026-08-25.

### 2.2 REAPP: real, but smaller and earlier-stage than described (disagreement with the prior pass)

Confirmed on the ecosystem directory: "REAPP (Real Agentic Payment Protocol)... composes x402 HTTP
settlement, Soroban policy enforcement, and AP2 mandate authorization into a single TypeScript
SDK." **SCF award is $42,000 (round 43), not $70,000** as the prior pass stated. This looks like
a factual error worth correcting. [**Correction, 2026-08-26**: this was itself wrong. A direct
`scout.searchProjects` query returned an official-record, high-confidence (0.9) figure of
**$70,000** (round 43, "Build" award type, source: `communityfund.stellar.org`). The original
number was right.] Its GitHub repo is `mks044/reapp-poc`. The `-poc` suffix and
`based_in: null` (no team/location on record) both suggest proof-of-concept stage rather than "a
real team [with a] live testnet demo" as characterized. It has no verified mainnet contract in
`scout.listContracts`. I'd still agree it's the closest architectural cousin in *shape* (on-chain
policy mandate authorizing agent-initiated payments). I'd just soften "real team" to "small,
early, SCF-seeded team."

### 2.3 Broader streaming/recurring-payments landscape found, not in the prior pass

Directory search surfaced several additional Soroban streaming/recurring-payment projects the
prior pass didn't cite, all small: **SStream** ("composable streaming payments on Soroban," SCF
round 16, $36,000), **Zentra** ("payment streaming app... to make payments over a fixed period of
time," Nigeria-based, SCF round 23, $18,200), **Fluxity** ("precision-crafted token streaming
platform" for businesses), and **Drips** (an EVM-native open-source continuous-funding/streaming
protocol that extended to Stellar as "Drips Wave", a recurring monthly OSS-bounty cycle). None of
these carry an audit on record (`scout.listAudits` for "drips" returns zero matches out of 58 total
audit reports indexed), and none is a general-purpose *subscriber-authorized consumer billing*
product. They're closer to payment-streaming or bounty-distribution tooling. This reinforces
rather than undercuts the prior pass's core competitive claim: no live Stellar project matches
Cevolta's exact shape, but the near-miss set is a bit larger and even less mature than described.

**Vibrant**, as named by the prior pass, doesn't appear as its own directory entry. The closest
match is **Vesseo**, whose own description literally opens "Vibrant is a digital wallet that
enables users to buy, sell, store, send, and receive USDC", almost certainly the same product
under a rebrand the directory hasn't fully normalized. Treat "Vibrant" and "Vesseo" as the same
project going forward. **Superfluid** has no Stellar-ecosystem presence at all (searching for it
returns only the unrelated Soroban streaming projects above by semantic fallback), confirming
it's purely a cross-chain (EVM) reference point, not a Stellar competitor, as the prior pass
implied.

## 3. Business viability: is non-custodial recurring billing a real niche on Stellar?

### 3.1 Payments is the single most crowded vertical on Stellar, not a gap

`scout.analyzeEcosystem({dimension: "gaps"})`, a supply-side census of the active project
directory (909 projects) by fine-grained type, shows **"Payments" is the largest single vertical
on Stellar by count: 252 projects (241 live), 138 of them SCF-funded.** That's larger than DEX
(45), Lending (29), Stablecoin (41), or AI (48) combined. The tool's own "underbuilt" signal
lists only **Faucet** as underbuilt; nothing is flagged "absent." This matters: Cevolta isn't
entering an empty category. It's entering the most saturated one. The actual whitespace, per the
evidence in §2, is the narrow sub-vertical of "non-custodial, policy-mandated, subscriber-signed
recurring billing," not "payments" broadly. That's a meaningfully different and much smaller claim
than "Stellar has a payments gap," and worth stating precisely rather than leaning on the
category-level crowdedness score (which is 10/10, maximally crowded, for "User-Facing App" and
"Infrastructure" clusters alike).

### 3.2 Where SCF money and real usage actually concentrate: cross-border/remittance, hard (this supports the prior pass's hypothesis, with better evidence)

Every well-funded, real-traction consumer-payments example that surfaced across every search in
this pass is a cross-border/remittance/on-off-ramp story, not a domestic subscription-billing one:

- **Beans** (non-custodial wallet, MoneyGram cash off-ramp in 185+ countries): SCF total
  **$490,160** across 4 rounds, more than Subs and REAPP combined.
- **Decaf** (non-custodial Solana+Stellar wallet, on/off-ramps across ~200 countries).
- The "Anchor" cluster (crowdedness 7, $1.3M SCF) is dominated by named regional cross-border
  players: Cash Abroad (LatAm), Honey Coin (Africa, 18+ markets), MYKOBO (Europe/EURC), VERSO
  (Peru, regulator-compliant).
- Fresh 2026 ecosystem news (`lumenloop.search_content_semantic`, dated): **MoneyGram launched
  MGUSD on Stellar for 60M+ customers** (Weekly Roundup, 2026-06-05); a retrospective on
  **Bitso's five-year Stellar partnership** evolving "from solving a specific remittance-corridor
  cost problem in 2021 to native USDC integration... in 2026" (2026-06-12); and third-party
  analysis stating "stablecoin adoption in Latin America is structural, not speculative... driven
  by currency instability" (rain.xyz, undated but 2026-indexed) and that stablecoin rails settle
  cross-border remittances "at 1-2% vs 6%+ with traditional rails" (Crossmint, 2026-06-16, EU
  remittance context).

This is materially stronger, better-dated evidence for the prior pass's cross-border/underbanked
hypothesis than the prior pass itself cited (Beans/Decaf/Vibrant were named without funding or
usage figures). I'd treat this as **confirmed and strengthened**, not just plausible.

### 3.3 Agent-to-agent (x402) is real momentum but zero verified on-chain footprint yet (nuance, not outright disagreement)

x402 is genuinely live on Stellar per SDF's own blog ("x402 on Stellar: unlocking payments for the
new agent economy," stellar.org/blog, 2026-03-10) and has real institutional backing: the **Linux
Foundation launched the x402 Foundation in July 2026** with 40 member organizations and an AWS
board chair (Linux Foundation press release + CoinDesk, both 2026-07). OpenZeppelin even ships a
dedicated `relayer-plugin-x402-facilitator` (repoScore 74). That's real momentum. But as noted in
§2.1, `scout.listContracts` shows **zero verified mainnet contracts** tagged `payments-x402`
anywhere in the ecosystem as of this pass. The two facts aren't necessarily contradictory (x402 is
an HTTP-layer standard that can settle over existing payment rails without needing a novel,
separately-verified Soroban contract per integration), but it means "x402 is live" is a protocol-
and-narrative claim right now, not yet a mainnet-contract-evidence claim. Treat agent-to-agent
payments as a fast-moving, well-funded, narratively strong vertical that is still pre-verification
by the ecosystem's own strictest on-chain-evidence bar.

### 3.4 My bottom-line verdict (independent of the prior pass)

I agree with the prior pass's directional conclusion but for a more specific reason than it gave.
The prior pass framed the risk as "TradFi rails already solve consumer subscription billing well,
so blockchain should aim where TradFi doesn't reach." That's true but slightly beside the point:
the sharper finding from this pass is that **Stellar's own ecosystem has already revealed, through
its own funding and usage patterns, exactly where it thinks payments infrastructure is worth
building**, and it is overwhelmingly cross-border settlement and remittance corridors (Beans,
Decaf, MoneyGram/MGUSD, Bitso, the whole Anchor cluster), not domestic recurring billing. Every
dollar of real SCF money and every dated 2026 ecosystem headline in this pass points there, not at
subscriptions. Meanwhile every subscription-shaped attempt found (Subs, Vowena, Subfy, SStream,
Zentra) is small, unaudited, and has zero verified mainnet footprint, which is a *supply*-side
signal (nobody has shipped this seriously) as much as a *demand*-side one, so it's genuinely
ambiguous whether that's "no demand" or "no one's tried hard enough yet."

Given that ambiguity, the most defensible framing for Cevolta is not "generic Stellar subscription
protocol" but a **specific, cross-border-flavored subscription niche**: e.g. a Latin American or
African subscriber paying a foreign/SaaS/streaming merchant recurringly in a stablecoin, where the
non-custodial + borderless properties (no card network, no FX intermediary re-authorizing monthly,
survives a subscriber losing access to a local bank) are the actual differentiator over Stripe/
Fintoc, not "recurring billing" as a category in isolation. That's a narrower, more defensible bet
than the prior pass's framing, and it's the one piece of synthesis in this document that goes
beyond simply re-confirming or correcting individual facts.

## 4. Summary of disagreements with the prior pass

1. **Reflector Subscriptions** (audited, DAO-run, condition-triggered webhook+on-chain-proof
   mechanism) is a much more relevant, and much more overlooked, precedent than the prior pass's
   "consensus not redundancy" framing credited it for. Worth studying directly, even though its
   own contract is currently dormant.
2. **soroban-keeper-network was the weakest of three available keeper-network precedents.**
   Nectar Network (SCF-funded, serving live Blend Protocol liquidations) is the stronger validation
   citation; SoroLabs/SoroTask (444 commits/90d, has bounty/insurance economics for keeper failure)
   is the stronger design reference.
3. **REAPP's SCF award is $70,000** (round 43, official record, see the correction note in
   §2.1; an earlier pass in this document incorrectly said $42,000), and its repo name
   (`reapp-poc`) and missing team/location fields still suggest proof-of-concept stage, not "a
   real team with a live testnet demo."
4. **Subfy could not be verified to exist** anywhere in the Stellar ecosystem via directory search
   or repo search. It shouldn't be cited with the same confidence as Subs or Vowena without a
   direct source.
5. `scout.listContracts` independently corroborates (and generalizes) the "zero verified mainnet
   contracts" claim: it's true of the entire `subscription` and `payments-x402` query space, not
   just the three named projects.
6. **Payments is Stellar's single most crowded vertical (252 projects)**, not a gap. The real
   whitespace is the narrow sub-niche only, a distinction the prior pass's framing blurred.
7. The business-viability hypothesis (cross-border > domestic billing) is **more strongly evidenced
   than the prior pass established**. Dated 2026 funding and news data (Beans $490K SCF, MoneyGram
   MGUSD, Bitso partnership retrospective) make this closer to a confirmed pattern than a
   hypothesis, and sharpen the recommended positioning to a specific cross-border subscription
   niche rather than generic "subscriptions on Stellar."

## Sources

- Stellar developer docs: `/docs/tools/openzeppelin-relayer`, `/docs/data/oracles/oracle-providers`,
  `/docs/learn/fundamentals/contract-development/authorization`,
  `/docs/build/smart-contracts/example-contracts/complex-account`,
  `/docs/build/guides/auth/check-auth-tutorials`, `/docs/tools/openzeppelin-contracts`
  (developers.stellar.org, all retrieved 2026-08-25 via `stellarDocs`)
- Audit reports (stellarsecurityportal.com, via `scout.listAudits` / `scout.searchResearch`):
  Reflector: Code4rena (2025-11-11), Certora (2024-10-09), OtterSec (2024-01-24)
- GitHub repos (via `scout.searchRepos`, scores/activity as of 2026-08-25): `stellar/smart-account-kit`,
  `stellar/passkey-kit`, `OpenZeppelin/openzeppelin-relayer`, `OpenZeppelin/relayer-plugin-channels`,
  `OpenZeppelin/relayer-plugin-x402-facilitator`, `reflector-network/reflector-subscription-contract`,
  `soroban-tooling/soroban-keeper-network`, `SoroLabs/SoroTask`, `Nectar-Network/nectar`,
  `blend-capital/blend-contracts`, `vowena/sdk`
- Ecosystem directory + funding (via `lumenloop.get_project` / `scout.analyzeEcosystem` /
  `scout.getClusters` / `scout.listContracts`): Subs, REAPP, Reflector, Beans, Decaf, Vesseo,
  SStream, Zentra, Drips project records; ecosystem-wide gaps/funding/cluster rollups
- Ecosystem news/commentary (via `lumenloop.search_content_semantic`, dated): stellar.org/blog
  "x402 on Stellar" (2026-03-10); Linux Foundation x402 Foundation launch press release
  (2026-07-14); CoinDesk x402 Foundation coverage (2026-07-16); Stellar Weekly Roundups
  (2026-06-05, 2026-07-17); "Five Years of Bitso and Stellar" (2026-06-12); rain.xyz "State of
  stablecoins in Latin America"; Crossmint "Five Stablecoin Trends Every EU Remittance Company
  Needs to Get In Front of in 2026" (2026-06-16)
