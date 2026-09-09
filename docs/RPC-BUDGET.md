# RuleSeal RPC Budget

RPC_BUDGET_REVISION: EXACT_HEAD_BOUND_BY_PRE_DEPLOY_PACKAGE
OFFICIAL_DOCS_CHECKED: https://docs.genlayer.com/developers/intelligent-contracts/testing and https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/limitations checked 2026-09-09
STUDIO_SCOPE: APPLICABLE
FRONTEND_SCOPE: APPLICABLE

Studio and frontend accounting are independent. Neither evidence set substitutes for the other.

## STUDIO RPC MEASUREMENT CAPABILITY PROBE

STUDIO_CAPABILITY_PROBE_STATUS: COMPLETE
STUDIO_MEASUREMENT_MODE: OBSERVABLE_ACTION_LEDGER
STUDIO_MEASUREMENT_TIMING: PRE_E2E
STUDIO_CAPABILITY_PROBE_AT: 2026-09-08T19:01:07.931Z
STUDIO_FIRST_OBSERVABLE_UI_ACTION_AT: 2026-09-08T19:01:26.817Z
STUDIO_FIRST_ACTION_AT: 2026-09-08T19:50:03.128817Z
STUDIO_ACCEPTANCE_DEPLOYMENT_AT: 2026-09-08T19:50:03.128817Z
STUDIO_E2E_STARTED_AT: 2026-09-08T19:56:03.604279Z
STUDIO_CAPABILITY_TOOL_OR_API: Codex in-app Browser browser.capabilities.list() and supported browser/tab API inventory
STUDIO_CAPABILITY_CHECK: Checked for physical request events, performance/request logs, proxy logs, or another exact per-request counter
STUDIO_CAPABILITY_RESULT: Physical request telemetry is not exposed; primary-AI actions, transaction hashes, terminal states, receipts, logs, and authoritative readbacks are observable
STUDIO_PHYSICAL_COUNT_SOURCE: NOT_APPLICABLE
STUDIO_PHYSICAL_COUNT_CLAIM: NONE
STUDIO_REPLAY_FOR_MEASUREMENT: NO

The probe completed before the first observable UI action: opening Studio in the Codex in-app Browser at `2026-09-08T19:01:26.817Z`. Read-only account discovery at `2026-09-08T19:01:33.464Z` found the locked account at `0 GEN`; the user operated the faucet and primary-AI readback showed `1,000,000 GEN`. Acceptance deployment began at `19:50:03Z`, and lifecycle E2E began at `19:56:03Z`.

## STUDIO RPC BUDGET MATRIX

STUDIO_MATRIX_STATUS: COMPLETE

| Operation/case | RPC method or Studio action | Trigger | Planned maximum | Poll interval / attempts | Retry/cooldown | Terminal condition | Transaction count | Evidence |
|---|---|---|---:|---|---|---|---:|---|
| Account/network check | Studio account and Studionet UI | once before deployment | 2 actions | none | none | locked funded account visible | 0 | action ledger |
| Schema probe | Studio source load/schema | exact reviewed bytes | 1 action | none | 0 | 23 methods visible or stop | 0 | Studio schema UI |
| Source readback | current code RPC/readback | after deployment | 1 read | none | 1 only on explicit 429/5xx after 2s | raw-byte hash matches or stop | 0 | code hash record |
| Acceptance deployment | Deploy exact reviewed LF source | PRE_DEPLOY approval | 1 submission | 2.5s to 10s / max 24 over 5m | no resubmit | FINALIZED or terminal failure/timeout | 1 | hash, receipt, consensus, readback |
| Each unique lifecycle write | named Studio method | required matrix row | 1 submission | 2.5s to 10s / max 24 over 5m | no automatic retry | FINALIZED plus semantic success or expected rejection | 1 | hash and pre/post readback |
| Authoritative verification | view methods | after each terminal write | 3 reads | none | 0 | expected state/value or stop | 0 | captured readback |
| Per-case verification bundle | receipt, consensus, readbacks | terminal boundary | 12 reads/actions | none | 1 transient retry | complete evidence or stop | 0 | evidence row |

Hard stops: wrong account/network, duplicate write, unknown receipt after 5 minutes, retry beyond the row, budget breach, missing semantic result, missing consensus/finality, or missing authoritative readback. The earlier out-of-order deployment is permanently `RETROSPECTIVE_DIAGNOSTIC` and excluded from all acceptance rows.

## STUDIO RPC BUDGET EVIDENCE

STUDIO_EVIDENCE_STATUS: COMPLETE
STUDIO_ACTION_LEDGER_STATUS: COMPLETE
STUDIO_PHYSICAL_REQUESTS: NOT_APPLICABLE
STUDIO_ACTIONS: 156
STUDIO_TRANSACTIONS: 25
STUDIO_TRANSACTION_HASHES: 25 listed in docs/STUDIONET-EVIDENCE.md
STUDIO_STATUS_POLL_ATTEMPTS: 69
STUDIO_TERMINAL_RECEIPT_READS: 25
STUDIO_AUTHORITATIVE_READBACKS: 37
STUDIO_RETRIES: 0
STUDIO_DUPLICATE_TRANSACTIONS: 0
STUDIO_MATRIX_VARIANCE: NOT_APPLICABLE live label not established; one bounded attempt failed closed after three validator rotations; both premature retry attempts were retained as cooldown rollbacks; the two eligible reservations, third assessment, and cap rollback were completed on the original case

These are observable action-ledger counts, not physical network-request counts. `STUDIO_ACTIONS` is the auditable aggregate of the four recorded ledgers: `STUDIO_TRANSACTIONS` (25 submissions) + `STUDIO_STATUS_POLL_ATTEMPTS` (69 bounded observations) + `STUDIO_TERMINAL_RECEIPT_READS` (25) + `STUDIO_AUTHORITATIVE_READBACKS` (37) = 156. It excludes passive rendering and UI navigation. All attempted writes, including semantic errors, are retained. No blind resubmission occurred.

## FRONTEND RPC BUDGET MATRIX

FRONTEND_MATRIX_STATUS: COMPLETE
MULTI_CLIENT_JUSTIFICATION: One shared read client owns cache, deduplication and bounded retry; a separate write client is created only from the exact selected EIP-1193 provider and active account so an ambient provider cannot replace the signing boundary.

| Screen/workflow | Request source | RPC method | Trigger | Cache key / TTL | In-flight dedupe | Invalidation | Poll interval / attempts | Retry/backoff/cancel | Planned maximum | Transaction count | Terminal/readback condition |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Initial bootstrap | shared read client | configured bootstrap reads | first mount | method+args+contract / 10s | identical reads join | deployment/config change | none | two 429/5xx retries; abort on invalidation | 8 | 0 | first 10s complete |
| Public lookup | shared read client | case and assessment views | explicit lookup | method+args+contract / 10s | identical reads join | related write | none | 1s/3s plus jitter; cancel on invalidation | 10 | 0 | requested records displayed |
| Create case | selected-provider write plus shared readback | create_case and case views | explicit submit | reads / 10s | one active operation | case methods after write | 2.5s-10s / 24 | no write retry; hidden/unmount/deadline abort | 30 | 1 | finalized success and identity readback |
| Freeze case | selected-provider write plus shared readback | freeze_case and case view | explicit submit | reads / 10s | one active operation | case method after write | 2.5s-10s / 24 | no write retry; bounded teardown | 30 | 1 | FROZEN readback |
| Assessment | selected-provider write plus shared readback | assess_case and assessment views | explicit submit | reads / 10s | one active operation | case/assessment after write | 2.5s-10s / 24 | no write retry; bounded teardown | 30 | 1 | finality, execution and assessment readback |
| Integration | selected-provider write plus shared readback | activate_integration and integration view | explicit submit | reads / 10s | one active operation | integration after write | 2.5s-10s / 24 | no write retry; bounded teardown | 30 | 1 | scoped integration readback |
| Successor | selected-provider write plus shared readback | create_successor and case views | explicit submit | reads / 10s | one active operation | predecessor/successor after write | 2.5s-10s / 24 | no write retry; bounded teardown | 30 | 1 | reciprocal lineage readback |
| Reload reconciliation | shared read client | transaction and method-specific views | pending journal load | operation identity / no stale success cache | one reconciler | terminal cleanup only | bounded existing-hash checks | never resubmit; abort after 30s | 12 | 0 | retain until authoritative readback |

Read retries apply only to explicit HTTP 429/5xx and use 1s/3s plus at most 200ms jitter. Hidden tabs pause polling. Semantic failures are not transport-retried.

## FRONTEND RPC BUDGET EVIDENCE

FRONTEND_EVIDENCE_STATUS: COMPLETE

Automated evidence covers in-flight deduplication, 10s cache, invalidation, bounded backoff, abort/cancellation, Strict Mode safety, measured journey metrics, 24-poll ceiling, hidden-tab pause, retained transaction hash, reconciliation and no automatic resubmit. Chrome profile 4 then measured the exact frontend source revision `a61d02dd86b514eb8da47185ffa5a358c174fd11` at production deployment `dpl_Cts9AvhDmPxD63Z8m9Ra9NZySD55`.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---|---:|---:|---|
| Existing-hash integration reconciliation | transaction status plus `get_integration` | 7 logical calls: public lookup 6, integration readback 1 | cold misses; no stale-success cache | one reconciler | 0 new polls after terminal status was independently known | 0 | terminal cleanup only | 1 | 0 | PASS; canonical `BOUND_TO_CASE`; pending journal became `[]`; no resubmit |
| Exact-release create/freeze/assess journey | transaction polling plus case/assessment views | 73 cumulative logical calls before browser recovery: public lookup 28, integration 3, auditor 2, transaction poll 33, case detail 7 | safe 10s cache active; consequential readbacks bypassed | single-flight writes | 33 across four terminal transactions; each write stayed below 24 | 0 | case/assessment/integration/event methods after writes | 7 recorded case/readback calls plus final replacement-tab case and assessment reads | 4 | PASS with disclosed negative row below; successful case `REAL-000006` reached DRAFT, FROZEN, then LOCKED |
| Duplicate-fingerprint negative | `create_case` | included in cumulative row | no cache used for guard | one write only | 8 | 0 | none after terminal failure | 0 | 1 | Expected finalized execution failure; submitted date remained `2025-10-01`; no state mutation and no blind retry |
| Corrected fresh create | `create_case` plus `get_case_by_nonce` | included in cumulative row | authoritative miss | one write only | 8 | 0 | case/event indexes | 1 | 1 | FINALIZED/SUCCESS; `REAL-000006`, date `2025-11-01`, DRAFT |
| Freeze | `freeze_case` plus `get_case` | included in cumulative row | authoritative miss | one write only | 8 | 0 | case/events | 1 | 1 | FINALIZED/SUCCESS; FROZEN readback; success modal auto-closed |
| Assessment | `assess_case` plus case/assessment reads | included in cumulative row | authoritative misses | one write only | 9 | 0 | case/assessment/events | 3 | 1 | FINALIZED/MAJORITY_AGREE/leader SUCCESS; LOCKED and assessment readback |
| Replacement-tab public verification | public case and assessment views | 9 logical calls: public lookup 7, case detail 1, assessment 1 | cold misses | identical reads joined | 0 | 0 | none | 2 | 0 | PASS after browser-control recovery; visible LOCKED result and official evidence |

Logical-call evidence is the application-owned local aggregate, not a claim about physical browser transport events. There were zero 429/5xx retries, zero automatic write retries and zero duplicate submissions. The four writes comprise one retained fail-closed negative and three distinct successful lifecycle writes. Each individual journey stayed within its numeric matrix maximum.

Release closes only when the exact deployed frontend stays within every journey maximum with no duplicate writes, no provider reacquisition and complete finality/execution/readback evidence. This exact release satisfies that condition.
