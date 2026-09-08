# RuleSeal Studio RPC Budget

Mode: `OBSERVABLE_ACTION_LEDGER`, locked before Studio activity.

| Operation | Maximum | Retry | Timeout / stop |
|---|---:|---:|---|
| Schema probe | 1 | 0 | 15s; stop on error |
| Source/code readback | 1 per revision | 1 on 429/5xx | 15s; stop on second failure |
| Deployment submission | 1 write | 0 | signing 5m; never resubmit |
| Deployment receipt polling | 24 | 0 | 5m; 2.5–10s backoff; stop at terminal |
| Each lifecycle write | 1 | 0 | signing 5m; no duplicate |
| Receipt polling per write | 24 | 0 | 5m; stop at terminal |
| Authoritative readback | 3 reads | 0 | 15s; close only after success |
| Verification bundle | 12 reads | 1 transient retry | 30s; stop on budget breach |

The ledger records method, timestamp, request count, receipt state, semantic result, consensus/finality, readback and PASS/FAIL for every attempt. Unknown receipt, wrong account/network, duplicate write, missing readback, measurement failure or a budget breach blocks Studio progression.

## Measurement capability probe

- Endpoint and supported methods: check before opening Studio.
- Physical network request count: not assumed available.
- Locked mode: observable action ledger with the limitation recorded.
- Studio may open only after the ledger instrumentation is ready.
- Old project transactions and telemetry are not counted for RuleSeal.
