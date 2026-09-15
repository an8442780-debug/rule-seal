# RuleSeal verification

## Release boundary

This release is a network-compatibility migration of the completed RuleSeal
product to GenLayer Studio Dev preview, chain `61997`. Product scope, contract
behavior, trust boundary and frontend workflows remain unchanged. The prior
Studionet deployment is invalidated for this release and supplies no contract,
receipt, state, readback or runtime proof.

Target runtime:

- RPC: `https://studio-dev.genlayer.com/api`
- SDK preset: `studioDevnet`
- Explorer: `https://explorer-studio-dev.genlayer.com/`
- Contract source hash and final revision: bound by the fresh PRE_DEPLOY package

Current Studio evidence baseline: Git revision
`3889af8747aacd712698782f959ec1191e86ff04`, contract source revision
`3c124aa0b5746ed03350639c28dc18e46a7a2dd7`, and canonical LF contract SHA-256
`FAE8EF0D956E06211E5E95A0EB7E15713D1E815B61E5E4E5820B1DC03247ADA4`.
The current frontend/release revision is bound separately to the exact GitHub
`main` commit recorded by the Vercel release package; it changes presentation
and documentation only and does not alter the deployed contract or Studio
operation ledger.

## Local checks

Run the pinned toolchain, not an ambient Python/GenVM installation:

```powershell
& E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
& E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\genvm-lint.exe check contracts\rule_seal.py
& E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\genvm-lint.exe validate contracts\rule_seal.py
Set-Location frontend
npm test -- --run
npm run build
```

The current migration candidate passes 26 Direct Mode tests with six disclosed
expected mock warnings, GenVM lint/semantic validation with 23 methods (16
view, 7 write), 108 frontend tests, TypeScript and Vite build. The pinned
toolchain venv is required for Direct Mode; the ambient Python installation may
attempt an unavailable public GenVM download.

## Compatibility checks

- Contract imports and message access use the current pinned SDK/runtime shape.
- The contract header pins the Studio Dev runner bundle.
- Live `studioDevnet` schema transport returns 23 methods (16 view, 7 write).
- Frontend chain, RPC, Explorer, SDK and wallet switching use chain `61997`.
- Write fees are estimated read-only through the exact selected provider/account,
  then the returned distribution and fee value are passed unchanged to the
  write. A binding change before journaling aborts without signing or writing.
- The app has no configured old contract address; the fresh address is inserted
  only after the new deployment is accepted.

## Fresh Studio Dev gate

The 61997 Studio gate is complete for POST_DEPLOY_TEST: deployment receipt,
FINALIZED status, semantic execution success, consensus/finality, exact
deployed-source parity, upgrader readback, lifecycle readbacks, integration
advancement, source-preserving upgrade rehearsal and the observable Studio RPC
ledger are recorded in [Studio evidence](STUDIONET-EVIDENCE.md). Per-operation
receipt, finality, semantic, consensus and authoritative-readback binding is
retained in
[the reconciliation ledger](STUDIO-OPERATION-RECONCILIATION-61997.md), whose
blob hash and exact HEAD must be bound by the POST_DEPLOY_TEST re-review
package. GitHub/Vercel source parity and production wallet E2E remain
downstream release gates.

## Evidence rule

Every accepted write must keep one stable operation ID and its transaction hash.
No blind resubmission is allowed. A wallet popup or CLI exit is not evidence of
success; finality, semantic execution and authoritative readback are required.
