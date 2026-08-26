# Fixture Provenance

The four `official_*` files are unmodified captures from the official eCFR and Federal Register APIs. Compact search-result fixtures retain only fields needed to exercise bounded discovery.

| Fixture | Official source | Bound identity |
|---|---|---|
| `official_federal_register_2025_16493_exact.json` | `https://www.federalregister.gov/api/v1/documents/2025-16493.json` | Unmodified capture: `2025-16493`; `90 FR 41889`; published `2025-08-28`; effective `2025-09-15`; docket `FAA-2025-1763` |
| `official_federal_register_2024_19004_exact.json` | `https://www.federalregister.gov/api/v1/documents/2024-19004.json` | Unmodified capture: `2024-19004`; `89 FR 68337`; published `2024-08-26`; effective `2024-09-15`; docket `FAA-2024-2061` |
| `official_ecfr_2025_09_15_title14_section71_1.xml` | `https://www.ecfr.gov/api/versioner/v1/full/2025-09-15/title-14.xml?part=71&section=71.1` | Unmodified capture: docket `FAA-2025-1763`; section citation `90 FR 41890`; `FAA Order JO 7400.11K`; effective `2025-09-15` |
| `official_ecfr_2024_09_15_title14_section71_1.xml` | `https://www.ecfr.gov/api/versioner/v1/full/2024-09-15/title-14.xml?part=71&section=71.1` | Unmodified capture: docket `FAA-2024-2061`; section citation `89 FR 68338`; `FAA Order JO 7400.11J`; effective `2024-09-15` |

Synthetic conflict, savings-clause, no-reference, delayed-initial-reference, and prompt-injection fixtures are explicitly adversarial test inputs, not represented as captured official records.
