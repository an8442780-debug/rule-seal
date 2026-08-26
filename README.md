# Regulatory Edition Applicability Lock

An evidence-bound GenLayer application that determines and immutably records which FAA Order JO 7400.11 edition official sources indicate for a Title 14 CFR § 71.1 activity date.

## Verified links

- Studionet contract: `0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae`
- [Studionet Explorer](https://explorer-studio.genlayer.com/address/0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae)
- [Live application](https://regulatory-edition-applicability-lo.vercel.app)

## Trust problem

A case owner, resolver, or downstream checklist integrator should not be able to choose a convenient regulatory edition by assertion. Historical eCFR text, Federal Register identity, effective dates, and successor lineage can be misread or selectively presented. The application freezes the case inputs first, then delegates the consequential evidence assessment to independent GenLayer validators.

This prototype is an evidence-navigation and audit tool. It is not legal advice, a compliance certification, or proof that a rule applies to a particular regulated entity.

## Why GenLayer is essential

The decisive operation runs inside the Intelligent Contract. Validators independently retrieve the dated official eCFR section and bounded Federal Register evidence, derive the edition and effective interval, and compare every consequential field before consensus can change on-chain state. A successful assessment moves a frozen case to `LOCKED` or another terminal outcome, stores source-bound authority records, and enables downstream integration binding. Removing GenLayer web access, validator execution, or consensus removes the trusted decision mechanism rather than merely removing a UI feature.

## How it works

1. **Case owner:** creates a case for the allowlisted Title 14, Part 71, § 71.1 designation family and freezes its immutable inputs.
2. **Resolver:** requests assessment. GenLayer validators independently fetch official sources and reach substantive consensus on the applicable edition and evidence record.
3. **Integrator:** binds a checklist namespace to a terminal case and can later advance it to a locked successor while preserving the previous case ID.
4. **Auditor/public user:** looks up cases, assessments, authority documents, source statuses, events, lineage, and integration state directly from Studionet.

## Architecture

- `contracts/regulatory_edition_applicability_lock.py` is the source of truth for case state, assessment consensus, authority evidence, lineage, integration bindings, authorization, replay protection, and upgrade authority.
- `frontend/` is a static React 19, TypeScript, and Vite client. It discovers only supported injected wallets, submits writes through the selected provider, and reads authoritative state through one shared Studionet RPC client.
- `tests/contract/` and `tests/fixtures/` exercise deterministic guards, official-source parsing, fail-closed evidence handling, consensus equality, retries, lineage, integrations, and upgrade behavior.
- No backend decides outcomes or stores canonical case state. Browser storage contains only restart-safe pending-operation metadata.

## Intelligent Contract

The lifecycle is:

```text
DRAFT --freeze_case--> FROZEN --assess_case--> LOCKED | NOT_APPLICABLE | UNRESOLVED
                                      UNRESOLVED --retry_unresolved--> FROZEN
LOCKED | NOT_APPLICABLE --create_successor--> SUPERSEDED_BY_SUCCESSOR + successor DRAFT
```

Key methods include `create_case`, `freeze_case`, `assess_case`, `retry_unresolved`, `create_successor`, and `activate_integration`. Storage values are extracted to deterministic primitives before nondeterministic execution. Each validator refetches official evidence and requires substantive equality across the outcome, designation, edition, effective interval, eCFR date/fingerprint, reason code, exact authority documents, and source statuses. The contract is Root Slot upgradable by the locked Studio account recorded in [the deployment manifest](docs/DEPLOYMENT.md).

## Transaction lifecycle

The frontend separates wallet signing, broadcast, consensus, finality, execution, and readback:

1. It probes durable browser storage and creates a restart-safe pre-sign intent.
2. It writes through the exact EIP-1193 provider selected by the user.
3. `ACCEPTED` remains pending; polling continues with bounded backoff and pauses while the tab is hidden.
4. Success requires `FINALIZED` plus `FINISHED_WITH_RETURN`.
5. The relevant authoritative contract readback must succeed before the journal entry is removed.
6. Finalized execution errors fail closed. Ambiguous or interrupted writes remain available for bounded reload reconciliation and cannot be manually discarded as if they never existed.

## Run locally

Prerequisites: Python 3.13 with the recorded GenLayer Direct Mode test environment, Node.js 20+, and npm.

```powershell
py -3.13 -m pytest -q -p no:cacheprovider

Set-Location frontend
npm ci
$env:VITE_CONTRACT_ADDRESS='0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae'
npm run dev
```

The frontend uses Studionet chain ID `61999` and RPC `https://studio.genlayer.com/api`. No private key or Studio wallet is required by the web application.

## Tests and verification

Current verified results:

- Contract Direct Mode: 24 passed; six documented fail-fast unused-mock warnings.
- GenVM lint: three checks passed; semantic validation passed for 23 public methods.
- Frontend Vitest: five files, 37 tests passed.
- TypeScript and Vite production build: passed; the documented approximately 772 KB bundle warning remains non-blocking.
- Studionet: exact-source deployment and 18-transaction live evidence ledger independently approved at `POST_DEPLOY_TEST`.

```powershell
py -3.13 -m pytest -q -p no:cacheprovider
genvm-lint check contracts\regulatory_edition_applicability_lock.py

Set-Location frontend
npm test
npm run build
```

See [Verification](docs/VERIFICATION.md) and [Studionet Evidence](docs/STUDIONET-EVIDENCE.md) for the matrices and transaction hashes.

## Deployment

- Network: GenLayer Studionet, chain ID `61999`
- Primary contract: `0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae`
- Deployment transaction: `0xd0589df3c0ccfacd875895362d61028b6a678381b6a94caac40dd8861464d695`
- Deployed source commit: `b4aff7156b03dc040eb298290f276057cce47359`
- Source SHA-256: `E6466FDED2D1FF2195E4710AB78FD35DEFFF1F51EF97953B791853BE7E284B23`
- Deployed-code parity: `gen_getContractCode` returned 33,345 bytes hashing to the exact source SHA-256.

The isolated same-code upgrade rehearsal preserved source parity, upgrader authority, and zero-case state. A distinct unauthorized actor's upgrade finalized with `UPGRADE_NOT_AUTHORIZED` and no mutation. Recovery and account-loss limits are documented in [Deployment](docs/DEPLOYMENT.md) and [Recovery](docs/RECOVERY.md).

## Security and trust boundaries

- Only MetaMask, OKX Wallet, and Rabby EIP-6963 announcements with allowlisted RDNS identities appear in the chooser; opening it never requests accounts.
- Deterministic grammar, date bounds, fingerprints, authorization, nonces, cooldowns, and retry caps run before nondeterministic evaluation.
- Validators fetch official eCFR and Federal Register endpoints independently. Missing, malformed, ambiguous, mismatched, rate-limited, or unavailable evidence cannot authorize a conclusive lock.
- Federal Register identifiers, docket membership, publication dates, and authority URLs are derived from exact official payloads rather than model-proposed metadata.
- Shared RPC caching, in-flight deduplication, bounded retry, hidden-tab polling pauses, volatile write locks, and persistent journals limit call storms and duplicate writes without weakening finality checks.
- Root Slot upgrades remain recoverable only while the recorded Studio upgrader account and Studionet state remain available.

## Known limitations

- Scope is deliberately limited to Title 14 CFR Part 71, § 71.1 and the FAA Order JO 7400.11 designation family for dates from `2000-01-01` through `2035-12-31`.
- Official upstream availability and validator consensus can produce `UNRESOLVED`; retries are limited to three with a one-hour cooldown.
- Browser journals are local to the origin and browser profile; authoritative recovery always depends on the transaction hash and Studionet readback.
- Studionet is a test network. Its state, addresses, and upgrade authority can be lost if the network or Studio account is reset.
- The production release and independent OKX-wallet E2E are verified; final completion remains blocked only on the mandatory exact-revision dual review and submission evidence gate.
