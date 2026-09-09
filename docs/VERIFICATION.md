# RuleSeal verification

## Release boundary

RuleSeal is deployed on Studionet and its production app is live at `https://rule-seal.vercel.app`. Contract deployment, source parity, validator execution, authoritative readbacks and the OKX wallet production journey are recorded below with their exact revisions.

Canonical LF contract SHA-256: `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`. `.gitattributes` enforces LF so the committed source and deployed code can be compared as raw bytes.
The acceptance deployment and same-source upgrade both contain exactly those raw LF bytes. Public GitHub revisions are bound by full commit SHA, annotated release tag, tag-object SHA and commit target.

## Local checks

```powershell
py -3.13 -m pytest -q -p no:cacheprovider
genvm-lint lint contracts\rule_seal.py
genvm-lint validate contracts\rule_seal.py
Set-Location frontend
npm test -- --run
npm run build
```

Contract suite baseline: 26 cases, including three successor outcomes. Six existing unused downstream-web-mock warnings remain disclosed. Final rerun results are recorded with the post-deployment evidence revision.

Frontend suite: 5 test files / 106 tests passed after the transaction-journal, post-chain-switch identity-bound write/readback, complete wallet-discovery cardinality/session-event coverage, modal-progress repairs, Vercel E2E wallet-cardinality correction and canonical integration-state reconciliation regression. A successful modal remains visible briefly, then closes automatically and routes to the authoritative updated case. Failed or uncertain transactions remain visible with their hash and a manual recovery/close action. TypeScript and the Vite production build pass; the approximately 802 kB bundle warning remains documented and is not treated as a functional pass.

The production build was also rerun with `VITE_CONTRACT_ADDRESS=0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`; the generated bundle contains that exact acceptance binding. `frontend/.env.example` records the same public, non-secret value for reproducible configuration.

Browser QA used the bound production build. At desktop and mobile viewports, all six workflow tabs selected their intended panel without a runtime alert; keyboard navigation moved selection and focus correctly, and the workflow tabs and audit table used their own horizontal scroll regions without page-level overflow. Auditor readback displayed the recorded cases, integration and event history with the contract's event names.

Wallet QA confirmed that an OKX-only browser renders exactly one OKX option with its brand image at mobile, tablet and desktop sizes, with no page-width overflow. Automated coverage proves that provider compatibility flags cannot create or rebind an unrelated wallet option; valid EIP-6963 announcements remain independently selectable.

[Official testing documentation](https://docs.genlayer.com/developers/intelligent-contracts/testing), checked 2026-09-09, distinguishes in-process Direct Mode from network integration.

## Studio verification completed

Deployment, exact raw-byte source parity, schema/upgrader readback, LOCKED, UNRESOLVED, minimum/effective date boundaries, duplicate nonce rollback, retry cooldown rollback, reciprocal successor lineage, predecessor supersession, integration advancement, unauthorized actor rejection, validator disagreement rollback and same-source upgrade state preservation have live evidence in `docs/STUDIONET-EVIDENCE.md`.

The live `NOT_APPLICABLE` attempt failed closed with `INVALID_ASSESSMENT` after `MAJORITY_DISAGREE`; state remained FROZEN. It is explicitly not counted as NOT_APPLICABLE evidence. The original minimum-date case proves both one-hour retry boundaries, three total assessments, and a finalized `MAX_RETRIES_EXCEEDED` rollback with unchanged authoritative state.

## Production release verification

### Production release

- Presentation source revision: `2064672ac43677944cdc4786d7b7e93a409036d5`; Vercel deployment: `dpl_9tyGAJA5FueuVf3diCtwp5XRoPjE`; status: `READY`.
- The delta is limited to the landing guidance and visual stylesheet. Contract, RPC, wallet, journal and transaction code are unchanged.
- Five frontend test files / 106 tests and the exact-environment production build pass. The existing approximately 802 kB chunk warning remains non-blocking.
- Stable production root returns HTTP 200 and a nonexistent route returns HTTP 404. Desktop and 375px browser inspection show the redesigned header, briefing, workflow navigation and workbench surfaces with no page-level horizontal overflow.
- Exact-environment local and deployed assets match byte-for-byte: JavaScript SHA-256 `0F47954199A6A3FD23944861A57CC162A6F7459094E1B3740894FEF921B67A53`; CSS SHA-256 `4A5B7EB37218FD5C68FAFEB08394D9FA8122AC68C185E3C8AA4A9D2A7CE1845F`.
- The public Explorer logo is an opaque 1024×1024 RGB PNG, 435,535 bytes, rendered from the committed RuleSeal SVG source and available at `https://rule-seal.vercel.app/rule-seal-logo.png`.

## Corrected acceptance matrix

| Behavior | Required automated assertion and live readback |
|---|---|
| Unauthorized successor | Reject; no case/assessment/integration/event mutation |
| Create successor | Reciprocal lineage, successor DRAFT, predecessor remains terminal |
| Freeze successor | FROZEN; predecessor unchanged; integration rejected |
| Unresolved successor | UNRESOLVED; predecessor unchanged; integration rejected |
| Conclusive successor | LOCKED or NOT_APPLICABLE; predecessor SUPERSEDED_BY_SUCCESSOR |
| Non-locked binding | Reject DRAFT/FROZEN/UNRESOLVED/NOT_APPLICABLE targets |
| Same-case rebind | Still-LOCKED target; no record, timestamp, counter or event changes |
| Namespace identity | Whitespace trimmed; identical namespaces isolated across callers |
| Invalid namespace/unrelated replacement | Exact guard rejection; no mutation |
| Explicit advancement | No automatic advancement; declared LOCKED successor only; previous_case_id retained |
| Caller isolation | Advancing one caller leaves the other's binding unchanged |

Automated tests: test_successor_creation_and_lifecycle (three outcomes) and test_integration_binding_and_advancement. Public snapshots cover case, assessment, integration and event records. They do not prove live rollback or every hidden index. Each live write still needs its own finalized receipt, execution result and authoritative before/after readback.

## Remaining release verification

Local regression must remain green for grammar/date boundaries, nonce/fingerprint guards, retry cooldown/cap, source identity/dates, malformed/missing/conflicting evidence, validator disagreement, serialization and schema/runtime. Live evidence above supplements rather than replaces those tests.

Frontend must verify all six workflows, exact provider routing, session consistency, passive chooser, finality/execution/readback, journal reconciliation, numeric RPC budgets, focus/keyboard/contrast, reduced motion and mobile/desktop rendering. Existing unit tests do not close unexercised paths.

Validator rejection does not itself mark a case UNRESOLVED. Only an accepted assessment with that outcome produces that transition. Inspect receipt and state independently.

The release record binds an exact revision and annotated tag object/target, clean public tree, deployed source/schema, upgrader readback, source-preserving rehearsal, complete Studio ledger, Vercel source parity, supported-wallet evidence and verified public assets and links.
