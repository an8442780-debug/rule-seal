# RuleSeal Studionet Evidence Ledger

## Acceptance identity

- PRE_DEPLOY-approved package revision: `e548d7f7880e5305203706f5db39e1caeeafd8f8`.
- Contract blob revision: `1ab01447771d194fd771bcd3d82a1135123f7ab0`; unchanged at the approved package revision.
- Canonical LF source SHA-256: `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`.
- Contract: `0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`.
- Deployment: `0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`.
- Explorer: `https://explorer-studio.genlayer.com/tx/0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`.
- Locked Codex in-app Studio deployer/upgrader: `0x15872d1887b8ff7322F2aa7c3c535f1F00dbb452`.
- Deployment: one submission; `FINALIZED`; GenVM `SUCCESS`; consensus `Accepted` / RPC `MAJORITY_AGREE`; exact LF source parity; upgrader readback matched; initial counts zero.

All writes below used Normal (Full Consensus). A terminal `FINALIZED` status is recorded separately from semantic `SUCCESS` or `ERROR`; expected rollback transactions are not reported as successful writes.

## Live action ledger

| Purpose | Method / arguments | Transaction | Terminal semantics | Authoritative readback | Result |
|---|---|---|---|---|---|
| Deploy independent contract | no constructor args | `0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106` | FINALIZED; SUCCESS; Accepted / MAJORITY_AGREE | source hash exact; upgrader exact; counts 0 | PASS |
| Create applicable case | nonce `rs-live-lock-001`; 71 / 71.1; `2025-09-15`; family hint | `0xab4146d54aa01a940b402a5aec6263ff19128c73dc6bf45577a33651ca2d45a4` | FINALIZED; SUCCESS; MAJORITY_AGREE | `REAL-000001`, DRAFT, exact nonce/fingerprint/owner | PASS |
| Freeze applicable case | `REAL-000001` | `0x1274fb0a6cdfaaad09ceb7d1c987d06518798d00180cfa88150c37a37cb82d43` | FINALIZED; SUCCESS; MAJORITY_AGREE | FROZEN | PASS |
| Assess exact effective-date boundary | `REAL-000001` | `0xc7194bcdb82f19234bda3f54c914c293fb8f870f7ec3b2c69b4c62c91094abed` | FINALIZED; SUCCESS; MAJORITY_AGREE | LOCKED; edition K; effective `2025-09-15` through `2026-09-15`; FR `2025-16493`; three official HTTP_200 sources; eCFR fingerprint retained | PASS |
| Bind integration | namespace `ruleseal-live`; `REAL-000001` | `0xe183edf83e7f897af0a79ad36b4c5e216d12828c5d4c0b6fc188f59b3c32ff3a` | FINALIZED; SUCCESS; MAJORITY_AGREE | caller-scoped binding to `REAL-000001` | PASS |
| Create successor | predecessor `REAL-000001`; nonce `rs-successor-001`; date `2025-09-14` | `0xca8b8c99ee263b8b14cc2b2b12620417f36068b14812fceee5d2402077272841` | FINALIZED; SUCCESS; MAJORITY_AGREE | successor `REAL-000002` DRAFT with reciprocal lineage; predecessor remained LOCKED | PASS |
| Freeze successor | `REAL-000002` | `0x55de85929fa5b2d0bebeb1e70b2fde290543b7d0a3d87ba29dd81b7ec02fcc74` | FINALIZED; SUCCESS; MAJORITY_AGREE | successor FROZEN; predecessor not superseded | PASS |
| Assess successor at pre-K boundary | `REAL-000002` | `0xd3846dafa2666f6bd38847d125e264c506f72639bdf7d6e160c452b67810a5dd` | FINALIZED; SUCCESS; MAJORITY_AGREE | successor LOCKED with edition J; predecessor `SUPERSEDED_BY_SUCCESSOR` | PASS |
| Advance integration explicitly | namespace `ruleseal-live`; `REAL-000002` | `0xf1bb7050cfcd82e20f5166fb55c6d741fd93d9b13d577a2528836a9bfc25a3c9` | FINALIZED; SUCCESS; MAJORITY_AGREE | case `REAL-000002`; previous case `REAL-000001` | PASS |
| Create minimum-date case | nonce `rs-live-boundary-min-001`; date `2000-01-01` | `0x6dcb5f0322ee788915c4d6d7c923fb889eaf551a18adf1ef06d1d4ea51e7b1e9` | FINALIZED; SUCCESS; MAJORITY_AGREE | `REAL-000003` DRAFT; exact minimum date | PASS |
| Duplicate nonce negative | same nonce; changed date `2000-01-02` | `0xe3ec0175be998442a5f3e2bfcb92fe97f13b44caa2039d9b9a14e6f7385e0ead` | FINALIZED; ERROR; Rollback; `DUPLICATE_NONCE`; consensus Accepted | case count remained 3; original nonce still resolves to `REAL-000003` | PASS expected rejection |
| Freeze minimum-date case | `REAL-000003` | `0xe10153a5a735779bec485783245e8ff3a1abdbfaeaffff0857d60aec9b5e0e8c` | FINALIZED; SUCCESS; MAJORITY_AGREE | FROZEN | PASS |
| Historical-source unavailable | assess `REAL-000003` | `0xeeb7aedaae2fe1ccb3cfc6dac8d398a6083ed326dd20778fb404e817b1ad08c5` | FINALIZED; SUCCESS; MAJORITY_AGREE | UNRESOLVED attempt 1; eCFR HTTP_404; `UPSTREAM_HISTORICAL_DATA_UNAVAILABLE` | PASS |
| Immediate retry negative | retry `REAL-000003` | `0x706a96d1d82e3421e8d67433afa8bc289eaeda246b582e1d2dbd7b56d6e1bc9f` | FINALIZED; ERROR; Rollback; `RETRY_COOLDOWN_ACTIVE`; consensus Accepted | remained UNRESOLVED, attempt 1, timestamps unchanged | PASS expected rejection |
| Eligible retry after cooldown | retry `REAL-000003` | `0xce42c6cad341989a4e539bc77aa1f260fc24bf50905e805a1712ad2311f0d3ac` | FINALIZED; SUCCESS; consensus Accepted | selected-provider frontend readback: FROZEN; prior assessment retained | PASS |
| Reassess after eligible retry | assess `REAL-000003` | `0x5cd3bffb8f61e29f295ce6edc4fbb0c5699926700b0cbabb02d5434cb0b2db6d` | FINALIZED; SUCCESS; consensus Accepted | `REAL-000003-A02`; UNRESOLVED attempt 2; eCFR HTTP_404; `UPSTREAM_HISTORICAL_DATA_UNAVAILABLE` | PASS |
| Retry before second cooldown elapsed | retry `REAL-000003` | `0x13bfd1636afa51749fcba5d4a7694697a5e1ae3541d99d01d0c2a233b28e9ab3` | FINALIZED; ERROR; Rollback; `RETRY_COOLDOWN_ACTIVE`; consensus Accepted | remained UNRESOLVED with `REAL-000003-A02`; observed-at unchanged | PASS expected rejection |
| Eligible retry after second cooldown | retry `REAL-000003` | `0xa5e079021ec4aaf45cb40bf5c507d22f6e326b8b70cfea6247791a68cf346fda` | FINALIZED; SUCCESS; consensus Accepted | selected-provider frontend readback: FROZEN; `REAL-000003-A02` retained until reassessment | PASS |
| Third and final assessment | assess `REAL-000003` | `0x7e31b78b05484c2a356c31c3acfa1cd2f8d37d6f0e38aa2f460731e2798282a8` | FINALIZED; SUCCESS; consensus Accepted | `REAL-000003-A03`; UNRESOLVED attempt 3; eCFR HTTP_404; `UPSTREAM_HISTORICAL_DATA_UNAVAILABLE`; observed at `2026-09-09T17:23:35.664999Z` | PASS |
| Retry after assessment cap | retry `REAL-000003` | `0xfc46af31c2d45e3c60551a1177fbb419c9bb35c8e24b5d2f09f2ebaa7a102583` | FINALIZED; ERROR; Rollback; `MAX_RETRIES_EXCEEDED`; consensus Accepted | remained UNRESOLVED with `REAL-000003-A03`; attempt count and observed-at unchanged | PASS expected rejection |
| Create live no-reference probe | nonce `rs-live-no-reference-001`; date `2020-01-01` | `0x659416319ed8bd4dd6ca402494401621d44e09bca3465330ca42a7e5ecb44337` | FINALIZED; SUCCESS; MAJORITY_AGREE | `REAL-000004` DRAFT | PASS |
| Freeze no-reference probe | `REAL-000004` | `0x804cce0c413fb989079c94814e54b83b74dfc19865fe2cc99c84989da35de690` | FINALIZED; SUCCESS; MAJORITY_AGREE | FROZEN | PASS |
| Attempt NOT_APPLICABLE evidence | assess `REAL-000004` | `0x027a21aeb60cbc0f04b8baac157d7ca974f90624d7d22aab8615a11fdee12f3b` | FINALIZED; ERROR; Rollback; `INVALID_ASSESSMENT`; consensus Undetermined / MAJORITY_DISAGREE after 3 rotations | remained FROZEN with attempt count 0 | FAIL CLOSED; not NOT_APPLICABLE evidence |
| Unauthorized actor negative | test actor freezes owner case `REAL-000004` | `0x0f4ce58f94a888193bc9c52231dd422971410d3b9c04781199a494126acb045c` | FINALIZED; ERROR; Rollback; `NOT_CASE_OWNER`; consensus Accepted | locked account restored; case remained FROZEN | PASS expected rejection |
| Same-source upgrade rehearsal | exact approved LF source | `0xdea5600481914e562fbecd299df368d9ba22963b23d0474fdb9befe01988f77d` | FINALIZED; `upgrade_result=success`; MAJORITY_AGREE | source hash unchanged; all four cases, integration and upgrader preserved | PASS |

## Evidence boundaries

`NOT_APPLICABLE` was not established live. The only bounded live attempt ended `MAJORITY_DISAGREE / INVALID_ASSESSMENT` and rolled back. The point-in-time eCFR endpoint ordinarily exposes the edition applicable on the queried date, so repeatedly submitting guessed dates solely to force a different label would be speculative and would violate the bounded-write plan. Deterministic Direct Mode tests cover `NOT_YET_EFFECTIVE`, `SUPERSEDED_FOR_DATE` and `NO_BOUND_REFERENCE`; the failed live attempt is retained as validator-disagreement and rollback evidence, not reclassified.

The one-hour retry cooldown was proven twice by live rejection before eligibility and by successful reservations after each elapsed boundary. The same case then completed exactly three assessments. A fourth reservation finalized with semantic `ERROR`, rollback code `MAX_RETRIES_EXCEEDED`, consensus `Accepted`, and an unchanged authoritative `UNRESOLVED` / `REAL-000003-A03` readback. No clock bypass, replacement case, or duplicate write was used.

## Excluded history

Transaction `0x7185f66549c5c0e474907226614a5860fc43ddb513764967416f8420eeef59ed` and contract `0x9D5ABdD0e8C606e16f45727066622c5C4a5601E2` remain permanently `DIAGNOSTIC_NON_ACCEPTANCE` because they predate PRE_DEPLOY approval.
