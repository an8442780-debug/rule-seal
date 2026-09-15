# RuleSeal Deployment Manifest

## Target acceptance deployment

- Network: GenLayer Studio Dev preview
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- SDK preset: `studioDevnet`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- Locked deployer/upgrader: recorded in the private preflight record, never in frontend configuration
- Contract address: **PENDING FRESH 61997 DEPLOYMENT**
- Deployment transaction: **PENDING FRESH 61997 DEPLOYMENT**
- Explorer: **PENDING FRESH 61997 DEPLOYMENT**
- Canonical deployed source: **PENDING FRESH 61997 SOURCE READBACK**
- Deployment receipt: **PENDING FRESH 61997 RECEIPT**
- Initial authoritative readbacks: **PENDING FRESH 61997 READBACK**

The prior Studionet deployment is invalidated for this migration. Its address,
receipts, state, readbacks and runtime records are not reused as RuleSeal
evidence. The source and network-independent tests remain usable only where the
exact reviewed source and behavior are unchanged.

The acceptance deployment must be submitted once, through the approved Studio
Dev tool path, after PRE_DEPLOY approval. A transaction is accepted only after
FINALIZED status, semantic execution success, consensus/finality and
authoritative readback are independently recorded.

## Upgrade rehearsal

- Status: **PENDING FRESH 61997 DEPLOYMENT**
- Requirement: verify upgrader readback and source-preserving state retention on
  the new deployment, using a separate governed operation ID and fresh receipt.

## Recovery limits

An uncertain or failed write is reconciled by its original operation ID and
transaction hash; it is never blindly resubmitted. A network reset or lost
control requires a separately reviewed replacement deployment. Until the new
61997 release has its own complete evidence package, the old Studionet release
must not be presented as a substitute.
