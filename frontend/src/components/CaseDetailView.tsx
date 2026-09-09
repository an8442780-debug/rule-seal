import React from 'react';
import { CaseRecord, AssessmentRecord } from '../types/domain.ts';
import { OFFICIAL_ECFR_BASE, OFFICIAL_FR_BASE } from '../config/chain.ts';

interface CaseDetailViewProps {
  caseRecord: CaseRecord;
  assessment?: AssessmentRecord | null;
  onSelectCase?: (caseId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseRecord,
  assessment,
  onSelectCase,
  onRefresh,
  isLoading,
}) => {
  const derivedEcfrUrl = `${OFFICIAL_ECFR_BASE}/full/${caseRecord.activity_date}/title-14.xml?part=71`;
  const derivedFrQueryUrl = `${OFFICIAL_FR_BASE}/api/v1/documents.json?conditions[cfr][title]=14&conditions[cfr][part]=71`;

  const getOutcomeBorderColor = (outcome?: string) => {
    switch (outcome) {
      case 'EDITION_APPLIES':
        return '#059669';
      case 'NOT_YET_EFFECTIVE':
        return '#0284c7';
      case 'SUPERSEDED_FOR_DATE':
        return '#d97706';
      default:
        return 'var(--rs-border)';
    }
  };

  return (
    <article className="card" aria-labelledby={`case-title-${caseRecord.case_id}`}>
      {/* Dossier Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--rs-gold-glow)', background: 'var(--rs-gold-bg)', border: '1px solid var(--rs-gold-border)', padding: '2px 6px', borderRadius: '3px' }}>
              OFFICIAL DOCKET
            </span>
            <h3 id={`case-title-${caseRecord.case_id}`} className="card-title mono" style={{ fontSize: '19px', letterSpacing: '-0.02em' }}>
              {caseRecord.case_id}
            </h3>
            <span className={`badge badge-${caseRecord.state}`}>{caseRecord.state}</span>
          </div>
          <p className="card-description">
            Incorporation-by-reference applicability lock record for 14 CFR § 71.1
          </p>
        </div>
        {onRefresh && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh case details from chain"
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        )}
      </div>

      {/* Main Dossier Grid: Parameters + Official Sources */}
      <div className="grid-2">
        <div>
          <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--rs-text-heading)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📋</span>
            <span>Frozen Parameters</span>
          </h4>
          <table className="kv-table">
            <tbody>
              <tr>
                <th>CFR Section</th>
                <td>{caseRecord.title} CFR § {caseRecord.section} (Part {caseRecord.part})</td>
              </tr>
              <tr>
                <th>Activity Date</th>
                <td className="mono" style={{ fontWeight: 700, color: 'var(--rs-cyan-bright)' }}>{caseRecord.activity_date}</td>
              </tr>
              <tr>
                <th>Designation Hint</th>
                <td>{caseRecord.standard_designation_hint}</td>
              </tr>
              <tr>
                <th>Case Owner</th>
                <td className="mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{caseRecord.owner}</td>
              </tr>
              <tr>
                <th>Client Nonce</th>
                <td className="mono" style={{ fontSize: '12px' }}>{caseRecord.client_nonce}</td>
              </tr>
              <tr>
                <th>Fingerprint</th>
                <td className="mono" style={{ fontSize: '11px', wordBreak: 'break-all', color: 'var(--rs-text-muted)' }}>
                  {caseRecord.fingerprint}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--rs-text-heading)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏛</span>
            <span>Official Regulatory Sources</span>
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--rs-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
            Official eCFR point-in-time and Federal Register endpoints derived deterministically from case parameters:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="evidence-source-card">
              <span className="evidence-source-label">
                eCFR Full XML (Date-Bound)
              </span>
              <a
                href={derivedEcfrUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mono"
                style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--rs-cyan-bright)', display: 'block', lineHeight: 1.4 }}
              >
                {derivedEcfrUrl} ↗
              </a>
            </div>

            <div className="evidence-source-card">
              <span className="evidence-source-label">
                Federal Register Title 14 Part 71 Lineage Query
              </span>
              <a
                href={derivedFrQueryUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mono"
                style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--rs-cyan-bright)', display: 'block', lineHeight: 1.4 }}
              >
                {derivedFrQueryUrl} ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Successor & Predecessor Lineage */}
      {(caseRecord.predecessor_case_id || caseRecord.successor_case_id) && (
        <div
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: 'var(--rs-bg-card-alt)',
            border: '1px solid var(--rs-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rs-text-heading)', marginBottom: '8px' }}>
            Lineage History
          </h4>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
            {caseRecord.predecessor_case_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--rs-text-muted)' }}>Predecessor:</span>
                <button
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => onSelectCase?.(caseRecord.predecessor_case_id)}
                  aria-label={`Switch to predecessor case ${caseRecord.predecessor_case_id}`}
                >
                  ← {caseRecord.predecessor_case_id}
                </button>
              </div>
            )}
            {caseRecord.successor_case_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--rs-text-muted)' }}>Successor:</span>
                <button
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => onSelectCase?.(caseRecord.successor_case_id)}
                  aria-label={`Switch to successor case ${caseRecord.successor_case_id}`}
                >
                  {caseRecord.successor_case_id} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment / Accepted Baseline */}
      {assessment ? (
        <section
          style={{
            marginTop: '24px',
            borderTop: '1px solid var(--rs-border)',
            paddingTop: '20px',
            position: 'relative',
          }}
          aria-labelledby={`assessment-heading-${assessment.assessment_id}`}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px',
              borderLeft: `4px solid ${getOutcomeBorderColor(assessment.outcome)}`,
              paddingLeft: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--rs-text-muted)', display: 'block' }}>
                Intelligent Validator Result
              </span>
              <h4 id={`assessment-heading-${assessment.assessment_id}`} style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rs-text-heading)' }}>
                Consensus Assessment: <span className="mono">{assessment.assessment_id}</span>
              </h4>
            </div>
            <span className={`badge badge-${assessment.outcome}`}>{assessment.outcome}</span>
          </div>

          <table className="kv-table">
            <tbody>
              <tr>
                <th>Standard Body</th>
                <td>{assessment.standard_body}</td>
              </tr>
              <tr>
                <th>Designation Family</th>
                <td>{assessment.designation_family}</td>
              </tr>
              <tr>
                <th>Incorporated Edition</th>
                <td style={{ fontWeight: 800, fontSize: '15px', color: 'var(--rs-gold-glow)' }}>
                  {assessment.edition ? `Edition ${assessment.edition}` : 'N/A'}
                </td>
              </tr>
              <tr>
                <th>Effective Interval</th>
                <td className="mono">
                  {assessment.effective_from || 'N/A'} → {assessment.effective_to || 'Ongoing / Latest'}
                </td>
              </tr>
              <tr>
                <th>Reason Code</th>
                <td className="mono" style={{ color: 'var(--rs-cyan-bright)' }}>{assessment.reason_code}</td>
              </tr>
              <tr>
                <th>eCFR Fingerprint</th>
                <td className="mono" style={{ fontSize: '11px', wordBreak: 'break-all', color: 'var(--rs-text-muted)' }}>
                  {assessment.ecfr_section_fingerprint}
                </td>
              </tr>
              <tr>
                <th>Observed At</th>
                <td className="mono" style={{ fontSize: '12px' }}>{assessment.observed_at}</td>
              </tr>
            </tbody>
          </table>

          {/* Authority Documents */}
          <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--rs-text-heading)', marginTop: '20px', marginBottom: '10px' }}>
            Authority Documents ({assessment.authority_documents.length})
          </h5>
          {assessment.authority_documents.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--rs-text-muted)' }}>No authority documents bound.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '130px' }}>FR Document</th>
                    <th style={{ minWidth: '110px' }}>Published</th>
                    <th style={{ minWidth: '110px' }}>Effective</th>
                    <th>Canonical Link</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.authority_documents.map((doc, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--rs-text-heading)' }}>{doc.document_number}</td>
                      <td className="mono">{doc.publication_date}</td>
                      <td className="mono">{doc.effective_on}</td>
                      <td>
                        <a
                          href={doc.canonical_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{ color: 'var(--rs-cyan-bright)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Federal Register Notice</span>
                          <span>↗</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Source Statuses */}
          <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--rs-text-heading)', marginTop: '20px', marginBottom: '10px' }}>
            Source Verification Status
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(assessment.source_statuses || {}).map(([url, status], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--rs-bg-card-alt)',
                  border: '1px solid var(--rs-border)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="mono" style={{ wordBreak: 'break-all', maxWidth: '85%', color: 'var(--rs-text-muted)' }}>
                  {url}
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: status === 'HTTP_200' ? 'var(--rs-emerald-bright)' : 'var(--rs-rose-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {status === 'HTTP_200' ? '✓ ' : '✕ '}
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--rs-bg-card-alt)',
            border: '1px solid var(--rs-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--rs-text-muted)', margin: 0 }}>
            Assessment pending. Trigger evaluation in the Resolver Workbench.
          </p>
        </div>
      )}

      {/* Auditor Disclaimer */}
      <footer className="auditor-disclaimer">
        <strong>Auditor Notice:</strong> Read the current case state and assessment before relying on this record.
        A draft or frozen case has no conclusive assessment. Source links alone do not establish applicability.
        RuleSeal provides evidence navigation, not legal advice or regulatory certification.
      </footer>
    </article>
  );
};
