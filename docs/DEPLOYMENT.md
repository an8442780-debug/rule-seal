# RuleSeal Deployment Manifest

## Acceptance deployment

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- PRE_DEPLOY-approved package revision: `e548d7f7880e5305203706f5db39e1caeeafd8f8`
- Contract source blob revision: `1ab01447771d194fd771bcd3d82a1135123f7ab0` (unchanged at the approved package revision)
- Contract address: `0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`
- Deployment transaction: `0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`
- Explorer: `https://explorer-studio.genlayer.com/tx/0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`
- Locked deployer/upgrader: `0x15872d1887b8ff7322F2aa7c3c535f1F00dbb452`
- Canonical deployed source: 33,327 UTF-8 bytes, 787 LF, zero CR, SHA-256 `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`.
- Deployment receipt: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted` / RPC `MAJORITY_AGREE`, five initial validators.
- Initial authoritative readbacks: upgrader equals the locked account; case, integration and event counts were zero.

The deployment was submitted once in Normal (Full Consensus) mode through GenLayer Studio. The raw RPC deployment payload was decoded and hashed without newline normalization; it exactly matches the reviewed LF Git blob.

RuleSeal uses a new contract and storage identity. It does not reuse the predecessor contract address, state, deployment transaction, runtime records or live evidence.

## Upgrade rehearsal

- Transaction: `0xdea5600481914e562fbecd299df368d9ba22963b23d0474fdb9befe01988f77d`
- Explorer: `https://explorer-studio.genlayer.com/tx/0xdea5600481914e562fbecd299df368d9ba22963b23d0474fdb9befe01988f77d`
- Result: `FINALIZED`, RPC result `6` / `MAJORITY_AGREE`, `consensus_data.upgrade_result=success`.
- Replacement source: 33,327 UTF-8 bytes, 787 LF, zero CR, SHA-256 `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`.
- Post-upgrade readbacks preserved: predecessor `SUPERSEDED_BY_SUCCESSOR`; successor `LOCKED`; unresolved case `UNRESOLVED`; rollback case `FROZEN`; integration points to the successor and retains `previous_case_id`; upgrader remains the locked account.

This was a same-source rehearsal on the acceptance contract. It did not create a second deployment or claim a source change.

## Permanently excluded diagnostic deployment

Transaction `0x7185f66549c5c0e474907226614a5860fc43ddb513764967416f8420eeef59ed` and address `0x9D5ABdD0e8C606e16f45727066622c5C4a5601E2` were created before required PRE_DEPLOY approval. They remain `DIAGNOSTIC_NON_ACCEPTANCE` and are excluded from every RuleSeal acceptance row.

Its deployed bytes used CRLF and hash to `2AEA0BBA3BF62EB052CD677A7007A1D40C57EB3F6E71585EC44C7B2E5DF8DF4E`; the approved acceptance deployment uses the canonical LF hash above. Raw-byte equality, not normalized-text equality, is the release rule.

## Recovery limits

Upgrade authority depends on the locked Studio account remaining available and Studionet state persisting. A network reset or lost account requires a reviewed replacement deployment. Browser metadata is not canonical state; recovery always starts from finalized receipts and authoritative contract readbacks.
