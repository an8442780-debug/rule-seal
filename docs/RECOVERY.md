# RuleSeal recovery

These procedures describe safety boundaries, not verified live RuleSeal recovery.

## Pending transaction

Keep the hash and browser journal. Reconcile the same operation; never resubmit because a modal is slow, a tab reloaded or an RPC timed out. FINALIZED alone may include failed execution.

Success requires finality, successful execution and expected authoritative readback. Unknown results/readback failures retain pending records. Do not clear browser storage to unlock a write. Journals are origin/profile-local, not canonical state.

The transaction dialog distinguishes wallet confirmation, submission, finality, execution verification and readback. Only the completed sequence reports success. Code 4001 is wallet rejection; an unknown wallet error or invalid hash remains reconciliation-required, including before a hash is known.

Recovery storage is scoped to the configured chain and contract. Account-specific readback uses the sender captured with the submitted operation, not whichever account is connected later. Malformed/unavailable storage blocks new writes without deleting it. A pre-hash record remains locked after reload: inspect wallet transaction activity before deciding whether anything was submitted; the application cannot infer non-submission from a missing hash.

If persistence fails after submission, keep the page open and copy the displayed hash. The volatile journal protects the current page, but cannot guarantee recovery after closing it. Do not claim cross-tab atomicity from localStorage. Finalized success does not clear the record until its method-specific expected identity and state agree; failed cleanup remains locked.

Foreground polling stops after at most 24 reads or five minutes. A hidden page makes no further polls and ends at its deadline. An unavailable read stops verification rather than silently submitting another write. Physical-network budgets, cancellation of underlying SDK requests and full reload-budget enforcement still require completion and measurement before release.

## RPC and source failures

Distinguish frontend RPC errors from government-source failures in assessment. Preserve the error, request count and fault domain. Use bounded retries; no request storms or silent endpoint changes. Studio and frontend budgets are separate and require measured compliance.

An agreed unavailable-source assessment may leave UNRESOLVED. After 3600 seconds from the last attempt, retry_unresolved reserves FROZEN; a separate assess_case performs the next assessment. The cap is three total assessments.

At the cap, a new nonce cannot bypass identical-input fingerprint protection. An UNRESOLVED predecessor cannot create a successor. Preserve evidence and report the limitation; do not bypass guards or automatically redeploy.

Consensus rejection is not a stored UNRESOLVED outcome. Read actual state before choosing the eligible action.

## Successor and integration

1. Owner selects a LOCKED or NOT_APPLICABLE predecessor with no successor.
2. Create a successor for a different activity date and fresh caller nonce.
3. Read reciprocal lineage and successor DRAFT; predecessor is not superseded yet.
4. Owner freezes; resolver assesses.
5. Only successor LOCKED or NOT_APPLICABLE supersedes predecessor; UNRESOLVED leaves it unchanged.
6. Integrator explicitly advances its namespace only to the declared LOCKED successor.
7. Read case_id and previous_case_id. A still-LOCKED same-case rebind is a no-op; NOT_APPLICABLE is not bindable.

## Upgrade and authority loss

Root Slot authorization does not prove storage compatibility. Review exact replacement source/layout and rehearse on the designated disposable instance with meaningful case, lineage and integration state. Verify authorization, source parity and before/after readbacks.

RuleSeal is independent and migrates no old state. Never modify the original project's deployment/release.

Lost upgrader access has no demonstrated bypass. A Studionet reset cannot be repaired from browser metadata. Any replacement requires its own review, deployment, wiring and new evidence, not an automatic retry.
