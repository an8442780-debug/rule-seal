import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService.ts';
import { CaseRecord, AssessmentRecord } from '../types/domain.ts';
import { CaseDetailView } from './CaseDetailView.tsx';
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
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Public Regulatory Evidence Lookup</h2>
          <p className="card-description">
            Explore frozen incorporation-by-reference baselines and official authority lineage without connecting a wallet.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="form-input mono"
            placeholder="Enter Case ID (e.g. REAL-000001)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={!CONTRACT_ADDRESS}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !CONTRACT_ADDRESS}>
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        {recentCaseIds.length > 0 && (
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Recent Cases ({totalCount} total):{' '}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {recentCaseIds.map((id) => (
                <button
                  key={id}
                  className={`btn btn-sm mono ${selectedCaseId === id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    onSelectCase(id);
                    loadCaseDetails(id);
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
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
