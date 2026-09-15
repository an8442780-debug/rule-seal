import React, { useState } from 'react';

interface RegulatoryLandingIntroProps {
  onEnterWorkspace?: () => void;
}

export const RegulatoryLandingIntro: React.FC<RegulatoryLandingIntroProps> = ({ onEnterWorkspace }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="landing-experience" aria-labelledby="dossier-intro-heading">
      <div className="landing-topline">
        <span className="landing-wordmark"><span className="landing-wordmark-dot" aria-hidden="true" /> RULESEAL / SOURCE-BOUND EVIDENCE</span>
        <a href="#how-it-works" className="landing-text-link">Read the field guide <span aria-hidden="true">↗</span></a>
      </div>

      <div className="landing-hero">
        <div className="landing-orbit-field" aria-hidden="true">
          <span className="landing-orbit landing-orbit-one" />
          <span className="landing-orbit landing-orbit-two" />
          <span className="landing-orbit landing-orbit-three" />
          <span className="landing-orbit-trace landing-orbit-trace-one" />
          <span className="landing-orbit-trace landing-orbit-trace-two" />
          <div className="landing-logo-core">
            <span className="landing-logo-halo" />
            <img src="/rule-seal-logo.svg" alt="" width="122" height="122" />
          </div>
        </div>

        <div className="landing-hero-copy">
          <div className="landing-kicker"><span className="landing-live-dot" aria-hidden="true" /> REGULATORY EDITION APPLICABILITY / 61997</div>
          <h2 id="dossier-intro-heading" className="landing-title">
            Make the applicable edition <em>unmistakable.</em>
          </h2>
          <p className="landing-lead">
            RuleSeal turns official eCFR and Federal Register records into a traceable baseline for Title 14 CFR § 71.1 — assessed through GenLayer validator consensus and read back from the ledger.
          </p>
          <div className="landing-actions">
            <button type="button" className="btn btn-hero" onClick={onEnterWorkspace}>
              Enter the workspace <span aria-hidden="true">↗</span>
            </button>
            <a href="#how-it-works" className="btn btn-quiet">How RuleSeal works</a>
          </div>
          <p className="landing-disclaimer">Evidence navigation and baseline coordination — not legal advice or an official compliance certification.</p>
        </div>
      </div>

      <nav className="landing-resource-strip" aria-label="RuleSeal reading room">
        <span className="landing-resource-label">READING ROOM</span>
        <a href="https://github.com/an8442780-debug/rule-seal/blob/main/docs/VERIFICATION.md" target="_blank" rel="noreferrer noopener">Verification</a>
        <a href="https://github.com/an8442780-debug/rule-seal/blob/main/docs/STUDIONET-EVIDENCE.md" target="_blank" rel="noreferrer noopener">Studio evidence</a>
        <a href="https://github.com/an8442780-debug/rule-seal/blob/main/docs/RECOVERY.md" target="_blank" rel="noreferrer noopener">Recovery guide</a>
        <a href="https://explorer-studio-dev.genlayer.com/" target="_blank" rel="noreferrer noopener">Explorer ↗</a>
      </nav>

      <div className="landing-proof-grid" aria-label="RuleSeal product foundations">
        <article className="landing-proof-card">
          <span className="landing-proof-index">01 / RECORDS</span>
          <h3>Official sources first</h3>
          <p>Cases bind to point-in-time eCFR XML and Federal Register records instead of user-selected claims.</p>
        </article>
        <article className="landing-proof-card">
          <span className="landing-proof-index">02 / CONSENSUS</span>
          <h3>Independent validators</h3>
          <p>GenLayer validators fetch and compare the consequential fields before an assessment can settle.</p>
        </article>
        <article className="landing-proof-card">
          <span className="landing-proof-index">03 / LINEAGE</span>
          <h3>Auditable baselines</h3>
          <p>State, fingerprints, successor lineage and checklist bindings remain available for authoritative readback.</p>
        </article>
      </div>

      <div className="landing-briefing-bar">
        <div>
          <span className="landing-briefing-label">THE BRIEFING</span>
          <strong>One calm place to understand the record before you act.</strong>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="pillars-container"
        >
          {isExpanded ? 'Hide briefing ▲' : 'Open briefing ▼'}
        </button>
      </div>

      {isExpanded && (
        <div id="pillars-container" className="pillars-grid landing-pillars" role="region" aria-label="Four Pillars of RuleSeal">
          <article className="pillar-card">
            <span className="pillar-number">01 / THE CHALLENGE</span>
            <h3 className="pillar-title">IBR Applicability Ambiguity</h3>
            <p className="pillar-text">Federal airspace rules incorporate external FAA standards by reference rather than printing entire documents in the CFR. Annual editions have overlapping publication windows, effective dates, and transitional periods.</p>
          </article>
          <article className="pillar-card">
            <span className="pillar-number">02 / OFFICIAL SOURCES</span>
            <h3 className="pillar-title">eCFR &amp; Federal Register</h3>
            <p className="pillar-text">RuleSeal links each case to point-in-time eCFR XML snapshots and Federal Register publication notices that establish evidence intervals and official incorporation records.</p>
          </article>
          <article className="pillar-card">
            <span className="pillar-number">03 / CONSENSUS ENGINE</span>
            <h3 className="pillar-title">GenLayer Validator Consensus</h3>
            <p className="pillar-text">Intelligent validators fetch official federal endpoints in decentralized execution environments, compare substantive fields and reach multi-node consensus.</p>
          </article>
          <article className="pillar-card">
            <span className="pillar-number">04 / IMMUTABLE BASELINE</span>
            <h3 className="pillar-title">Authoritative On-Chain Readback</h3>
            <p className="pillar-text">The assessment, edition identifier and evidence fingerprint are sealed on-chain as a baseline that downstream checklist systems can verify.</p>
          </article>
        </div>
      )}

      <details className="how-it-works" id="how-it-works">
        <summary>How it works — inputs, workflows and results</summary>
        <div className="how-it-works-body">
          <p>Choose the date of the activity you want to assess, from 2000-01-01 through 2035-12-31. This can be a past activity for a historical review or a planned future activity; it is not the date you create the case. An accepted date does not guarantee that official source evidence is available or sufficient for a resolved assessment. RuleSeal covers only Title 14, Part 71, section 71.1 and FAA Order JO 7400.11. You do not upload a preferred edition or choose the authority documents: the contract retrieves official sources.</p>
          <h3>Read evidence without signing</h3>
          <p>Open <strong>Public Evidence Lookup</strong>. Choose a recent case or search for a case ID returned by creation. Review its activity date, state, latest assessment, authority links and fingerprint. <strong>Auditor Hub</strong> shows recorded events and counts; an event is not a substitute for the current case record.</p>
          <h3>Create and assess your case</h3>
          <p>Only detected wallets appear in the picker. If your wallet is missing, unlock and update its extension, then reload this page. MetaMask, OKX Wallet and Rabby are supported when announced through EIP-6963.</p>
          <ol>
            <li>Select <strong>Connect Wallet</strong>, then explicitly choose a detected MetaMask, OKX Wallet or Rabby. Writes require the correct Studio Dev preview network and spendable GEN. Never provide a seed phrase or private key to this page.</li>
            <li>Open <strong>Case Creator &amp; Lifecycle</strong>. Enter the activity date and retain the client nonce, then choose <strong>Create Draft Case</strong> and sign. Record the case ID returned after verification.</li>
            <li>With that case selected, return to <strong>Case Creator &amp; Lifecycle</strong> and choose <strong>Freeze Case for Resolver Assessment</strong>. Only its owner can freeze it; frozen inputs cannot be edited.</li>
            <li>Open <strong>Resolver Consensus</strong> and choose <strong>Execute Validator Assessment</strong>. A resolver requests evaluation; it does not choose the result. Return to <strong>Public Evidence Lookup</strong> to inspect the recorded assessment.</li>
          </ol>
          <h3>Understand the outcome</h3>
          <dl>
            <dt>LOCKED</dt><dd>The assessment concludes EDITION_APPLIES. Inspect the edition, interval and supporting sources before using the record.</dd>
            <dt>NOT_APPLICABLE</dt><dd>The result is NOT_YET_EFFECTIVE, SUPERSEDED_FOR_DATE or NO_BOUND_REFERENCE. Read its reason; this is not a general legal determination.</dd>
            <dt>UNRESOLVED</dt><dd>The evidence did not support a conclusive assessment. Inspect source statuses and the reason. After the one-hour cooldown, use Reserve Retry Attempt in Resolver Consensus, then Execute Validator Assessment. There are three total assessment attempts.</dd>
          </dl>
          <h3>Maintain lineage and checklist references</h3>
          <p>In <strong>Successor Wizard</strong>, the owner of a LOCKED or NOT_APPLICABLE case can use <strong>Create Successor Draft</strong> for a different date. Creation links both cases but does not supersede the predecessor. Only a successor that later becomes LOCKED or NOT_APPLICABLE does that; DRAFT, FROZEN and UNRESOLVED do not.</p>
          <p>In <strong>Checklist Integrator</strong>, select a LOCKED case and enter your account-scoped namespace. Use <strong>Bind / Advance Integration Namespace</strong>. Same-case rebinding while still LOCKED changes nothing. Advancement is explicit and accepts only the bound case's declared LOCKED successor. Use <strong>Lookup</strong> with that exact namespace to verify the binding and previous case ID.</p>
          <h3>When a transaction takes time</h3>
          <p>Signing and submission are not success. ACCEPTED remains pending; FINALIZED still requires successful execution and the expected contract readback. The dialog shows <strong>Verifying execution</strong> and <strong>Verifying the result</strong> before <strong>Transaction complete</strong>. Keep the transaction hash if interrupted. After reload, use <strong>Reconcile with Chain</strong> when a pending-operation notice appears; verification stays bound to the original sender. Do not sign the same write again or clear browser storage to dismiss an uncertain transaction.</p>
          <p>Source unavailability and consensus rejection are different. Rejection does not itself change a case to UNRESOLVED: read the actual case state. Studio Dev preview data may be reset, and contract upgrade authority remains privileged.</p>
        </div>
      </details>
    </section>
  );
};
