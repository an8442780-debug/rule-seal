# Studionet Evidence Ledger

## Exact revision binding

- PRE_DEPLOY approval: commit `7682446af00278c281646c7dbc6526eb05151c27`.
- Contract SHA-256: `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814`.
- Locked deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Network: Studionet, chain ID `61999`.

## Retained pre-signing failure

The previously reviewed source without `# v0.1.0` failed Studio schema extraction with `invalid_contract absent_runner_comment`. No signature or transaction was created. After the metadata-only correction and fresh PRE_DEPLOY approval, schema extraction reached the no-parameter deployment screen.

## Primary deployment and lifecycle

| Step | Transaction | Final result | Authoritative readback |
|---|---|---|---|
| Deploy | `0xcbb42ed3750cd5142f54c6f9f2dab53df7028bb62d3f1a59d9de9b8f25785d64` | `FINALIZED`, `SUCCESS`, consensus `Accepted` | Address `0xe748F61a8F8C6c140E7511F717e5Eec255f9401e`; upgrader is locked account |
| Create case | `0xbb59b77bb317b7bca038278ef45b065e1d7b3e010a3cdaec2f1aa357ac074088` | `FINALIZED`, `SUCCESS` | nonce `studio-e2e-20260826-a` resolves to `REAL-000001`, state `DRAFT` |
| Freeze case | `0x3a26f3f22c4f66557c2dca08daba14a02925fc0ca4d53104bfcf06cdb5f53fcd` | `FINALIZED`, `SUCCESS` | `REAL-000001` state `FROZEN`, frozen timestamp recorded |
| Assess case | `0x92e3bd501187b8f5b04e61050a8ecf3538b1663ada844e255a930b948681a191` | `FINALIZED`, `SUCCESS`; one retained majority-disagreement leader rotation before acceptance | state `LOCKED`; assessment `REAL-000001-A01`; `EDITION_APPLIES`; edition `FAA Order JO 7400.11K` |
| Bind integration | `0xb56c3634147cb2628b6f77038af18188fd73d51ac1c7cace79ae4b3853a7e58b` | `FINALIZED`, `SUCCESS` | namespace `flight-dispatch-e2e`, state `BOUND_TO_CASE`, case `REAL-000001` |

The finalized assessment binds eCFR date `2025-09-15`, section fingerprint `3701c85bb8bdb6508fa2216d70142ac9c71f13bec125a804e846ad618d8910db`, and Federal Register document `2025-16493` published `2025-08-28`, effective `2025-09-15`. All four official source requests returned `HTTP_200`.

Explorer: `https://explorer-studio.genlayer.com/address/0xe748F61a8F8C6c140E7511F717e5Eec255f9401e`. Explorer shows all five primary transactions `FINALIZED` with GenVM `SUCCESS`; its rendered contract code hashes to the exact approved SHA-256 above.

## Safe upgrade rehearsal

- Separate instance: `0xB4A43d6CE9B50976Ec412F5ab80ec6dcC590bA61`.
- Deploy: `0x1e287251aa10a554b398e1d5cc48b60717c3b96095d795a79042f84891f9d9a8`, `FINALIZED`, `SUCCESS`.
- Same-code upgrade: `0x96edfcc98cb85de9ea05e6ae5eeb54978208c3ba8898e71dcb957251a44839b8`, `FINALIZED`.
- Finalized post-upgrade `get_upgrader()` remained `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.

The rehearsal did not alter the primary release instance.
