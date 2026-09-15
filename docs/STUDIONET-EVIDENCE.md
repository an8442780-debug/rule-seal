# RuleSeal Studio Dev Evidence

## Evidence boundary

This ledger is reserved for the migrated Studio Dev preview release:

- Network: `studio-dev`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Contract: **PENDING FRESH 61997 DEPLOYMENT**
- Source revision: **BOUND AT PRE_DEPLOY**
- Canonical source hash: **BOUND AT PRE_DEPLOY**

The previous Studionet deployment is invalidated for this release. Its contract
address, receipts, state, readbacks and runtime records are retained only in
historical task records and are not proof for this ledger.

## Required fresh evidence

Every acceptance write must retain its stable operation ID and hash, and must be
accepted only after all of the following are recorded:

1. `FINALIZED` transaction status.
2. Successful EVM receipt and semantic GenVM execution result.
3. Consensus/finality result.
4. Authoritative state readback matching the requested transition.
5. Source/code readback matching the exact reviewed bytes.

Required lifecycle rows are: DRAFT → FROZEN → LOCKED, UNRESOLVED and its
cooldown/cap rollback, date-boundary behavior, successor lineage and
supersession, integration binding/advancement, unauthorized rejection,
validator disagreement fail-closed behavior, and upgrader/state preservation.

## Current status

Fresh 61997 deployment and E2E evidence: **NOT STARTED — PRE_DEPLOY GATE**.

Local Direct Mode and live schema checks are supporting evidence only; they do
not substitute for the new network's receipts, consensus, semantic execution
or authoritative readbacks.
