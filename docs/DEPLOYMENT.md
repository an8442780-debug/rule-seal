# Deployment Manifest

## PRE_DEPLOY lock

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Classification: `UPGRADABLE`
- Constructor arguments: none
- Locked Studio deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`
- Intended role: deployer and Root Slot upgrader
- Contract source: `contracts/regulatory_edition_applicability_lock.py`
- Source SHA-256: `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814`
- GenVM text-runner version header: `# v0.1.0`
- Linked contracts: none
- Contract address: `0xe748F61a8F8C6c140E7511F717e5Eec255f9401e`
- Deployment transaction: `0xcbb42ed3750cd5142f54c6f9f2dab53df7028bb62d3f1a59d9de9b8f25785d64`
- Explorer: `https://explorer-studio.genlayer.com/address/0xe748F61a8F8C6c140E7511F717e5Eec255f9401e`

Changing the source, constructor, dependency header, classification, or locked account invalidates the `PRE_DEPLOY` package and requires a new review.

The prior reviewed source (`02058B6B...C609`) was rejected by Studionet schema extraction before signing with `invalid_contract absent_runner_comment`. No deployment transaction was created. The only source correction is the required GenVM text-runner version line above; the pinned `py-genlayer` dependency and all contract behavior remain unchanged.

## Recovery limits

Upgrade authority depends on continued access to the locked Studio account and persistence of Studionet state. If the account becomes unavailable, the existing instance may remain readable but its upgrade authority cannot be recovered; a reviewed replacement deployment is required. If Studionet resets, the old address and state cannot be recovered. In both cases, restore from the exact recorded source/manifest, rerun the complete live matrix, and update every frontend and evidence reference.

## POST_DEPLOY_TEST evidence

- Deployment: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted`.
- Explorer code SHA-256: `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814` (exact source parity).
- Finalized upgrader readback: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Separate rehearsal instance: `0xB4A43d6CE9B50976Ec412F5ab80ec6dcC590bA61`.
- Rehearsal deploy transaction: `0x1e287251aa10a554b398e1d5cc48b60717c3b96095d795a79042f84891f9d9a8` (`FINALIZED`, `SUCCESS`).
- Same-code safe upgrade transaction: `0x96edfcc98cb85de9ea05e6ae5eeb54978208c3ba8898e71dcb957251a44839b8` (`FINALIZED`); finalized upgrader readback remained the locked account.
- Complete smallest-sufficient ledger: `docs/STUDIONET-EVIDENCE.md`.
