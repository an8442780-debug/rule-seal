# RuleSeal verification

## Release boundary

Implementation is unfinished. No RuleSeal deployment, production release, final tag or live E2E is verified here. Inherited tags and another application's transactions cannot close RuleSeal gates.

Candidate canonical LF contract SHA-256: `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`. `.gitattributes` enforces LF so the reviewed Git blob, deployable checkout and future RPC code can be compared as raw bytes. The earlier diagnostic CRLF deployment hash `2AEA0BBA3BF62EB052CD677A7007A1D40C57EB3F6E71585EC44C7B2E5DF8DF4E` is not acceptance provenance.
This identifies source bytes, not an approved deployment. The worktree is not a final revision.

## Local checks

```powershell
py -3.13 -m pytest -q -p no:cacheprovider
genvm-lint check contracts\rule_seal.py
Set-Location frontend
npm test -- --run
npm run build
```

Contract suite: 26 cases, including three successor outcomes. Six existing unused downstream-web-mock warnings remain disclosed. Record final reruns with exact file hashes; do not treat test counts as complete coverage.

Frontend suite: 5 test files / 98 tests passed after the transaction-journal, post-chain-switch identity-bound write/readback, complete wallet-discovery cardinality/session-event coverage and modal-progress repairs. TypeScript and the Vite production build pass; the approximately 801 kB bundle warning remains documented and is not treated as a functional pass.

[Official testing documentation](https://docs.genlayer.com/developers/intelligent-contracts/testing), checked 2026-09-09, distinguishes in-process Direct Mode from network integration.

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

Prove grammar/date boundaries, nonce/fingerprint guards, retry cooldown/cap, source identity/dates, malformed/missing/conflicting evidence, validator disagreement, serialization, schema/runtime and meaningful-state upgrade preservation.

Frontend must verify all six workflows, exact provider routing, session consistency, passive chooser, finality/execution/readback, journal reconciliation, numeric RPC budgets, focus/keyboard/contrast, reduced motion and mobile/desktop rendering. Existing unit tests do not close unexercised paths.

Validator rejection does not itself mark a case UNRESOLVED. Only an accepted assessment with that outcome produces that transition. Inspect receipt and state independently.

Final package must bind a new exact revision and annotated tag object/target, clean public tree, deployed source/schema, upgrader readback, upgrade rehearsal, complete Studio ledger, Vercel source parity, independent supported-wallet E2E, assets/links and final review. These remain outstanding until verified with RuleSeal evidence.
