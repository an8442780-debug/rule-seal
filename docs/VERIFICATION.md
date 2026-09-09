# RuleSeal verification

## Release boundary

RuleSeal has an independent Studionet deployment and anonymous `POST_DEPLOY_TEST` approval for exact evidence revision `6dabaf1998e3776b256a17ba89f94beabe344a35`. The production app is live at `https://rule-seal.vercel.app`; final tag, wallet Vercel E2E and `POST_MILESTONE_REVIEW` remain open. Inherited tags and another application's transactions cannot close RuleSeal gates.

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

Frontend suite: 5 test files / 98 tests passed after the transaction-journal, post-chain-switch identity-bound write/readback, complete wallet-discovery cardinality/session-event coverage and modal-progress repairs. TypeScript and the Vite production build pass; the approximately 801 kB bundle warning remains documented and is not treated as a functional pass.

The production build was also rerun with `VITE_CONTRACT_ADDRESS=0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`; the generated bundle contains that exact acceptance binding. `frontend/.env.example` records the same public, non-secret value for reproducible configuration.

Primary-AI browser QA used that bound production build in the Codex in-app Browser. At the default `910x698` viewport, all six workflow tabs selected their intended panel without a runtime alert; `End` moved both selection and focus from the first tab to Auditor Hub. At `360x800`, the page remained within the viewport while the workflow tabs and audit table used their own horizontal scroll regions. Auditor readback returned four cases, one integration and fourteen events. Its topic options now match the contract's emitted event names exactly, the filter is explicitly scoped to the current page, and event badges are neutral rather than misusing a case-outcome color.

[Official testing documentation](https://docs.genlayer.com/developers/intelligent-contracts/testing), checked 2026-09-09, distinguishes in-process Direct Mode from network integration.

## Studio verification completed

Deployment, exact raw-byte source parity, schema/upgrader readback, LOCKED, UNRESOLVED, minimum/effective date boundaries, duplicate nonce rollback, retry cooldown rollback, reciprocal successor lineage, predecessor supersession, integration advancement, unauthorized actor rejection, validator disagreement rollback and same-source upgrade state preservation have live evidence in `docs/STUDIONET-EVIDENCE.md`.

The live `NOT_APPLICABLE` attempt failed closed with `INVALID_ASSESSMENT` after `MAJORITY_DISAGREE`; state remained FROZEN. It is explicitly not counted as NOT_APPLICABLE evidence. The original minimum-date case proves both one-hour retry boundaries, three total assessments, and a finalized `MAX_RETRIES_EXCEEDED` rollback with unchanged authoritative state.

## Production release verification

- Vercel team/project: `an8442780-debug/rule-seal`; deployment `dpl_AjgS8F2zc1Sz2MCxyxbQ3DMhPnEQ`; status `READY`.
- Stable production URL: `https://rule-seal.vercel.app` returned HTTP 200; a nonexistent route returned HTTP 404.
- Public logo returned HTTP 200 as `image/svg+xml` (6,322 bytes).
- Exact-env local production build and deployed assets match byte-for-byte: JavaScript SHA-256 `677B62BB2D427FF955F3421390F986A20984BA529C6B8CB351364A17E9C4F97D`; CSS SHA-256 `B30ED5B82971F669D2D58F256678F4111AA5DF57997BC030A3E758269E480888`.
- The deployed bundle contains the exact RuleSeal contract binding and no old project name/logo/slug. The exact-env build is 800.73 kB JavaScript / 193.20 kB gzip; its documented chunk warning is non-blocking.
- Public wallet journeys and measured frontend RPC counts remain pending until the user authorizes Vercel E2E.

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

Final package must bind a new exact revision and annotated tag object/target, clean public tree, deployed source/schema, upgrader readback, upgrade rehearsal, complete Studio ledger, Vercel source parity, independent supported-wallet E2E, assets/links and final review. These remain outstanding until verified with RuleSeal evidence.
