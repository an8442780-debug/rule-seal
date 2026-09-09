# RuleSeal Deployment Manifest

## Acceptance deployment

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- Contract address: `0x785bbfD7eb3de51Fc9548D31b38813CB40c258Fb`
- Deployment transaction: `0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`
- Explorer: `https://explorer-studio.genlayer.com/tx/0x92dd901676060279683a5628394c6afd9fc99516790376e3ce502ac1467b2106`
- Canonical deployed source: 33,327 UTF-8 bytes, 787 LF, zero CR, SHA-256 `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`.
- Deployment receipt: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted` / RPC `MAJORITY_AGREE`, five initial validators.
- Initial authoritative readbacks: case, integration and event counts were zero.

The deployment was submitted once in Normal (Full Consensus) mode through GenLayer Studio. The raw RPC deployment payload was decoded and hashed without newline normalization; it exactly matches the reviewed LF Git blob.

RuleSeal uses its own contract and storage identity. The public deployment record above is the authoritative deployment reference for this product.

## Upgrade rehearsal

- Transaction: `0xdea5600481914e562fbecd299df368d9ba22963b23d0474fdb9befe01988f77d`
- Explorer: `https://explorer-studio.genlayer.com/tx/0xdea5600481914e562fbecd299df368d9ba22963b23d0474fdb9befe01988f77d`
- Result: `FINALIZED`, RPC result `6` / `MAJORITY_AGREE`, `consensus_data.upgrade_result=success`.
- Replacement source: 33,327 UTF-8 bytes, 787 LF, zero CR, SHA-256 `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`.
- Post-upgrade readbacks preserved: predecessor `SUPERSEDED_BY_SUCCESSOR`; successor `LOCKED`; unresolved case `UNRESOLVED`; rollback case `FROZEN`; integration points to the successor and retains `previous_case_id`; upgrader remains the locked account.

This was a same-source rehearsal on the acceptance contract. It did not create a second deployment or claim a source change.

## Recovery limits

Upgrade authority depends on the authorized deployment control remaining available and Studionet state persisting. A network reset or lost control requires a separately verified replacement deployment. Recovery always starts from finalized receipts and authoritative contract readbacks.
