# Verification Matrix & Testing Guide

This document defines the formal verification procedures, automated test matrices, and validator consensus rules for the **Regulatory Edition Applicability Lock** project.

---

## 1. Automated Intelligent Contract Verification

Contract tests execute using the `py-genlayer` Direct Mode test runner and verify state invariants, cryptographic nonces, authority document parsing, and validator consensus rules.

Run with:
```bash
py -3.13 -m pytest -q -p no:cacheprovider
```

### Contract Test Matrix

| # | Test Name | Scenario & Coverage | Expected Result |
|---|---|---|---|
| 1 | `test_invalid_inputs_rejected` | Tests non-allowlisted CFR title (`12`), non-allowlisted part (`72`), non-allowlisted section (`71.2`), non-allowlisted designation hint, and invalid date formats (`2025/10/01`, `1999-12-31`, `2036-01-01`). | Transaction reverts with descriptive grammar error. |
| 2 | `test_freeze_authorization` | Non-owner caller attempts to call `freeze_case` on a draft case. | Reverts with `CALLER_NOT_CASE_OWNER`. |
| 3 | `test_duplicate_nonce_and_fingerprint` | Attempts to create a case with an existing client nonce or matching fingerprint. | Reverts with `DUPLICATE_CLIENT_NONCE` or `DUPLICATE_CASE_FINGERPRINT`. |
| 4 | `test_outcome_edition_applies_and_boundaries` | Target date `2025-09-15` evaluates date-bound eCFR and exact Federal Register doc `2025-16493`. | Assessment records `EDITION_APPLIES`, edition `FAA Order JO 7400.11K`, and transitions to `LOCKED`. |
| 5 | `test_edition_j_applies_one_day_before_k_boundary` | Point-in-time section on `2025-09-14`, one day before K takes effect. | Edition `FAA Order JO 7400.11J` remains applicable through the exclusive `2025-09-15` boundary. |
| 6 | `test_outcome_superseded_for_date` | Older edition J is evaluated after its `2025-09-15` supersession boundary. | Assessment records `SUPERSEDED_FOR_DATE` and transitions to `NOT_APPLICABLE`. |
| 7 | `test_no_bound_reference_consensus` | eCFR section lacks any incorporated standard reference. | Assessment records `NO_BOUND_REFERENCE` and case transitions to `NOT_APPLICABLE`. |
| 8 | `test_unresolved_upstream_failure` | External source responds with 503 HTTP error or network timeout. | Assessment records `UNRESOLVED` and case state transitions to `UNRESOLVED`. |
| 9 | `test_boundary_activity_dates` | Tests exact boundary dates: `2000-01-01` and `2035-12-31`. | Case creation succeeds and correct ISO dates are stored. |
| 10 | `test_outcome_unresolved_and_retry_lifecycle` | Evaluates retry cooldown (3600 seconds) and retry cap (3 attempts max). | Immediate retry reverts with `RETRY_COOLDOWN_ACTIVE`; exhausted retry reverts with `MAX_RETRIES_EXCEEDED`. |
| 11 | `test_validator_disagreement_and_injection` | Simulates validator returning conflicting edition or malformed XML injection payload. | Consensus equality validation fails; assessment marked `UNRESOLVED`. |
| 12 | `test_successor_lifecycle` | Owner proposes successor for locked case with new activity date `2026-10-01`. | Predecessor transitions to `SUPERSEDED_BY_SUCCESSOR`; new case created with `predecessor_case_id` linked. |
| 13 | `test_integration_binding_and_advancement` | Integrator binds namespace `flight-dispatch` to locked case and later advances to successor. | Integration state recorded as `ACTIVE`; `previous_case_id` preserved upon advancement. |
| 14–24 | Remaining outcome, schema/source hardening and runtime views | `NOT_YET_EFFECTIVE` where no prior family edition is bound; exact schemas; date-bound eCFR version metadata; source-citation-derived Federal Register query; exact-document fetch; missing document; incomplete pagination; docket-vs-document negative control; HTTP failures; injection resistance; upgrade and paged views. | Every outcome remains covered; incomplete or invalid authority evidence cannot authorize a conclusive result. |

Current independently reproduced result: **24 passed**. The suite currently reports 12 expected unused-mock warnings: five tests do not assess and therefore do not consume the autouse versions mock; the remainder are deliberate fail-fast/short-circuit cases that do not consume downstream web mocks.

---

## 2. Frontend Automated Verification

Frontend unit tests verify the RPC client, wallet discovery, write journal, and domain contract serialization.

Run with:
```bash
cd frontend
npm test
```

### Frontend Test Matrix

| Suite | Test Case | Invariant Verified |
|---|---|---|
| `rpc.test.ts` | Journey metric tracking | Read calls increment total and per-journey counters. |
| `rpc.test.ts` | In-flight deduplication | Concurrent requests for identical methods and arguments collapse to a single HTTP request. |
| `rpc.test.ts` | 10-second TTL caching | Sequential reads within 10 seconds return cached results without additional network traffic. |
| `rpc.test.ts` | Method invalidation | `invalidateMethod` purges cached entries for targeted contract methods. |
| `wallet.test.ts` | EIP-6963 provider discovery | Window events discover MetaMask, OKX Wallet, and Rabby while filtering out unauthorized providers. |
| `wallet.test.ts` | Provider connection and lifecycle | Exact-provider connection, address/chain state, deduplication, legacy replacement, listener cleanup, and add-then-switch behavior. |
| `journal.test.ts` | Save & retrieve pending ops | Operations persist to storage with timestamps, methods, and initial `PRE_SIGN` status. |
| `journal.test.ts` | Update transaction hash | Hash update advances operation state to `SUBMITTED`. |
| `journal.test.ts` | Reconciliation | A successful receipt is cleared only after a supplied method-specific authoritative state predicate succeeds; terminal failures clear safely and ambiguous writes remain locked. |
| `contract.test.ts` | Read & parse case record | JSON-serialized contract state is correctly deserialized into typed `CaseRecord` domain models. |
| `contract.test.ts` | Read & parse assessment | Authority documents, outcomes, and source statuses are parsed accurately. |
| `contract.test.ts` | Write and receipt boundary | Exact selected-provider routing; `ACCEPTED` remains pending; only `FINALIZED` plus successful execution advances to authoritative readback. |
| `components.test.tsx` | Mounted workflows | Real public lookup, owner, resolver, integrator, successor, auditor, wallet-dialog, and tab-shell rendering. |

Current independently reproduced result: **5 files, 36 tests passed**.

---

## 3. Frontend Typecheck & Build Verification

Run with:
```bash
cd frontend
npm run build
```

Expected output:
- `tsc -b` passes with zero diagnostics.
- Vite bundles all static assets into `frontend/dist/`.

---

## 4. Substantive Equality Consensus Rules

GenLayer intelligent contract validators execute consensus evaluations under the following determinism constraints:

1. **Deterministic Input Extraction**:
   No contract storage maps or arrays may be read inside the `evaluate` closure. All parameters (`part`, `section`, `activity_date`, `designation_hint`) must be passed as extracted primitive arguments.

2. **Consequential Equality Verification**:
   The `validate` closure enforces equality across all the following fields:
   - `schema_version == "1.0.0"`
   - `candidate["outcome"] == leader["outcome"]`
   - `candidate["standard_body"] == leader["standard_body"]`
   - `candidate["designation_family"] == leader["designation_family"]`
   - `candidate["edition"] == leader["edition"]`
   - `candidate["effective_from"] == leader["effective_from"]`
   - `candidate["effective_to"] == leader["effective_to"]`
   - `candidate["ecfr_date"] == leader["ecfr_date"]`
   - `candidate["ecfr_section_fingerprint"] == leader["ecfr_section_fingerprint"]`
   - `candidate["reason_code"] == leader["reason_code"]`
   - `sorted(candidate["authority_documents"]) == sorted(leader["authority_documents"])`
   - `candidate["source_statuses"] == leader["source_statuses"]`

   The contract validates and compares the complete consequential schema, including fingerprints and source statuses, before storage.

Any substantive disagreement results in consensus rejection and marks the case as `UNRESOLVED`.
