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
- Source SHA-256: `7F735741AA583196199F254CAA284B3F63A8D2D4E47EC139451CE7C937EDEA9A`
- Linked contracts: none
- Deployment transaction/address/Explorer: pending `PRE_DEPLOY` approval; no transaction has been signed or sent

Changing the source, constructor, dependency header, classification, or locked account invalidates the `PRE_DEPLOY` package and requires a new review.

## Recovery limits

Upgrade authority depends on continued access to the locked Studio account and persistence of Studionet state. If the account becomes unavailable, the existing instance may remain readable but its upgrade authority cannot be recovered; a reviewed replacement deployment is required. If Studionet resets, the old address and state cannot be recovered. In both cases, restore from the exact recorded source/manifest, rerun the complete live matrix, and update every frontend and evidence reference.

## Post-deployment fields

The following remain intentionally blank until approved deployment and authoritative verification:

- Contract address:
- Deployment transaction:
- Explorer URL:
- Deployed source readback/hash:
- Upgrader readback:
- Upgrade rehearsal evidence:
- Studio live-test ledger:
