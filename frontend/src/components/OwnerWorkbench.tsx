import React, { useState } from 'react';
import { contractService } from '../services/contractService.ts';
import { WalletState, CaseRecord, TxStep } from '../types/domain.ts';
import { OFFICIAL_ECFR_BASE, OFFICIAL_FR_BASE, CONTRACT_ADDRESS } from '../config/chain.ts';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';

interface OwnerWorkbenchProps {
  walletState: WalletState;
  onTxStart: (step: TxStep, detail?: any) => void;
  onCaseCreated: (caseId: string) => void;
  activeCase?: CaseRecord | null;
  onRefreshActiveCase?: () => void;
}

export const OwnerWorkbench: React.FC<OwnerWorkbenchProps> = ({
  walletState,
  onTxStart,
  onCaseCreated,
  activeCase,
  onRefreshActiveCase,
}) => {
  const [activityDate, setActivityDate] = useState('2025-10-01');
  const [designationHint, setDesignationHint] = useState('FAA Order JO 7400.11');
  const [clientNonce, setClientNonce] = useState(() => `nonce-${Date.now().toString(36)}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewEcfrUrl = `${OFFICIAL_ECFR_BASE}/full/${activityDate}/title-14.xml?part=71`;
  const previewFrQueryUrl = `${OFFICIAL_FR_BASE}/api/v1/documents.json?conditions[cfr][title]=14&conditions[cfr][part]=71`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletState.connected) {
      setError('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await contractService.createCase(
        clientNonce,
        '71',
        '71.1',
        activityDate,
        designationHint,
        (step, detail) => {
          onTxStart(step, detail);
        }
      );
      onCaseCreated(result.caseId);
      setClientNonce(`nonce-${Date.now().toString(36)}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!activeCase || !walletState.connected) return;
    setLoading(true);
    setError(null);
    try {
      await contractService.freezeCase(activeCase.case_id, (step, detail) => {
        onTxStart(step, detail);
      });
      onRefreshActiveCase?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to freeze case');
    } finally {
      setLoading(false);
    }
  };

  const isOwner =
    activeCase &&
    walletState.address &&
    activeCase.owner.toLowerCase() === walletState.address.toLowerCase();

  return (
    <div>
      <RoleBoundaryBanner
        role="owner"
        title="Case Owner & Registrar Mode"
        description="Establish Title 14 CFR § 71.1 draft cases, configure target activity dates, and permanently freeze cases to authorize validator consensus."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Case Creator & Lifecycle Workbench</h2>
          <p className="card-description">
            Register and freeze a new Title 14 CFR § 71.1 regulatory applicability baseline draft.
          </p>
        </div>

        {!walletState.connected && (
          <div className="banner banner-info" role="status">
            <div>
              <strong>Wallet Disconnected:</strong> Connect your wallet in the header to register new baseline cases and sign transactions.
            </div>
          </div>
        )}

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CFR Title (Fixed)</label>
              <input type="text" className="form-input" value="14 CFR (Aeronautics and Space)" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Allowlisted Section</label>
              <input type="text" className="form-input" value="Part 71, § 71.1 (Airspace Designations)" disabled />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="activity-date" className="form-label">
                Target Activity Date (2000-01-01 to 2035-12-31)
              </label>
              <input
                id="activity-date"
                type="date"
                className="form-input mono"
                min="2000-01-01"
                max="2035-12-31"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                required
              />
              <span className="form-hint">The operational activity date whose applicable IBR edition will be locked.</span>
            </div>

            <div className="form-group">
              <label htmlFor="designation-hint" className="form-label">
                Standard Designation Family
              </label>
              <input
                id="designation-hint"
                type="text"
                className="form-input"
                value={designationHint}
                onChange={(e) => setDesignationHint(e.target.value)}
                required
              />
              <span className="form-hint">Must match allowlisted family: FAA Order JO 7400.11</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="client-nonce" className="form-label">
              Client Nonce (Idempotency Key)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="client-nonce"
                type="text"
                className="form-input mono"
                value={clientNonce}
                onChange={(e) => setClientNonce(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setClientNonce(`nonce-${Date.now().toString(36)}`)}
                title="Regenerate random nonce"
              >
                ↻ New
              </button>
            </div>
            <span className="form-hint">Unique nonce ensuring exactly-once execution per client session.</span>
          </div>

          {/* Derived Links Preview */}
          <div
            style={{
              background: 'var(--rs-bg-card-alt)',
              border: '1px solid var(--rs-border)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--rs-gold-glow)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Deterministic Official Source Preview:
            </span>
            <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <span style={{ color: 'var(--rs-text-muted)', fontWeight: 600 }}>eCFR Endpoint:</span>{' '}
                <code className="mono" style={{ fontSize: '11px', color: 'var(--rs-cyan-bright)' }}>{previewEcfrUrl}</code>
              </div>
              <div>
                <span style={{ color: 'var(--rs-text-muted)', fontWeight: 600 }}>Federal Register:</span>{' '}
                <code className="mono" style={{ fontSize: '11px', color: 'var(--rs-cyan-bright)' }}>{previewFrQueryUrl}</code>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !walletState.connected || !CONTRACT_ADDRESS}
          >
            {loading ? 'Submitting...' : 'Create Draft Case'}
          </button>
        </form>
      </div>

      {/* Active Case Lifecycle Actions */}
      {activeCase && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Active Case Lifecycle Actions: <span className="mono">{activeCase.case_id}</span>
            </h3>
            <p className="card-description">Manage state progression for the currently selected case.</p>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeCase.state === 'DRAFT' && isOwner && (
              <button
                className="btn btn-primary"
                onClick={handleFreeze}
                disabled={loading || !walletState.connected}
              >
                {loading ? 'Freezing...' : 'Freeze Case for Resolver Assessment'}
              </button>
            )}

            {activeCase.state === 'DRAFT' && !isOwner && (
              <p style={{ fontSize: '13px', color: 'var(--rs-text-muted)' }}>
                Only the case owner ({activeCase.owner.slice(0, 8)}...) can freeze this draft.
              </p>
            )}

            {activeCase.state === 'FROZEN' && (
              <span className="badge badge-FROZEN">Case is FROZEN. Ready for resolver assessment.</span>
            )}

            {activeCase.state === 'LOCKED' && (
              <span className="badge badge-LOCKED">Case is LOCKED. Baseline is active and immutable.</span>
            )}

            {activeCase.state === 'NOT_APPLICABLE' && (
              <span className="badge badge-NOT_APPLICABLE">Case concluded NOT_APPLICABLE.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
