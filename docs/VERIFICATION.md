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
| 4 | `test_edition_applies_consensus` | Target date `2025-10-01` evaluates eCFR and Federal Register doc `2025-16493`. | Assessment records `EDITION_APPLIES`, edition `FAA Order JO 7400.11J`, and state transitions to `LOCKED`. |
| 5 | `test_not_yet_effective_consensus` | Target date `2025-08-01` before effective date `2025-09-15`. | Assessment records `NOT_YET_EFFECTIVE` and case transitions to `NOT_APPLICABLE`. |
| 6 | `test_superseded_for_date_consensus` | Target date `2025-10-01` evaluated against older edition `7400.11I` superseded on `2025-09-15`. | Assessment records `SUPERSEDED_FOR_DATE` and case transitions to `NOT_APPLICABLE`. |
| 7 | `test_no_bound_reference_consensus` | eCFR section lacks any incorporated standard reference. | Assessment records `NO_BOUND_REFERENCE` and case transitions to `NOT_APPLICABLE`. |
| 8 | `test_unresolved_upstream_failure` | External source responds with 503 HTTP error or network timeout. | Assessment records `UNRESOLVED` and case state transitions to `UNRESOLVED`. |
| 9 | `test_boundary_activity_dates` | Tests exact boundary dates: `2000-01-01` and `2035-12-31`. | Case creation succeeds and correct ISO dates are stored. |
| 10 | `test_retry_cooldown_and_limit` | Evaluates retry cooldown (3600 seconds) and retry cap (3 attempts max). | Immediate retry reverts with `RETRY_COOLDOWN_ACTIVE`; 4th retry reverts with `MAX_ATTEMPTS_EXCEEDED`. |
| 11 | `test_validator_disagreement_and_injection` | Simulates validator returning conflicting edition or malformed XML injection payload. | Consensus equality validation fails; assessment marked `UNRESOLVED`. |
| 12 | `test_successor_lifecycle` | Owner proposes successor for locked case with new activity date `2026-10-01`. | Predecessor transitions to `SUPERSEDED_BY_SUCCESSOR`; new case created with `predecessor_case_id` linked. |
| 13 | `test_integration_binding_and_advancement` | Integrator binds namespace `flight-dispatch` to locked case and later advances to successor. | Integration state recorded as `ACTIVE`; `previous_case_id` preserved upon advancement. |
| 14–19 | Schema/source hardening and runtime views | Exact result/document key sets, official URL/date invariants, HTTP 429/501/599 fail-safe behavior, prompt injection resistance, upgrader/storage preservation, and paged views. | Invalid evidence cannot authorize a conclusive result; verified views and upgrade guards remain intact. |

Current independently reproduced result: **19 passed**. Some mocked failure cases emit an unmatched downstream Federal Register mock warning when the eCFR failure correctly short-circuits first; warnings are retained and are not counted as extra exercised calls.

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
   - `candidate["reason_code"] == leader["reason_code"]`
   - `sorted(candidate["authority_documents"]) == sorted(leader["authority_documents"])`

   The contract validates the complete accepted schema, fingerprints, source statuses, official URLs, dates, and outcome invariants before storage. Consensus equality intentionally compares the stable fields that authorize the consequence; transient response/status representation is not used to create unnecessary disagreement.

Any substantive disagreement results in consensus rejection and marks the case as `UNRESOLVED`.
