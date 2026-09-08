# RuleSeal Deployment Manifest

## Future acceptance deployment

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- Contract address: blank until the first governance-eligible deployment.
- Deployment transaction: blank until the first governance-eligible deployment.
- Explorer: blank until the first governance-eligible deployment.
- Canonical deployable source bytes: LF line endings, enforced by `.gitattributes`; SHA-256 `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A` for the unchanged contract blob currently at source commit `1ab01447771d194fd771bcd3d82a1135123f7ab0`.
- Studio deployer/upgrader account: `0x15872d1887b8ff7322F2aa7c3c535f1F00dbb452`, selected directly in the Codex in-app Browser. It initially displayed `0 GEN`; the user then used the Studio faucet, and primary-AI readback displayed `1,000,000 GEN`. The faucet is disclosed as user-performed setup, not an AI-performed acceptance transaction. No deployment or contract write was sent. Loss of access to this locked account blocks deployment and requires scoped re-review.
- Deployment status, semantic result, consensus/finality, source parity and authoritative readbacks: blank until governance-eligible deployment evidence exists.

RuleSeal uses a new contract and a new storage identity. It does not reuse the predecessor contract address, state, deployment transaction, runtime records, or live evidence. The predecessor project remains an independent baseline outside this release.

## Permanently excluded diagnostic deployment

The prior transaction `0x7185f66549c5c0e474907226614a5860fc43ddb513764967416f8420eeef59ed` and address `0x9D5ABdD0e8C606e16f45727066622c5C4a5601E2` were created before required `PRE_DEPLOY` approval. They are permanently classified as diagnostic and can never become the RuleSeal acceptance deployment or satisfy acceptance E2E rows. Read-only diagnostics observed `FINALIZED`, EVM receipt `status=0x1`, `get_upgrader()` matching that diagnostic deployment's account and zero initial counts; semantic GenLayer success was not proven.

Exact-byte reconciliation: deployed diagnostic RPC bytes and the prior Windows checkout used CRLF and hash to `2AEA0BBA3BF62EB052CD677A7007A1D40C57EB3F6E71585EC44C7B2E5DF8DF4E`. The immutable Git blob at commit `1ab01447771d194fd771bcd3d82a1135123f7ab0` uses LF and hashes to `5A2B820886BB776B5E8C7E1C1FEBC0CA6B4C661F661352B87F100CE04FCD9C0A`. The hashes were computed over raw bytes; newline normalization is not used to claim parity. The future acceptance deployment must use the canonical LF checkout and its raw RPC code must equal the reviewed LF hash.

## Recovery limits

Upgrade authority depends on the selected Studio account remaining available and Studionet state persisting. A network reset or lost account may require a reviewed replacement deployment. No recovery claim is valid until the new deployment manifest and authoritative readbacks are complete.

## Required post-deployment evidence

Record the new contract address, deployment transaction, exact deployed source hash, `FINALIZED` status, semantic execution success, consensus/finality, source parity, upgrader readback, lifecycle matrix, recovery ledger and public Explorer link here after deployment.
