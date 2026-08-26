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
- Contract address: pending fresh `PRE_DEPLOY` approval
- Deployment transaction: pending fresh `PRE_DEPLOY` approval
- Explorer: pending fresh `PRE_DEPLOY` approval

Changing the source, constructor, dependency header, classification, or locked account invalidates the `PRE_DEPLOY` package and requires a new review.

The prior deployment remains historical evidence only. Its exact-date versions-index dependency returned an empty `content_versions` list on unchanged dates, even though the authoritative dated full-section endpoint returned `HTTP_200`. The corrected source uses that point-in-time full endpoint directly; it does not weaken the exact Federal Register discovery, identity checks, validator refetch, or consequential equality rules. A fresh approval and deployment are required before this revision can become the release instance.

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
