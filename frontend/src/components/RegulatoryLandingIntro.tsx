import React, { useState } from 'react';

export const RegulatoryLandingIntro: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="dossier-intro" aria-labelledby="dossier-intro-heading">
      <div className="dossier-intro-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="dossier-intro-badge">
              <span>RuleSeal / Source-bound evidence</span>
            </div>
            <h2 id="dossier-intro-heading" className="dossier-intro-title">
              Which regulatory edition supports your activity date?
            </h2>
            <p className="dossier-intro-lead">
              Compare official federal records through GenLayer validator consensus and keep a traceable edition assessment for Title 14 CFR § 71.1. RuleSeal is an evidence-navigation tool, not legal advice or a compliance certification.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="pillars-container"
            style={{ fontSize: '12px' }}
          >
            {isExpanded ? 'Hide Briefing ▲' : 'Show Briefing ▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div id="pillars-container" className="pillars-grid" role="region" aria-label="Four Pillars of RuleSeal">
          {/* Pillar 1: The Problem */}
          <article className="pillar-card">
            <span className="pillar-number">01 / THE CHALLENGE</span>
            <h3 className="pillar-title">IBR Applicability Ambiguity</h3>
            <p className="pillar-text">
              Federal airspace rules incorporate external FAA standards by reference rather than printing entire documents in the CFR. Annual editions have overlapping publication windows, effective dates, and transitional periods. This creates operational ambiguity for past and planned flights.
            </p>
          </article>

          {/* Pillar 2: Official Evidence */}
          <article className="pillar-card">
            <span className="pillar-number">02 / OFFICIAL SOURCES</span>
            <h3 className="pillar-title">eCFR &amp; Federal Register</h3>
            <p className="pillar-text">
              RuleSeal links each case to official government endpoints: point-in-time eCFR XML snapshots for Title 14 Part 71 and Federal Register publication notices. These records establish effective date intervals and official incorporation approvals.
            </p>
          </article>

          {/* Pillar 3: Validator Consensus */}
          <article className="pillar-card">
            <span className="pillar-number">03 / CONSENSUS ENGINE</span>
            <h3 className="pillar-title">GenLayer Validator Consensus</h3>
            <p className="pillar-text">
              GenLayer intelligent validators fetch official federal endpoints in decentralized execution environments. Validators compare substantive regulatory texts and reach multi-node consensus on the applicable edition.
            </p>
          </article>

          {/* Pillar 4: On-Chain Readback */}
          <article className="pillar-card">
            <span className="pillar-number">04 / IMMUTABLE BASELINE</span>
            <h3 className="pillar-title">Authoritative On-Chain Readback</h3>
            <p className="pillar-text">
              The resulting assessment, edition identifier, and evidence fingerprint are sealed on-chain as an immutable baseline. Downstream flight dispatch checklists and compliance suites can bind namespaces and verify audit history directly against the ledger.
            </p>
          </article>
        </div>
      )}
      <details className="how-it-works" id="how-it-works">
        <summary>How it works — inputs, workflows and results</summary>
        <div className="how-it-works-body">
          <p>
            Start with an activity date from 2000-01-01 through 2035-12-31.
            RuleSeal covers only Title 14, Part 71, section 71.1 and FAA Order JO 7400.11.
            You do not upload a preferred edition or choose the authority documents: the contract retrieves official sources.
          </p>
          <h3>Read evidence without signing</h3>
          <p>
            Open <strong>Public Evidence Lookup</strong>. Choose a recent case or search for a case ID returned by creation.
            Review its activity date, state, latest assessment, authority links and fingerprint.
            <strong> Auditor Hub</strong> shows recorded events and counts; an event is not a substitute for the current case record.
          </p>
          <h3>Create and assess your case</h3>
          <p>Only detected wallets appear in the picker. If your wallet is missing, unlock and update its extension, then reload this page. MetaMask must support wallet discovery; compatibility aliases from other extensions are not listed as MetaMask.</p>
          <ol>
            <li>Select <strong>Connect Wallet</strong>, then explicitly choose a detected MetaMask, OKX Wallet or Rabby. Writes require the correct Studionet network and spendable GEN. Never provide a seed phrase or private key to this page.</li>
            <li>Open <strong>Case Creator &amp; Lifecycle</strong>. Enter the activity date and retain the client nonce, then choose <strong>Create Draft Case</strong> and sign. Record the case ID returned after verification. A new nonce cannot bypass duplicate case inputs.</li>
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
          <p>
            In <strong>Successor Wizard</strong>, the owner of a LOCKED or NOT_APPLICABLE case can use <strong>Create Successor Draft</strong> for a different date.
            Creation links both cases but does not supersede the predecessor. Only a successor that later becomes LOCKED or NOT_APPLICABLE does that; DRAFT, FROZEN and UNRESOLVED do not.
          </p>
          <p>
            In <strong>Checklist Integrator</strong>, select a LOCKED case and enter your account-scoped namespace.
            Use <strong>Bind / Advance Integration Namespace</strong>. Same-case rebinding while still LOCKED changes nothing.
            Advancement is explicit and accepts only the bound case's declared LOCKED successor. Use <strong>Lookup</strong> with that exact namespace to verify the binding and previous case ID.
          </p>
          <h3>When a transaction takes time</h3>
          <p>
            Signing and submission are not success. ACCEPTED remains pending; FINALIZED still requires successful execution and the expected contract readback.
            The dialog shows <strong>Verifying execution</strong> and <strong>Verifying the result</strong> before <strong>Transaction complete</strong>.
            Keep the transaction hash if interrupted. After reload, use <strong>Reconcile with Chain</strong> when a pending-operation notice appears; verification stays bound to the original sender.
            Do not sign the same write again or clear browser storage to dismiss an uncertain transaction.
            If storage cannot retain the hash, keep the page open and use <strong>Copy hash</strong>. A wallet request without a returned hash still needs a check of your wallet activity; a missing hash does not prove that nothing was submitted.
          </p>
          <p>
            Source unavailability and consensus rejection are different. Rejection does not itself change a case to UNRESOLVED: read the actual case state.
            An exhausted UNRESOLVED case cannot create a successor or evade its limit with another nonce. Studionet data may be reset, and contract upgrade authority remains privileged.
          </p>
        </div>
      </details>
    </section>
  );
};
