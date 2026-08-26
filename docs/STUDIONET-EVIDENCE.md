# Studionet Evidence Ledger

> Historical ledger: every transaction below belongs to the superseded source hash `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814`. It is retained to preserve failed attempts and diagnosis, but it is not claimed as live proof for source commit `b4aff7156b03dc040eb298290f276057cce47359` / hash `E6466FDED2D1FF2195E4710AB78FD35DEFFF1F51EF97953B791853BE7E284B23`.

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
- Explorer post-upgrade code SHA-256 remained `F46CC3F52867E1B78517789074B46FBA34B23171F00EDAFCE40AC80CEC433814`.
- Finalized post-upgrade `get_case_count()` returned `0`, proving preserved empty pre-upgrade state.

The rehearsal did not alter the primary release instance.

## Rehearsal live matrix

The rehearsal instance uses the exact approved source, locked account, and validator set. It is isolated from the primary release state so boundary and rejection cases cannot contaminate the canonical lifecycle.

| Criterion / risk | Transaction | Final result | Authoritative result |
|---|---|---|---|
| Boundary create: before effective date (`2025-09-14`) | `0x8782c914d26e221dcb75c2a8f43b4739b0b7605d4174afa781afc51518cc80e0` | `FINALIZED`, `SUCCESS` | `REAL-000001`, exact date/fingerprint stored |
| Boundary create: at effective date (`2025-09-15`) | `0x123ace74a327b9cc9d8c2a49b13e2669641530a6e6c13b2b9a17778844a015c0` | `FINALIZED`, `SUCCESS` | `REAL-000002`, exact date/fingerprint stored |
| Boundary create: after effective date (`2025-09-16`) | `0x4782b54906f31ffef8ac3ce59bc9003cfdd27951fcc51618d0527b3a5d2cbd74` | `FINALIZED`, `SUCCESS` | `REAL-000003`, exact date/fingerprint stored |
| Freeze at boundary | `0x302a5242e2d7d340e3544d640783f4077b57b39cce29a109f280ccccdcc98784` | `FINALIZED`, `SUCCESS` | `REAL-000002` became `FROZEN` |
| Freeze after boundary | `0xbffa848e86282229a04dc9b00760ec569bc8289acb6e61aee7e53a92676bae5f` | `FINALIZED`, `SUCCESS` | `REAL-000003` became `FROZEN` |
| Assess at boundary | `0x89f141b37f832bf29eae80fcb28f6e16f53147941b5b7dc68f0d048da5f93f4f` | `FINALIZED`, `SUCCESS` | `REAL-000002` became `LOCKED`; assessment `REAL-000002-A01` |
| Upstream unavailable after boundary | `0xcbd6b220d5caf346c071cc08dde6a469871781244f707e903422e901a4b20c93` | `FINALIZED`, `SUCCESS` | `REAL-000003` became `UNRESOLVED`; `UPSTREAM_SOURCE_UNAVAILABLE`; eCFR full text `HTTP_200`, version index `UNAVAILABLE` |
| Immediate retry cooldown | `0x89f3d592fe4652d0bee0bcfb8587d28534d7695df1acebe96aab5ce1bd4aadba` | `FINALIZED`, `ERROR`, rollback | exact error `RETRY_COOLDOWN_ACTIVE`; case remains `UNRESOLVED`, attempt count `1` |
| Create successor lineage | `0x1828a30c20dc363a647a5fc98908b23e3c98644c5d422b5ffe4fd8711dc59760` | `FINALIZED`, `SUCCESS` | `REAL-000004.predecessor_case_id = REAL-000002`; predecessor points to successor |
| Freeze successor | `0x560c842e03f00dca36df7ff90b7564370151695ed38866178fce8f115078b82a` | `FINALIZED`, `SUCCESS` | successor became `FROZEN` |
| Successor evidence unavailable | `0x5e79938301f35bac15e18e14657c6eead54d278bd0cf6387b65c16f95de74088` | `FINALIZED`, `SUCCESS` | successor became `UNRESOLVED`, preserving predecessor lineage |
| Reject successor from non-terminal case | `0xa40346c598a1b5ea837c5dff2402cd781cd6aea3212afb182c465c1be01c14d8` | `FINALIZED`, `ERROR`, rollback | exact error `OLD_CASE_NOT_TERMINAL`; no new case |
| Freeze before-boundary case | `0x270f530d8f5d412bafb902e975b76d344e10d9e963f3b453098a75a73a06385d` | `FINALIZED`, `SUCCESS` | `REAL-000001` became `FROZEN` |
| Before-boundary evidence unavailable | `0x5618e6fed12d09fae488fd77f94987e30a46f42ca01f57aab03079fc56cb1497` | `FINALIZED`, `SUCCESS` | `REAL-000001` became `UNRESOLVED`; no unsafe applicability lock |
| Duplicate nonce replay | `0x6ffae68b4207c8345c9a2ff38116537bda11d379d3f3be8749fc1b6705994a67` | `FINALIZED`, `ERROR`, rollback | exact error `DUPLICATE_NONCE`; finalized `get_case_count()` remains `4` |
| Non-owner freeze | `0xf6455fbd0f3ed7ef60389d514f44a8bf1e11c7bf9dfded9d817b0d561622be77` | distinct actor `0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1`; `FINALIZED`, `ERROR`, rollback | exact error `NOT_CASE_OWNER`; finalized `REAL-000004` owner/state/attempt remain unchanged |
| Unauthorized upgrade | `0xbf79c0e28ee720692c70c30d5a1a6d12f9420ce7a13a2f181baecccf564d3051` | distinct actor above; `FINALIZED`, `ERROR`, rollback | exact error `UPGRADE_NOT_AUTHORIZED`; finalized upgrader remains locked account and Explorer code hash remains approved hash |

The official exact-date versions index returned `HTTP_200` with an empty `content_versions` list on unchanged calendar dates while the authoritative dated full-section endpoint returned `HTTP_200`. Treating that empty amendment-date index as unavailable was the root cause of the unresolved boundary/successor cases. Source commit `b4aff7156b03dc040eb298290f276057cce47359` removes that unnecessary index dependency and retains the authoritative point-in-time full-section fetch plus exact Federal Register verification. Because this is a source change, all transactions above are historical and the full required matrix must be rerun after fresh `PRE_DEPLOY` approval.
