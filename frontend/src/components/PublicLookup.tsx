import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService.ts';
import { CaseRecord, AssessmentRecord } from '../types/domain.ts';
import { CaseDetailView } from './CaseDetailView.tsx';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';
import { CONTRACT_ADDRESS } from '../config/chain.ts';

interface PublicLookupProps {
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string) => void;
}

export const PublicLookup: React.FC<PublicLookupProps> = ({ selectedCaseId, onSelectCase }) => {
  const [searchInput, setSearchInput] = useState(selectedCaseId || '');
  const [currentCase, setCurrentCase] = useState<CaseRecord | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCaseIds, setRecentCaseIds] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (CONTRACT_ADDRESS) {
      loadRecentCases();
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      setSearchInput(selectedCaseId);
      loadCaseDetails(selectedCaseId);
    }
  }, [selectedCaseId]);

  const loadRecentCases = async () => {
    try {
      const count = await contractService.getCaseCount();
      setTotalCount(count);
      const ids: string[] = [];
      const take = Math.min(count, 10);
      for (let i = count - 1; i >= Math.max(0, count - take); i--) {
        const id = await contractService.getCaseId(i);
        ids.push(id);
      }
      setRecentCaseIds(ids);
    } catch {
      // Ignore if not deployed
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    if (!caseId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const c = await contractService.getCase(caseId.trim(), true);
      setCurrentCase(c);
      if (c.current_assessment_id) {
        const a = await contractService.getAssessment(c.current_assessment_id, true);
        setCurrentAssessment(a);
      } else {
        setCurrentAssessment(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Case not found');
      setCurrentCase(null);
      setCurrentAssessment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectCase(searchInput.trim());
      loadCaseDetails(searchInput.trim());
    }
  };

  return (
    <div>
      <RoleBoundaryBanner
        role="public"
        title="Public Reader Mode"
        description="Explore locked baselines, authority documents, and official eCFR/Federal Register evidence without wallet connection."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Public Regulatory Evidence Lookup</h2>
          <p className="card-description">
            Explore frozen incorporation-by-reference baselines and official authority lineage without connecting a wallet.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label htmlFor="case-search-input" className="sr-only" style={{ display: 'none' }}>
              Case ID
            </label>
            <input
              id="case-search-input"
              type="text"
              className="form-input mono"
              placeholder="Enter Case ID (e.g. REAL-000001)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={!CONTRACT_ADDRESS}
              aria-label="Enter Case ID"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !CONTRACT_ADDRESS}
            style={{ flexShrink: 0 }}
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {recentCaseIds.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--rs-text-muted)', display: 'block', marginBottom: '6px' }}>
              On-Chain Docket Index ({totalCount} total cases):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {recentCaseIds.map((id) => (
                <button
                  key={id}
                  className={`btn btn-sm mono ${selectedCaseId === id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    onSelectCase(id);
                    loadCaseDetails(id);
                  }}
                  aria-label={`Inspect case ${id}`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {!currentCase && !loading && !error && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--rs-bg-card-alt)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--rs-border-light)',
              fontSize: '13px',
              color: 'var(--rs-text-muted)',
            }}
          >
            <p style={{ margin: 0 }}>
              💡 Enter an exact Case ID above or click any docket index item to view its frozen parameters, official XML endpoints, and validator consensus assessment.
            </p>
          </div>
        )}
      </div>

      {currentCase && (
        <CaseDetailView
          caseRecord={currentCase}
          assessment={currentAssessment}
          onSelectCase={(id) => {
            onSelectCase(id);
            loadCaseDetails(id);
          }}
          onRefresh={() => loadCaseDetails(currentCase.case_id)}
          isLoading={loading}
        />
      )}
    </div>
  );
};
