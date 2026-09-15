# RuleSeal RPC Budgets

RPC_BUDGET_REVISION: TARGET_61997_PRE_DEPLOY
OFFICIAL_DOCS_CHECKED: https://docs.genlayer.com/developers/intelligent-contracts/testing and https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/limitations (2026-09-15)
TARGET_NETWORK: Studio Dev preview
TARGET_CHAIN_ID: 61997
TARGET_RPC: https://studio-dev.genlayer.com/api
FRONTEND_SCOPE: APPLICABLE
FRONTEND_MATRIX_STATUS: COMPLETE
FRONTEND_EVIDENCE_STATUS: INCOMPLETE
FRONTEND_SOURCE_REVISION: b2f01fcd2193e2712fa0a841a77162942193e84e
FRONTEND_CONTRACT_SOURCE_SHA256: FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4
FRONTEND_TARGET_BINDING: chain 61997 / studioDevnet / https://studio-dev.genlayer.com/api

MULTI_CLIENT_JUSTIFICATION: The two createClient calls are intentional and exhaustive. The singleton shared read client in frontend/src/services/rpcClient.ts is the only client for public reads, status polling, caching, deduplication and authoritative readback. The selected-provider write client in frontend/src/services/contractService.ts is created per immutable EIP-1193 provider/account binding so writes cannot use the shared read transport or ambient window provider. No other frontend module creates a GenLayer client; the separation prevents a write from bypassing exact wallet identity validation.

Studio and frontend accounting are independent. Neither evidence set
substitutes for the other. The old Studionet ledger is invalidated and is not
carried into this target release.

## Studio RPC measurement capability probe

STUDIO_CAPABILITY_PROBE_STATUS: COMPLETE_BEFORE_ACCEPTANCE_WRITES
STUDIO_MEASUREMENT_MODE: OBSERVABLE_ACTION_LEDGER
STUDIO_CAPABILITY_PROBE_AT: 2026-09-15T08:30:20.7722088Z
STUDIO_CAPABILITY_PROBE_FINISHED_AT: 2026-09-15T08:30:23.9199840Z
STUDIO_FIRST_ACCEPTANCE_ACTION_AT: NOT_STARTED
STUDIO_CAPABILITY_TOOL_OR_API: E:\Genlayer-Tools\studio-next-toolchain\studio-next.ps1 plus scripts/self-test.mjs; network info, account show and read-only RPC checks
STUDIO_CAPABILITY_CHECK: checked for physical request events, performance or
proxy request logs, and an exact per-request counter
STUDIO_CAPABILITY_RESULT: physical request telemetry is unavailable; operation
IDs, transaction hashes, terminal states, receipts, logs and authoritative
readbacks are observable
STUDIO_PHYSICAL_COUNT_SOURCE: NOT_APPLICABLE
STUDIO_REPLAY_FOR_MEASUREMENT: NO

No deployment or lifecycle write is allowed until this probe is recorded with
its exact timestamp, tool/API, checks, result and first-action timestamp.

## Studio RPC budget matrix

| Operation | Trigger | Maximum | Polling / timeout | Retry rule | Stop condition | Evidence |
|---|---|---:|---|---|---|---|
| Account/network check | once before deployment | 2 actions | none | none | actor7, chain61997, funded and accessible | probe ledger |
| Schema probe | exact reviewed bytes | 1 action | none | 0 | 23 methods or stop | schema output |
| Source readback | after deployment | 1 read | none | 1 only for explicit 429/5xx after 2s | exact byte hash or stop | code hash |
| Acceptance deployment | approved exact source | 1 submission | 2.5s→10s, max 24 attempts / 5m | no resubmit | FINALIZED or terminal failure | hash, receipt, consensus, code |
| Each lifecycle write | named method | 1 submission | 2.5s→10s, max 24 attempts / 5m | no automatic retry | FINALIZED + semantic result | hash and pre/post readback |
| Authoritative readback bundle | after terminal write | 3 reads | no polling | 1 transient read retry | expected state or stop | captured readback |
| Per-case receipt/evidence bundle | terminal write | 12 observable actions | no polling beyond row | 1 transient retry | complete or stop | ledger row |

Hard stops: wrong network, duplicate write, unknown receipt after 5 minutes,
polling beyond 24 attempts, budget breach, missing semantic result, missing
consensus/finality or missing authoritative readback.

## FRONTEND RPC BUDGET MATRIX

| Journey | Request source | Maximum logical calls | Polling / timeout | Retry/cancel | Terminal condition |
|---|---|---:|---|---|---|
| Bootstrap | shared read client | 8 | none | two 429/5xx retries | first 10s complete |
| Public lookup | shared read client | 10 | none | 1s/3s + ≤200ms jitter | requested records displayed |
| Create case | selected-provider write + readback | 30 | 2.5s→10s, max 24 / 5m | no write retry; abort on hidden/unmount/deadline | finality, success, identity readback |
| Freeze case | selected-provider write + readback | 30 | 2.5s→10s, max 24 / 5m | no write retry; bounded teardown | FROZEN readback |
| Assessment | selected-provider write + readback | 30 | 2.5s→10s, max 24 / 5m | no write retry; bounded teardown | semantic result and assessment readback |
| Integration | selected-provider write + readback | 30 | 2.5s→10s, max 24 / 5m | no write retry; bounded teardown | scoped integration readback |
| Successor | selected-provider write + readback | 30 | 2.5s→10s, max 24 / 5m | no write retry; bounded teardown | reciprocal lineage readback |
| Reload reconciliation | shared read client | 12 | bounded existing-hash checks / 30s | never resubmit | retain until authoritative readback |

The shared read client owns 10-second cache, in-flight deduplication and
bounded transport retry. The write client is created only from the exact
selected EIP-1193 provider and current account. Hidden tabs pause polling.
Semantic failures are never transport-retried.

## FRONTEND RPC BUDGET EVIDENCE

This implementation-stage artifact is bound to the exact source revision and
Studio Dev target above. The matrix is complete and finite, but release
measurement is intentionally incomplete before the fresh 61997 deployment and
production Vercel E2E. At that later gate, each listed journey will record the
actual logical adapter-call count, request source and method, cache hit/miss,
in-flight deduplication, invalidation, retry count/delay, polling attempts,
authoritative readback and transaction count. Logical adapter calls are not
claimed to be physical HTTP requests; physical telemetry remains unavailable
unless the runtime exposes it. No transaction or frontend production journey
has been counted for this migration yet.

## Target evidence status

STUDIO_EVIDENCE_STATUS: NOT_STARTED_FOR_61997
STUDIO_ACTION_LEDGER_STATUS: READY_NOT_STARTED
STUDIO_PHYSICAL_REQUESTS: NOT_APPLICABLE
STUDIO_TRANSACTIONS: 0
STUDIO_STATUS_POLL_ATTEMPTS: 0
STUDIO_TERMINAL_RECEIPT_READS: 0
STUDIO_AUTHORITATIVE_READBACKS: 0
STUDIO_RETRIES: 0
STUDIO_DUPLICATE_TRANSACTIONS: 0

Counts will be updated only from the fresh 61997 ledger and bound to its exact
evidence revision. Old-network counts are not valid for this release.
