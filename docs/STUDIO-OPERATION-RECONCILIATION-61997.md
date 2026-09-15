# Studio Dev operation reconciliation ledger

## Immutable evidence binding

- Evidence package: new POST_DEPLOY_TEST re-review package issued for this ledger
- Evidence revision binding: the re-review package binds the exact Git HEAD and
  this file's blob hash; the package is the authoritative revision identifier.
- PRE_DEPLOY-approved source revision: `3c124aa0b5746ed03350639c28dc18e46a7a2dd7`
- Canonical contract LF SHA-256: `FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4`
- Network: Studio Dev preview, chain `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Contract: `0x63F046607998E02f7888a557a60c1e5bdD925C65`
- Reconciliation mode: read-only; no transaction was broadcast while this ledger was produced.

The re-review package must bind the exact final Git HEAD and this file's SHA-256
before submission to the POST_DEPLOY_TEST reviewer. Any correction to this
ledger creates a new evidence revision and requires re-review; this file is not
a live journal.

## Verification method

Every row below was matched by hash through the official Studio Dev RPC using:

1. `eth_getTransactionReceipt` — receipt status must be `0x1`.
2. `eth_getTransactionByHash` — `status_name=FINALIZED`,
   `tx_execution_result_name=FINISHED_WITH_RETURN`,
   `result_name=MAJORITY_AGREE`, and `last_round.votes_committed=5`,
   `last_round.votes_revealed=5`.
3. `gen_getTransactionLifecycle` — stored/projected lifecycle `Finalized`.
4. `gen_call` through the pinned `genlayer-js` `studioDevnet` client —
   method-specific authoritative state readback.

`proof=0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` in
the table means all five checks above passed for that exact hash. `fee_value`
is the submitted fee quote; the RPC receipt also reported settlement for the
finalized transaction. Operation journals remain retained separately, including
their original `SUBMITTED` or `RECONCILIATION_REQUIRED` reservation status.

## Acceptance deployment

| Operation ID | Hash | Actor | Method / identity | fee_value | Proof | Authoritative readback |
|---|---|---|---|---:|---|---|
| `rule-seal-deploy-3c124aa-61997` | `0xc1e62765de2b5c53dcb8d8628f12c2b7a24f00b813b53a4011fad362dbc3ba16` | actor7 | deployment of `contracts/rule_seal.py` | `281250000000078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_upgrader()` = locked actor7; `get_case_count()` = `5`; deployed code hash and schema are recorded in `docs/DEPLOYMENT.md` |

The deployment reservation journal is intentionally not overwritten. This row
is its external finalized reconciliation record; the old reservation marker is
raw history, not a claim that the deployment is unresolved.

## Lifecycle writes

| Operation ID | Hash | Actor | Method / identity | fee_value | Proof | Authoritative readback |
|---|---|---|---|---:|---|---|
| `rule-seal-case-locked-create-61997-direct-01` | `0xe78ea0d506f7384a2cdab0707015432c9b5d782ede1e633f270d0850784e13c2` | actor7 | `create_case(migrate-locked-61997-direct-01,71,71.1,2025-09-15,FAA Order JO 7400.11)` | `1381190400078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case_by_nonce(actor7,migrate-locked-61997-direct-01)` = `REAL-000001`; current authoritative record has `current_assessment_id=REAL-000001-A01` and `successor_case_id=REAL-000003` |
| `rule-seal-case-locked-freeze-61997-01` | `0xf9cd31a8dfcd0ded49693c69ea788d25e53ee96c2799190ea0a346f3c51c4188` | actor7 | `freeze_case(REAL-000001)` | `1381152600078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000001)` has non-empty `frozen_at`; current lifecycle record is `SUPERSEDED_BY_SUCCESSOR` |
| `rule-seal-case-locked-assess-61997-01` | `0x21202dd0ba798909c2d32d4755fc65df5a4daffe9d5896732136289c39746fb3` | actor7 | `assess_case(REAL-000001)` | `1429668900078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000001)` → `current_assessment_id=REAL-000001-A01`; `get_assessment(REAL-000001-A01)` → `EDITION_APPLIES`, exact FR document `2025-16493` |
| `rule-seal-case-na-create-61997-01` | `0xdfd762d82abcda9fda00fae7752dc22564dc04830fd23df85ad31ca8a7636715` | actor7 | `create_case(migrate-not-applicable-61997-01,71,71.1,2000-01-01,FAA Order JO 7400.11)` | `1381198500078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000002)` = `REAL-000002`, activity date `2000-01-01` |
| `rule-seal-case-na-freeze-61997-01` | `0x1dc90f206fa8a29a0c42d27a90807b4045ec065f62a6aa55728184587d17447d` | actor7 | `freeze_case(REAL-000002)` | `1381155300078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000002)` has non-empty `frozen_at`; current lifecycle record is `UNRESOLVED` |
| `rule-seal-case-na-assess-61997-01` | `0xbb21cc2b8e050705451b489dd178aec77b7be1aa65eaca599aee410568a852a6` | actor7 | `assess_case(REAL-000002)` | `1400587200078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_assessment(REAL-000002-A01)` → `UNRESOLVED`, `UPSTREAM_SOURCE_UNAVAILABLE`, `authority_documents=[]` |
| `rule-seal-successor-create-61997-01` | `0x5dcb8d3697d6c203a1d54b80a5d6dbb31ab12efede92ef89be227fd51b0499f2` | actor7 | `create_successor(REAL-000001,migrate-successor-61997-01,2025-10-01)` | `1381247100078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case_by_nonce(actor7,migrate-successor-61997-01)` = `REAL-000003`; predecessor readback has reciprocal links |
| `rule-seal-successor-freeze-61997-01` | `0x960bc47dc38ee21e22e4e2e63f589f5c0ba4913d04bb0f6d47d515b378479090` | actor7 | `freeze_case(REAL-000003)` | `1381155300078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000003)` has non-empty `frozen_at`; current lifecycle record is `SUPERSEDED_BY_SUCCESSOR` |
| `rule-seal-successor-assess-61997-01` | `0xdb254ab31782b849f10d4fb078a403d51e2355e2ff323031a9bb75b4d9e4ed70` | actor7 | `assess_case(REAL-000003)` | `1429747200078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_assessment(REAL-000003-A01)` → `EDITION_APPLIES`, exact FR document `2025-16493` |
| `rule-seal-successor2-create-61997-01` | `0x05e7f4279fca2415898120bb135bf184b3b7b78cd3b1e8e91fef90f87e2d68ab` | actor7 | `create_successor(REAL-000003,migrate-successor2-61997-01,2026-01-01)` | `1381252500078911` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case_by_nonce(actor7,migrate-successor2-61997-01)` = `REAL-000004`; predecessor readback has reciprocal links |
| `rule-seal-successor2-freeze-61997-01` | `0x0a7382e576907411101ac566806841a2ae50843e4d0b8511f54c6ebaebd3a9a5` | actor7 | `freeze_case(REAL-000004)` | `613846800010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000004)` has non-empty `frozen_at`; current lifecycle record is `SUPERSEDED_BY_SUCCESSOR` |
| `rule-seal-successor2-assess-61997-01` | `0xb4e1393a19a0e269a0481eb8efb0b7db4587d331b7afce7a36dd5571ae896a5e` | actor7 | `assess_case(REAL-000004)` | `635442000010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_assessment(REAL-000004-A01)` → `EDITION_APPLIES`, eCFR date `2026-01-01`, exact FR document `2025-16493` |
| `rule-seal-successor3-create-61997-01` | `0x129321c903b3eac077f1f35c6ba8e430c85527060d1c78aaa49bb70afbfd7277` | actor7 | `create_successor(REAL-000004,migrate-successor3-61997-01,2026-06-01)` | `613892400010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case_by_nonce(actor7,migrate-successor3-61997-01)` = `REAL-000005`; predecessor readback has reciprocal links |
| `rule-seal-successor3-freeze-61997-01` | `0x5a838deff293dfe0af781acb591e9c89cf8b78ddb0469cd5ace84aded0b46a6d` | actor7 | `freeze_case(REAL-000005)` | `613846800010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_case(REAL-000005)` has non-empty `frozen_at`; state is `LOCKED` after assessment |
| `rule-seal-successor3-assess-61997-01` | `0x4c58a9fc16cea0b878b435fbf36967ab68624a25cf99b7bde9b88bd18ad124ac` | actor7 | `assess_case(REAL-000005)` | `635446800010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_assessment(REAL-000005-A01)` → `EDITION_APPLIES`, eCFR date `2026-06-01`, exact FR document `2025-16493` |

## Integration and upgrade writes

| Operation ID | Hash | Actor | Method / identity | fee_value | Proof | Authoritative readback |
|---|---|---|---|---:|---|---|
| `rule-seal-integration-bind-61997-02` | `0x386ca8d16279ca270c5aee2681f9ee2cbf61e4950f00dafe17642faef26fc0ec` | actor8 | `activate_integration(migration-checklist-61997,REAL-000004)` | `613845600010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_integration(actor8,migration-checklist-61997)` records the caller-scoped namespace and `case_id=REAL-000004` in the pre-advance state |
| `rule-seal-integration-same-case-noop-61997-01` | `0x5e9b2d68655419e46f4ce3d151b9fec856ba967177dc93fd77d51b3e261fa0b6` | actor8 | same-case `activate_integration(migration-checklist-61997,REAL-000004)` | `613814400010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | same-case idempotent operation; namespace remains caller-scoped and no new case is created |
| `rule-seal-integration-advance-61997-01` | `0xf91e6d0f076b136542306de9b3f3199914a850a9efb36f226b2864a0f4eecd71` | actor8 | `activate_integration(migration-checklist-61997,REAL-000005)` | `613837200010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | current `get_integration(actor8,migration-checklist-61997)` = `BOUND_TO_CASE`, `case_id=REAL-000005`, `previous_case_id=REAL-000004` |
| `rule-seal-upgrade-source-preserving-61997-02` | `0x679ec0835ed044cabf0d595659859ca319074a06d87165f6d39af6a0d2afcb0d` | actor7 | `upgrade(<canonical-source-bytes>)`, source hash `FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4` | `615068400010352` | `0x1 / FINALIZED / FINISHED_WITH_RETURN / MAJORITY_AGREE / 5-of-5` | `get_upgrader()` remains actor7; deployed code hash remains canonical; all five case records and integration readback remain present |

## Excluded attempts and no-duplicate boundary

The following are not positive-write rows: fee-estimation rejections for retry
cooldown and unauthorized actors, parser failures before broadcast, and the
earlier `RECONCILIATION_REQUIRED` reservations with no hash. They remain in the
toolchain operations directory as raw history. This ledger adds no write and no
replacement transaction; a reviewer can verify that every positive hash above
is unique and that no excluded attempt has a transaction hash.
