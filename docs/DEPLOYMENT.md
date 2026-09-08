# RuleSeal Deployment Manifest

## Current release state

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- Contract address: `0x9D5ABdD0e8C606e16f45727066622c5C4a5601E2` (observed from Studionet deployment receipt; POST_DEPLOY acceptance pending)
- Deployment transaction: `0x7185f66549c5c0e474907226614a5860fc43ddb513764967416f8420eeef59ed` (observed; semantic acceptance pending)
- Explorer: `https://explorer-studio.genlayer.com/tx/0x7185f66549c5c0e474907226614a5860fc43ddb513764967416f8420eeef59ed`
- Source commit and SHA-256: source hash `2AEA0BBA3BF62EB052CD677A7007A1D40C57EB3F6E71585EC44C7B2E5DF8DF4E` matches `gen_getContractCode` bytes; exact source commit binding remains pending
- Deployment status: `FINALIZED` observed via `gen_getTransactionStatus`; EVM receipt `status=0x1`; semantic GenLayer execution and upgrader readback not yet verified
- Read-only deployment readback: `get_upgrader()` matched the selected account; initial `get_case_count()`, `get_integration_count()`, and `get_event_count()` each returned `0`
- User-selected Studio deployer/upgrader account: `0x5Be59b33326772376a01e96e525D6D18FC821113` (selection record only; control, balance and network remain unverified until Studio)

RuleSeal uses a new contract and a new storage identity. It does not reuse the predecessor contract address, state, deployment transaction, runtime records, or live evidence. The predecessor project remains an independent baseline outside this release.

Process note: the deployment transaction was user-submitted before the required PRE_DEPLOY anonymous approval was completed. This is retained as diagnostic history, not treated as PRE_DEPLOY-authorized or POST_DEPLOY-accepted evidence. No additional deployment or write may be sent until the governance state is reconciled.

## Recovery limits

Upgrade authority depends on the selected Studio account remaining available and Studionet state persisting. A network reset or lost account may require a reviewed replacement deployment. No recovery claim is valid until the new deployment manifest and authoritative readbacks are complete.

## Required post-deployment evidence

Record the new contract address, deployment transaction, exact deployed source hash, `FINALIZED` status, semantic execution success, consensus/finality, source parity, upgrader readback, lifecycle matrix, recovery ledger and public Explorer link here after deployment.
