# Failure Modes & Disaster Recovery Procedures

This guide provides operational runbooks and disaster recovery protocols for the **Regulatory Edition Applicability Lock** intelligent contract and client applications.

---

## 1. RPC Infrastructure & Network Failures

### Symptom: HTTP 429 (Rate Limit) or 5xx (Server Error)
- **Automatic Mitigation**: The shared `RpcClient` employs an exponential backoff retry loop with randomized jitter:
  $$\text{delay} = \min(1000 \times 2^{\text{attempt}} + \text{jitter}, 10000)\text{ ms}$$
  Retries up to 3 times before raising a user-visible error.
- **Recovery Procedure**:
  1. Verify the health of the Studionet RPC endpoint (`https://studio.genlayer.com/api`).
  2. Keep the canonical Studionet endpoint. Surface the outage, preserve validated state, and retry only through the bounded client policy; do not silently switch authority endpoints.

---

## 2. Transaction Interruptions & Client Reloads

### Symptom: User Closes Browser or Reloads Mid-Transaction
- **Architecture**: The application implements a **Restart-Safe Pending Journal** in `localStorage`/`sessionStorage`.
  1. Before triggering wallet signatures, a `PRE_SIGN` intent record is persisted.
  2. Once broadcast to Studionet, the record status is updated to `SUBMITTED` with the assigned transaction hash.
  3. Once finality and readback are confirmed, the record is removed.
- **Recovery Procedure**:
  1. Upon application launch, the `App` component detects any unfinalized journal entries.
  2. The recovery control reconciles the retained hash against transaction finality, execution result, and the operation-specific authoritative contract readback.
  3. The operation remains locked while the result is pending or ambiguous. It is cleared only after verified effect or confirmed terminal failure; the client never asks the user to delete an unreconciled hash.

---

## 3. Upstream Regulatory Data Outages (eCFR / Federal Register)

### Symptom: Government API Downtime (eCFR Versioner or Federal Register API)
- **Intelligent Contract Invariant**: If external HTTP endpoints fail (e.g., HTTP 503, connection timeouts), the validator evaluation returns an `UNRESOLVED` assessment with reason code `UPSTREAM_SOURCE_UNAVAILABLE`.
- **State Transition**: Case state transitions to `UNRESOLVED`.
- **Recovery Procedure**:
  1. Contract enforces a **3600-second (1 hour) cooldown** between retry attempts to prevent spamming failing upstream sources.
  2. Any user may invoke `retry_unresolved(case_id)` once the cooldown period expires.
  3. A case allows up to **3 total assessment attempts**.
  4. If all 3 attempts fail due to prolonged governmental downtime, the owner may propose a new case draft once upstream services recover.

---

## 4. Conflicting or Tampered Regulatory Data

### Symptom: External Data Divergence or Prompt Injection Attempts
- **Intelligent Contract Invariant**: GenLayer validators execute independent web requests and model evaluations.
- **Consensus Enforcement**: The `validate` closure strictly enforces substantive equality across all consequential fields (`edition`, `effective_from`, `effective_to`, sorted `authority_documents`).
- **Disagreement Handling**:
  - If a malicious actor attempts prompt injection or returns conflicting edition designations, validator responses will not match.
  - The consensus engine will reject the candidate, marking the evaluation as `UNRESOLVED`.

---

## 5. Successor Migration & Predecessor Lineage

### Scenario: FAA Issues New Annual Standard Edition (e.g., JO 7400.11K supersedes 7400.11J)
- **Procedure**:
  1. Locate the existing terminal case (`LOCKED` or `NOT_APPLICABLE`) in Public Lookup.
  2. Navigate to the **Successor Lineage Proposal Wizard**.
  3. Enter the new target activity date and client nonce.
  4. Execute `create_successor(old_case_id, nonce, new_activity_date)`.
  5. Predecessor case is permanently marked `SUPERSEDED_BY_SUCCESSOR` with `successor_case_id` linked.
  6. The new case draft is created with `predecessor_case_id` linked.
  7. Downstream checklist integrators can invoke `activate_integration` with the new case ID to atomically advance their namespace binding.

---

## 6. Root Slot Contract Upgrader Migration

### Scenario: Deploying Contract Upgrades or Security Patches
- **Architecture**: In accordance with the GenLayer Intelligent Contract SDK, contract deployment initializes the upgrader slot:
  ```python
  root = gl.storage.Root.get()
  root.upgraders.get().append(gl.message.sender_address)
  ```
- **Governance Invariant**:
  Only addresses present in `root.upgraders` are authorized to deploy upgraded contract code.
- **Recovery Procedure**:
  1. The recorded Studio deployer/upgrader account submits the exact reviewed replacement source bytes through the verified contract upgrade method.
  2. The Root slot preserves all existing storage (`cases`, `assessments`, `integrations`, `events`).
  3. Upgraded contract logic is bound without data loss or state corruption.

### Authority-loss limits

- If Studio local data resets but the recorded account and Studionet state remain accessible, import the contract by address, verify the upgrader readback, and use the exact recorded source.
- If the recorded Studio account becomes unavailable, the existing contract may remain readable but its upgrade authority is not recoverable. Deploy a reviewed replacement and rerun all live tests and wiring.
- If Studionet state resets, the prior address/state cannot be recovered. Redeploy from the exact manifest and rerun the complete live matrix.
