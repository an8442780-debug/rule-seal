# RuleSeal Studionet Evidence

## Deployment

The public deployment is recorded in [DEPLOYMENT.md](DEPLOYMENT.md), including the Studionet contract address, deployment Explorer link, finalized receipt, semantic success, consensus result, schema count and canonical source hash.

## Verified lifecycle behavior

Write results were checked as finalized transactions with semantic execution and authoritative state readback. Expected rejections are retained as state-preserving failures.

| Area | Verified result |
|---|---|
| Case lifecycle | DRAFT → FROZEN → LOCKED is recorded with the assessment and official-source evidence. |
| Source-unavailable path | An accepted assessment records UNRESOLVED with the source status and retry information. |
| Retry policy | Premature retries are rejected without mutation; eligible retries are bounded; the retry cap rejects further attempts without mutation. |
| Duplicate protection | Reusing a nonce with changed inputs is rejected and the original record remains authoritative. |
| Date boundaries | The minimum supported date, effective-date boundary and maximum supported date are covered by live or deterministic verification as applicable. |
| Successor lineage | A successor starts in DRAFT, keeps reciprocal lineage, and does not supersede its predecessor until it reaches a conclusive state. |
| Supersession | A conclusive successor reaches LOCKED or NOT_APPLICABLE and then supersedes the predecessor. |
| Integration | A caller-scoped integration binds to a LOCKED case; same-case rebinding is idempotent; explicit advancement requires a different declared conclusive successor. |
| Authorization | Non-owner and undeclared replacement actions are rejected without state mutation. |
| Validator disagreement | Conflicting validator assessments fail closed and preserve the prior authoritative state. |
| Upgrade preservation | The source-preserving rehearsal retains cases, lineage, integrations, events and authority. |

## Evidence boundaries

The live environment can produce a validator disagreement for a requested outcome. That failure is recorded as a fail-closed disagreement, not relabeled as a successful outcome. Deterministic tests cover the remaining outcome classifications and malformed, missing, mismatched and unavailable source evidence.

## Public verification method

Inspect the contract address and deployment Explorer record, read the public schema, then compare state and event views after each user workflow. A finalized receipt, semantic execution result and authoritative readback are all required; a wallet popup or browser status alone is not sufficient.
