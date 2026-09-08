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
STUDIO_FIRST_ACTION_AT: NOT_STARTED
STUDIO_ACCEPTANCE_DEPLOYMENT_AT: NOT_STARTED
STUDIO_E2E_STARTED_AT: NOT_STARTED
STUDIO_CAPABILITY_TOOL_OR_API: Codex in-app Browser browser.capabilities.list() and supported browser/tab API inventory
STUDIO_CAPABILITY_CHECK: Checked for physical request events, performance/request logs, proxy logs, or another exact per-request counter
STUDIO_CAPABILITY_RESULT: Physical request telemetry is not exposed; primary-AI actions, transaction hashes, terminal states, receipts, logs, and authoritative readbacks are observable
STUDIO_PHYSICAL_COUNT_SOURCE: NOT_APPLICABLE
STUDIO_PHYSICAL_COUNT_CLAIM: NONE
STUDIO_REPLAY_FOR_MEASUREMENT: NO

The probe completed before the first observable UI action: opening Studio in the Codex in-app Browser at `2026-09-08T19:01:26.817Z`. Read-only account discovery at `2026-09-08T19:01:33.464Z` found `0x15872d1887b8ff7322F2aa7c3c535f1F00dbb452` at `0 GEN`. The user then operated the faucet; primary-AI readback showed `1,000,000 GEN`. Those setup actions are disclosed but are not acceptance transactions. The canonical `STUDIO_FIRST_ACTION_AT` field denotes the first acceptance deployment/E2E action and, as required by the official PreDeploy audit, remains `NOT_STARTED`; acceptance deployment/E2E counters remain zero.

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

STUDIO_EVIDENCE_STATUS: INCOMPLETE
STUDIO_ACTION_LEDGER_STATUS: NOT_STARTED
STUDIO_PHYSICAL_REQUESTS: NOT_APPLICABLE
STUDIO_ACTIONS: 0
STUDIO_TRANSACTIONS: 0
STUDIO_TRANSACTION_HASHES: []
STUDIO_STATUS_POLL_ATTEMPTS: 0
STUDIO_TERMINAL_RECEIPT_READS: 0
STUDIO_AUTHORITATIVE_READBACKS: 0
STUDIO_RETRIES: 0
STUDIO_DUPLICATE_TRANSACTIONS: 0
STUDIO_MATRIX_VARIANCE: NOT_STARTED

Acceptance evidence is intentionally incomplete at PRE_DEPLOY. Counts above start with the future governance-eligible deployment and exclude the diagnostic transaction and user faucet setup. They are not physical-request counts.

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

FRONTEND_EVIDENCE_STATUS: INCOMPLETE

Automated evidence currently covers in-flight deduplication, 10s cache, invalidation, bounded backoff, abort/cancellation, Strict Mode safety, measured journey metrics, 24-poll ceiling, hidden-tab pause, retained transaction hash, reconciliation and no automatic resubmit. Exact-release measured browser journey counts remain incomplete until Vercel E2E.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---|---:|---:|---|
| Automated regression only | mocked shared/write clients | 0 | asserted | asserted | 24 | 1s/3s | asserted | asserted | 0 | Browser measurement pending |

Release closes only when the exact deployed frontend stays within every journey maximum with no duplicate writes, no provider reacquisition and complete finality/execution/readback evidence.
