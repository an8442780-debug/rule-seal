# RuleSeal RPC Budgets

RPC_BUDGET_REVISION: POST_DEPLOY_TEST_61997
OFFICIAL_DOCS_CHECKED: https://docs.genlayer.com/developers/intelligent-contracts/testing and https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/limitations (2026-09-15)
TARGET_NETWORK: Studio Dev preview
TARGET_CHAIN_ID: 61997
TARGET_RPC: https://studio-dev.genlayer.com/api
FRONTEND_SCOPE: APPLICABLE
FRONTEND_MATRIX_STATUS: COMPLETE
FRONTEND_EVIDENCE_STATUS: INCOMPLETE_UNTIL_VERCEL_E2E
FRONTEND_SOURCE_REVISION: b2f01fcd2193e2712fa0a841a77162942193e84e
FRONTEND_CONTRACT_SOURCE_SHA256: FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4
FRONTEND_TARGET_BINDING: chain 61997 / studioDevnet / https://studio-dev.genlayer.com/api

MULTI_CLIENT_JUSTIFICATION: The shared read client in frontend/src/services/rpcClient.ts is the only client for public reads, caching, deduplication, status polling and authoritative readback. The selected-provider write client in frontend/src/services/contractService.ts is created only from the immutable EIP-1193 provider/account binding. No other frontend module creates a GenLayer client.

The two createClient calls are intentional and exhaustive: the shared read
client owns public reads, status polling, caching, deduplication and
authoritative readback; the selected-provider write client is created per
immutable EIP-1193 provider/account binding. Studio and frontend accounting are
independent. The old Studionet ledger is invalidated and is not carried into
this target release.

## Studio RPC measurement capability probe

STUDIO_CAPABILITY_PROBE_STATUS: COMPLETE_BEFORE_ACCEPTANCE_WRITES
STUDIO_MEASUREMENT_MODE: OBSERVABLE_ACTION_LEDGER
STUDIO_CAPABILITY_PROBE_AT: 2026-09-15T08:30:20.7722088Z
STUDIO_CAPABILITY_PROBE_FINISHED_AT: 2026-09-15T08:30:23.9199840Z
STUDIO_FIRST_ACCEPTANCE_ACTION_AT: 2026-09-15T09:26:40.398Z
STUDIO_CAPABILITY_TOOL_OR_API: E:\Genlayer-Tools\studio-next-toolchain\studio-next.ps1 plus scripts/self-test.mjs; network info, account show and read-only RPC checks
STUDIO_CAPABILITY_CHECK: checked for physical request events, performance or proxy request logs, and an exact per-request counter
STUDIO_CAPABILITY_RESULT: physical request telemetry is unavailable; operation IDs, transaction hashes, terminal states, receipts, logs and authoritative readbacks are observable
STUDIO_PHYSICAL_COUNT_SOURCE: NOT_APPLICABLE
STUDIO_REPLAY_FOR_MEASUREMENT: NO

The first acceptance action is the approved deployment invocation. Diagnostic
preflight records before that time have no acceptance hash and are not counted
as acceptance writes.

## Studio RPC budget matrix

| Operation | Maximum submissions | Polling / timeout | Retry rule | Stop condition | Evidence |
|---|---:|---|---|---|---|
| Account/network check | 2 actions | none | none | actor and chain 61997 verified | probe ledger |
| Schema probe | 1 action | none | 0 | 23 methods or stop | schema output |
| Source readback | 1 read | none | 1 only for explicit 429/5xx after 2s | exact byte hash or stop | code hash |
| Acceptance deployment | 1 submission | 2.5s→10s, max 24 attempts / 5m | no resubmit | FINALIZED or terminal failure | hash, receipt, consensus, code |
| Each lifecycle write | 1 submission | 2.5s→10s, max 24 attempts / 5m | no automatic retry | FINALIZED plus semantic result | hash and pre/post readback |
| Authoritative readback bundle | 3 reads | no polling | 1 transient read retry | expected state or stop | captured readback |

STUDIO_SUBMISSIONS_RECORDED: all fresh 61997 submissions are retained in the
toolchain journals with operation IDs and hashes; pre-broadcast rejections have
no hash and are excluded from submission counts.
STUDIO_PHYSICAL_REQUESTS: NOT_APPLICABLE because the capability probe found no
physical telemetry surface. Status observations and readbacks are not silently
counted as submissions.

Hard stops: wrong network, duplicate write, unknown receipt after 5 minutes,
polling beyond 24 attempts, budget breach, missing semantic result, missing
consensus/finality or missing authoritative readback.

## FRONTEND RPC BUDGET MATRIX

| Journey | Maximum logical calls | Polling / timeout | Retry/cancel | Terminal condition |
|---|---:|---|---|---|
| Bootstrap | 8 | none | two 429/5xx retries | first 10s complete |
| Public lookup | 10 | none | 1s/3s + ≤200ms jitter | requested records displayed |
| Create, freeze, assessment, integration, successor | 30 each | 2.5s→10s, max 24 / 5m | no write retry; abort on hidden/unmount/deadline | finality, success and authoritative readback |
| Reload reconciliation | 12 | existing-hash checks / 30s | never resubmit | retain until authoritative readback |

The shared read client owns the 10-second cache, in-flight deduplication and
bounded transport retry. Hidden tabs pause polling. Semantic failures are never
transport-retried. Logical adapter calls are not claimed to be physical HTTP
requests.

## FRONTEND RPC BUDGET EVIDENCE

FRONTEND_EVIDENCE_STATUS: INCOMPLETE
The matrix and regression evidence are complete for the Studio Dev migration.
Production Vercel logical-call counts, wallet-session telemetry and browser
journey readbacks are intentionally reserved for the later
POST_GITHUB_VERCEL_FINAL E2E gate. No production success is inferred here.

## Target evidence status

STUDIO_EVIDENCE_STATUS: COMPLETE_FOR_POST_DEPLOY_TEST
STUDIO_ACTION_LEDGER_STATUS: COMPLETE_OBSERVABLE_ACTION_LEDGER
STUDIO_FRONTEND_EVIDENCE_STATUS: PENDING_POST_GITHUB_VERCEL_FINAL
STUDIO_DUPLICATE_TRANSACTIONS: 0_AUTOMATIC_WRITE_RETRIES
STUDIO_RETRIES: 0_AUTOMATIC_WRITE_RETRIES

The pre-broadcast malformed/authorization/cooldown rejections and diagnostic
failures are retained as non-submission attempts; no blind resubmit was
performed. Old-network counts are not valid for this release.
