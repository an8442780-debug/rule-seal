# Regulatory Edition Applicability Lock

An immutable, source-bound incorporation-by-reference (IBR) regulatory baseline lock for **Title 14 CFR § 71.1** (*FAA Order JO 7400.11* family) spanning activity dates from **2000-01-01 to 2035-12-31**. Powered by the **GenLayer Intelligent Contract SDK (`py-genlayer`)** and consensus AI validator execution.

---

## 1. System Overview & Problem Statement

In aviation compliance and Federal Aviation Administration (FAA) regulatory workflows, operations conducted under **Title 14 CFR Part 71 (§ 71.1)** rely on annual standard editions of **FAA Order JO 7400.11** (e.g., *7400.11H*, *7400.11J*, *7400.11K*) incorporated by reference through final rules published in the Federal Register.

Historical review workflows need a reproducible evidence-navigation signal for which referenced edition the official sources indicate for a target activity date. This prototype is not legal advice, a compliance certification, or proof of applicability to a particular regulated entity.

This project delivers:
1. **Intelligent Contract (`py-genlayer`)**: Encapsulates regulatory grammar rules, freeze authorization, non-deterministic web retrieval of official eCFR and Federal Register sources, validator substantive equality consensus, and immutable baseline locking.
2. **Deterministic Successor Lineage**: Preserves chronological audit trails as new FAA standard editions supersede previous baselines.
3. **Downstream Integration Binding**: Enables external compliance checklist systems to bind namespaces directly to locked edition baselines.
4. **Accessible Web Workbench**: Static React 19 + TypeScript + Vite frontend featuring EIP-6963 multi-injected wallet discovery and restart-safe write journals.

---

## 2. Intelligent Contract Architecture

### Lifecycle State Machine

```
               +---------------------------------------+
               |                 DRAFT                 |
               +---------------------------------------+
                                   |
                             freeze_case()
                                   |
                                   v
               +---------------------------------------+
               |                FROZEN                 |
               +---------------------------------------+
                                   |
                             assess_case()
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
+---------------+          +----------------+         +----------------+
|    LOCKED     |          | NOT_APPLICABLE |         |   UNRESOLVED   |
+---------------+          +----------------+         +----------------+
        |                          |                          |
create_successor()         create_successor()         retry_unresolved()
        |                          |                  (1h cooldown, max 3)
        v                          v                          |
+-------------------------------------------+                 v
|          SUPERSEDED_BY_SUCCESSOR          |              (FROZEN)
+-------------------------------------------+
```

### Consensus & Non-Deterministic Execution

- **Deterministic Primitive Extraction**: Storage keys, target dates, and allowlisted strings are extracted into local primitive variables prior to calling `gl.vm.run_nondet_unsafe(evaluate, validate)`.
- **Substantive Equality Consensus**: Each validator independently fetches official regulatory sources, evaluates standard applicability, and validates exact equality across all consequential fields:
  - `schema_version`
  - `outcome` (`EDITION_APPLIES`, `NOT_YET_EFFECTIVE`, `SUPERSEDED_FOR_DATE`, `NO_BOUND_REFERENCE`, `UNRESOLVED`)
  - `standard_body`
  - `designation_family`
  - `edition`
  - `effective_from` & `effective_to`
  - `ecfr_date`
  - `reason_code`
  - `authority_documents` (sorted by document number)
- The full accepted record still validates and stores the bounded eCFR fingerprint and source-status map. Those transient evidence representations are not used as outcome-authorizing equality fields when the independently derived consequential facts agree.
- **Root Slot Upgradability**: Adheres to the official GenLayer SDK pattern (`root = gl.storage.Root.get(); root.upgraders.get().append(...)`) enabling governed contract upgrades.

---

## 3. Frontend Architecture

- **Zero Heavy Frameworks**: Pure React 19.2.8, TypeScript 7.0.2, Vite 8.2.2, Vitest 4.1.11, `genlayer-js 1.1.8`.
- **EIP-6963 Multi-Injected Discovery**: Passive discovery via `eip6963:announceProvider` filtering exclusively for MetaMask, OKX Wallet, and Rabby without calling `eth_requestAccounts` upon dialog opening.
- **Shared Singleton RPC Client**:
  - 10-second TTL cache for contract reads
  - In-flight request deduplication
  - Exponential backoff with jitter on 429/5xx status codes
  - Transaction finality polling with backoff (2.5s to 10s) and tab-hidden pauses
  - Operational journey instrumentation
- **Restart-Safe Pending Journal**: Persists pre-signing intent and broadcast transaction hashes to `localStorage`/`sessionStorage` to guard against reload interruptions.

---

## 4. Quickstart & Verification

### Prerequisites
- Python 3.13 with the recorded `py-genlayer`/`gltest` runner and `pytest`
- Node.js 20+ and `npm`

### Contract Test Suite
```bash
# Run intelligent contract unit tests
py -3.13 -m pytest -q -p no:cacheprovider
```

### Frontend Test Suite & Build
```bash
cd frontend

# Run frontend unit tests (Vitest)
npm test

# Typecheck and production bundle build
npm run build

# Launch development server
npm run dev
```

---

## 5. Official Regulatory Data Sources

- **eCFR Versioner v1 API**: `https://www.ecfr.gov/api/versioner/v1/full/{date}/title-14.xml?part=71`
- **Federal Register v1 API**: bounded Title 14/Part 71 rule query with the exact `7400.11` term, derived by the contract.

---

## 6. Security & Governance Invariants

1. **No Mock Deployments**: No fake contract addresses or `.env` files are checked into repository.
2. **Immutable Fingerprinting**: Deterministic fingerprinting prevents colliding baselines for identical section, activity date, and designation family combinations.
3. **Idempotency Guarantees**: Client nonces enforce single-execution guarantees across write transactions.
