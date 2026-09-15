# RuleSeal Deployment Manifest

## Target acceptance deployment

- Network: GenLayer Studio Dev preview
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- SDK preset: `studioDevnet`
- Contract address: `0x63F046607998E02f7888a557a60c1e5bdD925C65`
- Deployment transaction: `0xc1e62765de2b5c53dcb8d8628f12c2b7a24f00b813b53a4011fad362dbc3ba16`
- Explorer: `https://explorer-studio-dev.genlayer.com/address/0x63F046607998E02f7888a557a60c1e5bdD925C65`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Linked contracts: none
- Locked deployer/upgrader: recorded in the private preflight record, never in frontend configuration
- Deployed source revision: `3c124aa0b5746ed03350639c28dc18e46a7a2dd7`
- Canonical deployed source SHA-256: `FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4`
- Deployed code readback: `33,413` UTF-8 bytes, `789` LF, `0` CRLF; first line `# v0.3.0`
- Deployment receipt: `FINALIZED`, EVM status `0x1`, semantic execution `FINISHED_WITH_RETURN`, consensus result `MAJORITY_AGREE`
- Schema readback: `23` methods (`16` view, `7` write), zero constructor parameters
- Upgrader readback: matches the locked Studio Dev upgrader recorded in the private preflight record

The prior Studionet deployment is invalidated for this migration. Its address,
receipts, state, readbacks and runtime records are not reused as RuleSeal
evidence. The source and network-independent tests remain usable only where the
exact reviewed source and behavior are unchanged.

The acceptance deployment was submitted once through the approved Studio Dev
tool path after PRE_DEPLOY approval. A transaction is accepted only after
FINALIZED status, semantic execution success, consensus/finality and
authoritative readback were independently recorded.

## Upgrade rehearsal

- Operation: source-preserving replacement with the canonical LF source bytes
- Result: `FINALIZED`, semantic execution `FINISHED_WITH_RETURN`
- Source bytes supplied: `33,413`
- Post-rehearsal deployed-code SHA-256: `FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4`
- State preservation: `REAL-000001` and `REAL-000003` retain their terminal lineage; `REAL-000004` and `REAL-000005` retain locked state and successor links; the integration remains bound to `REAL-000005`
- Unauthorized upgrader simulation: rejected before broadcast; no hash and no state mutation

## Recovery limits

An uncertain or failed write is reconciled by its original operation ID and
transaction hash; it is never blindly resubmitted. Diagnostic failures and
pre-broadcast authorization/cooldown rejections remain in the toolchain journal
and are not reclassified as successful evidence. A network reset or lost
control requires a separately reviewed replacement deployment. Until the new
61997 release has its own complete evidence package, the old Studionet release
must not be presented as a substitute.
