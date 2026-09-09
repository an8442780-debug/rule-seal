# RuleSeal verification

## Release boundary

RuleSeal is deployed on Studionet and its production app is live at `https://rule-seal.vercel.app`. Contract deployment, source parity, validator execution, authoritative readbacks and the OKX wallet production journey are recorded below with their exact revisions.

Candidate canonical LF contract SHA-256: `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`. `.gitattributes` enforces LF so the reviewed Git blob, deployable checkout and future RPC code can be compared as raw bytes. The earlier diagnostic CRLF deployment hash `2AEA0BBA3BF62EB052CD677A7007A1D40C57EB3F6E71585EC44C7B2E5DF8DF4E` is not acceptance provenance.
The acceptance deployment and same-source upgrade both contain exactly those raw LF bytes. Public GitHub revisions are bound by full commit SHA; the final production release will additionally use a RuleSeal-specific annotated tag whose tag-object SHA and commit target are independently recorded after Vercel evidence is complete.

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

Primary-AI browser QA used that bound production build in the Codex in-app Browser. At the default `910x698` viewport, all six workflow tabs selected their intended panel without a runtime alert; `End` moved both selection and focus from the first tab to Auditor Hub. At `360x800`, the page remained within the viewport while the workflow tabs and audit table used their own horizontal scroll regions. Auditor readback returned four cases, one integration and fourteen events. Its topic options now match the contract's emitted event names exactly, the filter is explicitly scoped to the current page, and event badges are neutral rather than misusing a case-outcome color.

The Vercel E2E repair was reproduced in Chrome: an OKX-only browser incorrectly rendered an additional MetaMask row with a generic `M` icon. The corrected local production build rendered exactly one OKX option with its brand image at mobile, tablet and desktop sizes, with no page-width overflow. Automated coverage proves that an OKX provider carrying the compatibility `isMetaMask` flag cannot create or rebind a MetaMask option; a real MetaMask EIP-6963 announcement remains independently selectable.

[Official testing documentation](https://docs.genlayer.com/developers/intelligent-contracts/testing), checked 2026-09-09, distinguishes in-process Direct Mode from network integration.

## Studio verification completed

Deployment, exact raw-byte source parity, schema/upgrader readback, LOCKED, UNRESOLVED, minimum/effective date boundaries, duplicate nonce rollback, retry cooldown rollback, reciprocal successor lineage, predecessor supersession, integration advancement, unauthorized actor rejection, validator disagreement rollback and same-source upgrade state preservation have live evidence in `docs/STUDIONET-EVIDENCE.md`.

The live `NOT_APPLICABLE` attempt failed closed with `INVALID_ASSESSMENT` after `MAJORITY_DISAGREE`; state remained FROZEN. It is explicitly not counted as NOT_APPLICABLE evidence. The original minimum-date case proves both one-hour retry boundaries, three total assessments, and a finalized `MAX_RETRIES_EXCEEDED` rollback with unchanged authoritative state.

## Production release verification

### Presentation release

- Presentation source revision: `ddffeedd50a8c43d722ed5c1d0b20b022061b4d8`; Vercel deployment: `dpl_FRMSeyLDfSb6GBiFtc5v5jZaX3ro`; status: `READY`.
- The delta is limited to the landing guidance and visual stylesheet. Contract, RPC, wallet, journal and transaction code are unchanged.
- Five frontend test files / 106 tests and the exact-environment production build pass. The existing approximately 802 kB chunk warning remains non-blocking.
- Stable production root returns HTTP 200 and a nonexistent route returns HTTP 404. Desktop and 375px browser inspection show the redesigned header, briefing, workflow navigation and workbench surfaces with no page-level horizontal overflow.
- Exact-environment local and deployed assets match byte-for-byte: JavaScript SHA-256 `0F47954199A6A3FD23944861A57CC162A6F7459094E1B3740894FEF921B67A53`; CSS SHA-256 `4A5B7EB37218FD5C68FAFEB08394D9FA8122AC68C185E3C8AA4A9D2A7CE1845F`.
- The previous transaction and readback evidence below remains bound to its tested revision. No transaction was sent or replayed for this presentation-only release.

### Transaction-tested release

- Vercel team/project: `an8442780-debug/rule-seal`; deployment `dpl_Cts9AvhDmPxD63Z8m9Ra9NZySD55`; status `READY`; exact frontend source revision `a61d02dd86b514eb8da47185ffa5a358c174fd11`.
- Stable production URL: `https://rule-seal.vercel.app` returned HTTP 200; a nonexistent route returned HTTP 404.
- Public logo returned HTTP 200 as `image/svg+xml` (6,322 bytes).
- Exact-env local production build and deployed assets match byte-for-byte: JavaScript SHA-256 `D16A408572760411BA2F8EC0100B33D2D2BE4BE4C0CC22BBFABDC79231F8B3C5`; CSS SHA-256 `B30ED5B82971F669D2D58F256678F4111AA5DF57997BC030A3E758269E480888`.
- The deployed bundle contains the exact RuleSeal contract binding. The exact-env build is 800.73 kB JavaScript / 193.20 kB gzip; its documented chunk warning is non-blocking.
- Chrome profile 4 discovered only the installed OKX provider, connected to Studionet, retained real hashes through pending/finality, and completed create → freeze → assess for `REAL-000006`. Authoritative UI/RPC readback is LOCKED with assessment `REAL-000006-A01`, `EDITION_APPLIES`, edition `FAA Order JO 7400.11K`, and exact official-document/source status fields.
- Integration transaction `0xbe79864b0bdcc30749ebbc70953019b6c7a8d4191a811e61cf5f9df1ea64248d` was independently FINALIZED/MAJORITY_AGREE/leader SUCCESS. The frontend's stale `ACTIVE` expectation was corrected to canonical `BOUND_TO_CASE`; exact-release reload reconciliation cleared the journal without a new transaction.
- The first fresh-case attempt retained its finalized failure hash when the browser date control still submitted the existing `2025-10-01` fingerprint. The modal correctly remained open, state did not mutate, and no blind retry occurred. After the date value was visibly verified as `2025-11-01`, one distinct create was submitted and succeeded.
- Success modals auto-closed after the documented brief confirmation and routed to the authoritative record. Failure/reconciliation modals intentionally remained until their explicit close/recovery action so hashes could not be lost.

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
