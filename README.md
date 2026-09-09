# RuleSeal

Source-bound regulatory edition assessment with GenLayer.

RuleSeal freezes an activity date and regulatory reference, then asks independent validators to assess which FAA Order JO 7400.11 edition official records support. It is an evidence-navigation and audit tool, not legal advice or compliance certification.

## Development status

RuleSeal is deployed on Studionet with a public production application. Its contract source, deployment, validator results, authoritative readbacks, wallet journeys and release assets are recorded in the verification documents.

Verified links: [Live app](https://rule-seal.vercel.app) · [Studionet contract](https://explorer-studio.genlayer.com/address/0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb) · [Deployment transaction](https://explorer-studio.genlayer.com/tx/0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106) · [Studio evidence](docs/STUDIONET-EVIDENCE.md)

## Trust problem

An owner, resolver or frontend must not be able to substitute an edition, effective date, official document identity or assessment result. RuleSeal derives bounded official eCFR and Federal Register endpoints inside the contract, has validators refetch them independently, compares every consequential field, and stores the consensus result and evidence fingerprint on-chain.

## How it works

1. Owner creates a case for Title 14, Part 71, section 71.1 and freezes its inputs.
2. Resolver requests assessment. The Intelligent Contract retrieves official eCFR/Federal Register evidence; validators independently evaluate and compare consequential fields.
3. Integrator explicitly binds a caller-scoped checklist namespace to a LOCKED case.
4. Auditor reads cases, authority records, assessments, events and lineage. Public reads do not require a wallet after deployment.

## Lifecycle

```text
DRAFT --owner freeze--> FROZEN --assessment--> LOCKED | NOT_APPLICABLE | UNRESOLVED
UNRESOLVED --eligible retry reservation--> FROZEN
```

Only the owner of a LOCKED or NOT_APPLICABLE case may create its successor for a different date. Creation links both records and creates a DRAFT; it does not supersede the predecessor.

The predecessor becomes SUPERSEDED_BY_SUCCESSOR only when the successor reaches LOCKED or NOT_APPLICABLE. DRAFT, FROZEN and UNRESOLVED successors leave the predecessor's terminal state intact.

Integration accepts only LOCKED targets. Rebinding the same caller/trimmed namespace to the same still-locked case is a no-op. Advancement requires the currently bound case's declared successor, also LOCKED. Supersession alone never advances an integration.

## Why GenLayer

Assessment executes in the Intelligent Contract, not a frontend model or trusted backend. The custom validator independently refetches evidence and compares outcome, edition, dates, fingerprint, reason, authority documents and source statuses. Deterministic state changes follow consensus.

An agreed unavailable-source result may be recorded as UNRESOLVED. Consensus disagreement is different: rejection does not itself establish that state transition. Inspect execution and readback.

## Transaction lifecycle

Writes use only the wallet provider and account explicitly selected after chain validation. The frontend journals the intent before signing, preserves the submitted hash, polls with a bounded backoff until `FINALIZED`, then requires semantic `SUCCESS` and a method-specific authoritative readback before clearing the journal. User rejection, rollback, timeout, unknown execution and failed readback never become optimistic success or automatic resubmission.

## Architecture and local checks

- `contracts/rule_seal.py`: source acquisition, assessment, state, lineage, integrations and upgrade authority.
- `frontend/`: React/TypeScript/Vite with six workbenches, injected-wallet selection, shared RPC reads and pending-write journal.
- `tests/contract/` and `tests/fixtures/`: Direct Mode contract/source tests.
- `frontend/src/tests/`: wallet, RPC, journal, service and component checks.

Use the existing configured Python 3.13/GenLayer environment and a Node version compatible with the locked Vite dependency.

```powershell
py -3.13 -m pytest -q -p no:cacheprovider
genvm-lint lint contracts\rule_seal.py
genvm-lint validate contracts\rule_seal.py
Set-Location frontend
npm test -- --run
npm run build
npm run dev
```

Without `VITE_CONTRACT_ADDRESS` the app is unconfigured. For RuleSeal builds, set it to the verified Studionet address `0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`. Never place secrets or another project's contract address in the frontend.

## Evidence and limits

See [Verification](docs/VERIFICATION.md), [Deployment](docs/DEPLOYMENT.md), [Studio evidence](docs/STUDIONET-EVIDENCE.md) and [Recovery](docs/RECOVERY.md).

Scope is section 71.1, FAA Order JO 7400.11 and activity dates 2000-01-01 through 2035-12-31. There are three total assessments, not three retries after an initial attempt; retry reservation requires a one-hour cooldown. New nonces cannot bypass duplicate fingerprints.

Browser journals are local metadata, not canonical state. Studionet state/account availability is not guaranteed and upgrade authority is privileged. Local PASS does not prove live finality, source parity, wallet E2E, accessibility or release readiness.

## Security boundaries

- Official-source URLs and stored document identities are derived and validated by the contract; model-proposed identifiers are not trusted.
- The wallet chooser passively discovers only allowlisted MetaMask, OKX Wallet and Rabby providers and requests accounts only after an explicit provider choice.
- MetaMask requires its own EIP-6963 announcement: another wallet's `isMetaMask` compatibility flag does not create a MetaMask option. Identified, unambiguous OKX/Rabby legacy providers remain supported. Options are deduplicated and retain their exact provider object. Missing or failed provider icons use local official brand images.
- Storage failure blocks writes; pending records cannot be manually deleted before receipt reconciliation and authoritative readback.
- The Root Slot upgrader is privileged. A source-changing upgrade requires separate review, source/layout verification and state-preservation evidence.
