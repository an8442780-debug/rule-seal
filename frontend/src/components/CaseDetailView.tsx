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

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="card-title mono">{caseRecord.case_id}</span>
            <span className={`badge badge-${caseRecord.state}`}>{caseRecord.state}</span>
          </div>
          <p className="card-description">
            Incorporation-by-reference applicability lock record for 14 CFR § 71.1
          </p>
        </div>
        {onRefresh && (
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        )}
      </div>

      <div className="grid-2">
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Frozen Parameters</h3>
          <table className="kv-table">
            <tbody>
              <tr>
                <th>CFR Section</th>
                <td>{caseRecord.title} CFR § {caseRecord.section} (Part {caseRecord.part})</td>
              </tr>
              <tr>
                <th>Activity Date</th>
                <td className="mono" style={{ fontWeight: 600 }}>{caseRecord.activity_date}</td>
              </tr>
              <tr>
                <th>Designation Hint</th>
                <td>{caseRecord.standard_designation_hint}</td>
              </tr>
              <tr>
                <th>Case Owner</th>
                <td className="mono" style={{ fontSize: '12px' }}>{caseRecord.owner}</td>
              </tr>
              <tr>
                <th>Client Nonce</th>
                <td className="mono" style={{ fontSize: '12px' }}>{caseRecord.client_nonce}</td>
              </tr>
              <tr>
                <th>Fingerprint</th>
                <td className="mono" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{caseRecord.fingerprint}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Official Regulatory Sources</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Official eCFR point-in-time and Federal Register endpoints derived deterministically from case parameters:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)', display: 'block' }}>
                eCFR Full XML (Date-Bound)
              </span>
              <a
                href={derivedEcfrUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mono"
                style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--accent-primary)' }}
              >
                {derivedEcfrUrl}
              </a>
            </div>

            <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)', display: 'block' }}>
                Federal Register Title 14 Part 71 Lineage Query
              </span>
              <a
                href={derivedFrQueryUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mono"
                style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--accent-primary)' }}
              >
                {derivedFrQueryUrl}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Successor & Predecessor Lineage */}
      {(caseRecord.predecessor_case_id || caseRecord.successor_case_id) && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Lineage History</h4>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            {caseRecord.predecessor_case_id && (
              <div>
                Predecessor:{' '}
                <button
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => onSelectCase?.(caseRecord.predecessor_case_id)}
                >
                  {caseRecord.predecessor_case_id}
                </button>
              </div>
            )}
            {caseRecord.successor_case_id && (
              <div>
                Successor:{' '}
                <button
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => onSelectCase?.(caseRecord.successor_case_id)}
                >
                  {caseRecord.successor_case_id}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment / Accepted Baseline */}
      {assessment ? (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
              Consensus Assessment: <span className="mono">{assessment.assessment_id}</span>
            </h3>
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
                <td style={{ fontWeight: 700 }}>{assessment.edition ? `Edition ${assessment.edition}` : 'N/A'}</td>
              </tr>
              <tr>
                <th>Effective Interval</th>
                <td className="mono">
                  {assessment.effective_from || 'N/A'} → {assessment.effective_to || 'Ongoing / Latest'}
                </td>
              </tr>
              <tr>
                <th>Reason Code</th>
                <td className="mono">{assessment.reason_code}</td>
              </tr>
              <tr>
                <th>eCFR Fingerprint</th>
                <td className="mono" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
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
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>
            Authority Documents ({assessment.authority_documents.length})
          </h4>
          {assessment.authority_documents.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No authority documents bound.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-alt)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>FR Document</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Published</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Effective</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>Canonical Link</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.authority_documents.map((doc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="mono" style={{ padding: '6px 10px', fontWeight: 600 }}>{doc.document_number}</td>
                      <td className="mono" style={{ padding: '6px 10px' }}>{doc.publication_date}</td>
                      <td className="mono" style={{ padding: '6px 10px' }}>{doc.effective_on}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <a
                          href={doc.canonical_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          Federal Register Notice ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Source Statuses */}
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>
            Source Verification Status
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(assessment.source_statuses || {}).map(([url, status], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card-alt)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <span className="mono" style={{ wordBreak: 'break-all', maxWidth: '80%' }}>{url}</span>
                <span style={{ fontWeight: 700, color: status === 'HTTP_200' ? '#059669' : '#dc2626' }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '4px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Assessment pending. Trigger evaluation in the Resolver Workbench.
          </p>
        </div>
      )}

      {/* Auditor Disclaimer */}
      <div className="auditor-disclaimer">
        <strong>Auditor Notice:</strong> This record reflects an immutable, source-bound incorporation-by-reference edition
        applicability lock verified across official eCFR and Federal Register records. It functions as an objective evidence-navigation
        baseline for downstream compliance workflows and does not constitute formal legal advice or regulatory certification.
      </div>
    </div>
  );
};
