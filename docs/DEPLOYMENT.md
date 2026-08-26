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
- Source commit: `b4aff7156b03dc040eb298290f276057cce47359`
- Source SHA-256: `E6466FDED2D1FF2195E4710AB78FD35DEFFF1F51EF97953B791853BE7E284B23`
- GenVM text-runner version header: `# v0.1.0`
- Linked contracts: none
- PRE_DEPLOY reviewer verdict: `APPROVED` for the exact source commit/hash/account above
- Contract address: `0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae`
- Deployment transaction: `0xd0589df3c0ccfacd875895362d61028b6a678381b6a94caac40dd8861464d695`
- Explorer: `https://explorer-studio.genlayer.com/address/0xb9E09Ff1596E1Fe4553CE047E10B44514f0928ae`
- Deployment result: `FINALIZED`, execution `SUCCESS`, consensus `MAJORITY_AGREE`
- Deployed code SHA-256: `E6466FDED2D1FF2195E4710AB78FD35DEFFF1F51EF97953B791853BE7E284B23`
- Finalized `get_upgrader()` readback: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`

Changing the source, constructor, dependency header, classification, or locked account invalidates the `PRE_DEPLOY` package and requires a new review.

This exact revision replaces the historical deployment. Its point-in-time full-section endpoint resolves unchanged eCFR dates without relying on an empty amendment-date index, while retaining exact Federal Register discovery, identity checks, validator refetch, and consequential equality rules. The complete current matrix is in `docs/STUDIONET-EVIDENCE.md`.

## Safe upgrade rehearsal for the release revision

- Isolated rehearsal address: `0xeF15ce6DD33341fb9D2Bbf35b0668090a556680f`
- Deploy transaction: `0xa567caadd878e028a0a6be478b6287d09b8a36573a8134dc0144e179579871c7` (`FINALIZED`, `SUCCESS`)
- Same-code upgrade: `0x412af4e29bbbb7e29837638fd6245170d8a4da2b0f4166ad017bc73c2edf8f4e` (`FINALIZED`, `MAJORITY_AGREE`)
- Post-upgrade code SHA-256: `E6466FDED2D1FF2195E4710AB78FD35DEFFF1F51EF97953B791853BE7E284B23`
- Post-upgrade finalized readbacks: upgrader remains the locked account; `get_case_count()` is `0`.
- Unauthorized exact-code upgrade from `0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1`: `0xce505e3f6ef74a463882cacf7e20a9a544f3b427d01e24403b471e99efd68190`, `FINALIZED`, execution `ERROR`, consensus result `6`, exact validator error `UPGRADE_NOT_AUTHORIZED`.
- After rejection: code hash, upgrader, and zero-case state are unchanged.

## Recovery limits

Upgrade authority depends on continued access to the locked Studio account and persistence of Studionet state. If the account becomes unavailable, the existing instance may remain readable but its upgrade authority cannot be recovered; a reviewed replacement deployment is required. If Studionet resets, the old address and state cannot be recovered. In both cases, restore from the exact recorded source/manifest, rerun the complete live matrix, and update every frontend and evidence reference.

## Superseded POST_DEPLOY_TEST evidence

The following evidence belongs to source hash `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814` and is not release evidence for the current source:

- Deployment: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted`.
- Explorer code SHA-256: `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814` (exact source parity).
- Finalized upgrader readback: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Separate rehearsal instance: `0xB4A43d6CE9B50976Ec412F5ab80ec6dcC590bA61`.
- Rehearsal deploy transaction: `0x1e287251aa10a554b398e1d5cc48b60717c3b96095d795a79042f84891f9d9a8` (`FINALIZED`, `SUCCESS`).
- Same-code safe upgrade transaction: `0x96edfcc98cb85de9ea05e6ae5eeb54978208c3ba8898e71dcb957251a44839b8` (`FINALIZED`); finalized upgrader readback remained the locked account.
- Rehearsal Explorer code after upgrade hashes to the approved source SHA-256 above; finalized `get_case_count()` remained `0`, proving state preservation.
- Complete smallest-sufficient ledger: `docs/STUDIONET-EVIDENCE.md`.
