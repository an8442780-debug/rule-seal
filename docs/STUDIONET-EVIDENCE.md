# RuleSeal Studio Dev Evidence

## Evidence boundary

This ledger is reserved for the migrated Studio Dev preview release:

- Network: `studio-dev`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Contract: `0x63F046607998E02f7888a557a60c1e5bdD925C65`
- Deployment transaction: `0xc1e62765de2b5c53dcb8d8628f12c2b7a24f00b813b53a4011fad362dbc3ba16`
- Deployed source revision: `3c124aa0b5746ed03350639c28dc18e46a7a2dd7`
- Canonical source hash: `FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4`

The previous Studionet deployment is invalidated for this release. Its contract
address, receipts, state, readbacks and runtime records are retained only in
historical task records and are not proof for this ledger.

## Deployment and source parity

- On-chain deployment: `FINALIZED`; EVM receipt `0x1`.
- Semantic execution: `FINISHED_WITH_RETURN`.
- Consensus/finality: `MAJORITY_AGREE`.
- `gen_getContractCode`: `33,413` UTF-8 bytes, `789` LF, `0` CRLF, first line `# v0.3.0`.
- Readback code SHA-256 equals the canonical LF source hash above.
- `gen_getContractSchema`: `23` methods, `16` view and `7` write; constructor has no parameters.
- `get_upgrader`: matches the locked Studio Dev upgrader in the private preflight record.

## Fresh lifecycle evidence

Every acceptance write retained a stable operation ID and hash and was accepted
only after FINALIZED status, successful semantic execution, consensus/finality,
and an authoritative readback. The raw operation journals retain every attempt,
including diagnostics and pre-broadcast rejections.

| Criterion | Result and authoritative readback |
|---|---|
| `DRAFT → FROZEN → LOCKED` | `REAL-000001`, `REAL-000003`, `REAL-000004`, and `REAL-000005` reached the expected states; each assessment returned `EDITION_APPLIES`. |
| Unresolved path | `REAL-000002` reached `UNRESOLVED` with `UPSTREAM_SOURCE_UNAVAILABLE`; source status was retained and no authority document was fabricated. |
| Retry cooldown | `retry_unresolved(REAL-000002)` was rejected during fee estimation with `RETRY_COOLDOWN_ACTIVE`; no transaction was broadcast and readback remained unchanged. |
| Retry cap | Direct Mode covers the three-attempt cap and rollback/no-mutation behavior; the live cooldown guard prevented an unnecessary wait or duplicate write. |
| Date boundary | Live 2000-01-01 evidence is retained as the unresolved upstream boundary; Direct Mode covers `NOT_YET_EFFECTIVE`, `SUPERSEDED_FOR_DATE`, and `NO_BOUND_REFERENCE`. Live 2025-09-15, 2025-10-01, 2026-01-01 and 2026-06-01 all returned `EDITION_APPLIES`. |
| Successor lineage | `REAL-000001 → REAL-000003 → REAL-000004 → REAL-000005`; reciprocal predecessor/successor fields were read back. Terminal predecessors became `SUPERSEDED_BY_SUCCESSOR` only after the successor locked. |
| Integration binding | Caller-scoped namespace first bound to `REAL-000004`, same-case rebind was a finalized no-op, then advanced to declared successor `REAL-000005`; readback preserved `previous_case_id`. |
| Authorization | Unauthorized freeze by a different actor and unauthorized upgrade were rejected before broadcast; no hash and no state mutation. |
| Source verification | Each assessment read back the exact eCFR URL, Federal Register bounded query, document `2025-16493`, docket `FAA-2025-1763`, publication date `2025-08-28`, effective date `2025-09-15`, and the eCFR fingerprint. |
| Upgrade preservation | Source-preserving `upgrade` finalized successfully; post-upgrade code hash and all case/integration readbacks remained unchanged. |

## Retained operation evidence

Accepted deployment and lifecycle operation hashes are retained in the private
toolchain journals and independently reconciled in
`docs/STUDIO-OPERATION-RECONCILIATION-61997.md`. That ledger matches every
positive hash to a finalized receipt, semantic result, consensus/finality and a
method-specific authoritative readback. Failed CLI diagnostics, the old-network
deployment, cooldown/authorization rejections, and malformed attempts are
retained for traceability but are excluded from positive acceptance claims.

## Evidence boundary and next gate

Local Direct Mode, source tests, live schema checks and this Studio ledger are
supporting evidence for the 61997 deployment. Production wallet and browser
journeys remain a separate POST_GITHUB_VERCEL_FINAL gate; they cannot be inferred
from Studio evidence.
