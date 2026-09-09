# RuleSeal recovery

These procedures define the recovery boundaries. Studio rollback, cooldown rejection, same-source upgrade preservation and production-wallet journal recovery have live evidence.

## Pending transaction

Keep the hash and browser journal. Reconcile the same operation; never resubmit because a modal is slow, a tab reloaded or an RPC timed out. FINALIZED alone may include failed execution.

Success requires finality, successful execution and expected authoritative readback. Unknown results/readback failures retain pending records. Do not clear browser storage to unlock a write. Journals are origin/profile-local, not canonical state.

The transaction dialog distinguishes wallet confirmation, submission, finality, execution verification and readback. Only the completed sequence reports success. Code 4001 is wallet rejection; an unknown wallet error or invalid hash remains reconciliation-required, including before a hash is known.

Recovery storage is scoped to the configured chain and contract. Account-specific readback uses the sender captured with the submitted operation, not whichever account is connected later. Malformed/unavailable storage blocks new writes without deleting it. A pre-hash record remains locked after reload: inspect wallet transaction activity before deciding whether anything was submitted; the application cannot infer non-submission from a missing hash.

If persistence fails after submission, keep the page open and copy the displayed hash. The volatile journal protects the current page, but cannot guarantee recovery after closing it. Do not claim cross-tab atomicity from localStorage. Finalized success does not clear the record until its method-specific expected identity and state agree; failed cleanup remains locked.

Foreground polling stops after at most 24 reads or five minutes. A hidden page makes no further polls and ends at its deadline. An unavailable read stops verification rather than silently submitting another write. Physical-network budgets, cancellation of underlying SDK requests and full reload-budget enforcement still require completion and measurement before release.

The production integration recovery proved that method-specific expectations must use the contract's canonical stored state. A stale frontend expectation of `ACTIVE` falsely produced `RECONCILIATION_REQUIRED` even though the transaction was finalized successfully; the final matcher requires `BOUND_TO_CASE`. Reload reconciliation then used the retained sender, namespace, case and hash, performed authoritative readback, cleared the journal and submitted no new write.

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

Root Slot authorization does not prove storage compatibility. Review the exact replacement source and layout before any upgrade. RuleSeal rehearsed the approved source against its acceptance contract only after meaningful case, lineage and integration state existed, then verified finality, semantic upgrade success, exact source parity, unchanged authority and before/after state readbacks. A future source-changing upgrade requires fresh source, compatibility and state-preservation verification.

RuleSeal is independent and migrates no old state. Never modify the original project's deployment/release.

Lost upgrader access has no demonstrated bypass. A Studionet reset cannot be repaired from browser metadata. Any replacement requires its own review, deployment, wiring and new evidence, not an automatic retry.
