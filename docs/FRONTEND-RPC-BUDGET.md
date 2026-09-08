# RuleSeal Frontend RPC Budget

Budgets apply per browser session and per journey on the exact release.

| Journey | Maximum requests | Polling / retry |
|---|---:|---|
| Bootstrap | 8 in 10s | 10s safe-read cache; in-flight dedupe |
| Public lookup | 10 in 30s | no poll unless pending |
| Create/freeze/assess/integration/successor | 30 each | 1 write, max 24 polls/5m, max 3 readbacks |
| Reload reconciliation | 12 in 30s | one active poller |

Safe reads use a 10-second TTL and in-flight deduplication. 429/5xx retries are bounded to two attempts with 1s/3s jittered delays. Polling pauses while the tab is hidden and uses 2.5–10s backoff. A journal entry is removed only after authoritative readback. Any duplicate write, request storm, cache bypass, missing readback or threshold breach is FAIL.

Evidence must include the exact revision, journey, RPC method, planned maximum, actual count, retries, cache result, deduplication, invalidation, polling and authoritative readback.
