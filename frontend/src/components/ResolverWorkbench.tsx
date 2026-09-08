import React, { useState } from 'react';
import { contractService } from '../services/contractService.ts';
import { WalletState, CaseRecord, TxStep } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';

interface ResolverWorkbenchProps {
  walletState: WalletState;
  activeCase?: CaseRecord | null;
  onTxStart: (step: TxStep, detail?: any) => void;
  onRefreshActiveCase?: () => void;
}

export const ResolverWorkbench: React.FC<ResolverWorkbenchProps> = ({
  walletState,
  activeCase,
  onTxStart,
  onRefreshActiveCase,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssess = async () => {
    if (!activeCase || !walletState.connected) return;
    setLoading(true);
    setError(null);
    try {
      await contractService.assessCase(activeCase.case_id, (step, detail) => {
        onTxStart(step, detail);
      });
      onRefreshActiveCase?.();
    } catch (err: any) {
      setError(err?.message || 'Assessment execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!activeCase || !walletState.connected) return;
    setLoading(true);
    setError(null);
    try {
      await contractService.retryUnresolved(activeCase.case_id, (step, detail) => {
        onTxStart(step, detail);
      });
      onRefreshActiveCase?.();
    } catch (err: any) {
      setError(err?.message || 'Retry reservation failed');
    } finally {
      setLoading(false);
    }
  };

  const nowEpoch = Math.floor(Date.now() / 1000);
  const cooldownRemaining = activeCase ? Math.max(0, activeCase.last_attempt_epoch + 3600 - nowEpoch) : 0;
  const canRetry = activeCase && activeCase.state === 'UNRESOLVED' && activeCase.attempt_count < 3 && cooldownRemaining === 0;

  return (
    <div>
      <RoleBoundaryBanner
        role="resolver"
        title="Permissionless Resolver / Validator Mode"
        description="Anyone can trigger GenLayer intelligent validators to inspect external federal sources and seal substantive consensus on-chain."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Permissionless Resolver Workbench</h2>
          <p className="card-description">
            Trigger GenLayer validator consensus to evaluate incorporation-by-reference edition applicability from official regulatory sources.
          </p>
        </div>

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {!walletState.connected && (
          <div className="banner banner-info" role="status">
            <div>
              <strong>Wallet Disconnected:</strong> Connect your wallet to submit validator assessment transactions on GenLayer Studionet.
            </div>
          </div>
        )}

        {!activeCase ? (
          <div
            style={{
              padding: '24px',
              background: 'var(--rs-bg-card-alt)',
              border: '1px dashed var(--rs-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--rs-text-muted)', margin: 0, fontSize: '13.5px' }}>
              No case selected. Please lookup or select a case in Public Lookup to assess.
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                background: 'var(--rs-bg-card-alt)',
                border: '1px solid var(--rs-border)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--rs-text-muted)' }}>Selected Case: </span>
                  <span className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rs-text-heading)' }}>
                    {activeCase.case_id}
                  </span>
                </div>
                <span className={`badge badge-${activeCase.state}`}>{activeCase.state}</span>
              </div>
              <div style={{ fontSize: '13px', marginTop: '10px', color: 'var(--rs-text-body)' }}>
                Section: 14 CFR § {activeCase.section} | Activity Date: <span className="mono" style={{ fontWeight: 700, color: 'var(--rs-cyan-bright)' }}>{activeCase.activity_date}</span> | Attempts: <span className="mono" style={{ fontWeight: 700 }}>{activeCase.attempt_count}/3</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {activeCase.state === 'FROZEN' && (
                <button
                  className="btn btn-gold"
                  onClick={handleAssess}
                  disabled={loading || !walletState.connected || !CONTRACT_ADDRESS}
                >
                  {loading ? 'Evaluating Consensus...' : 'Execute Validator Assessment'}
                </button>
              )}

              {activeCase.state === 'UNRESOLVED' && (
                <>
                  {activeCase.attempt_count >= 3 ? (
                    <span className="badge badge-UNRESOLVED">Max assessment attempts (3) reached.</span>
                  ) : cooldownRemaining > 0 ? (
                    <span className="badge badge-UNRESOLVED">
                      Retry cooldown active ({Math.ceil(cooldownRemaining / 60)} mins remaining)
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleRetry}
                      disabled={loading || !walletState.connected || !canRetry || !CONTRACT_ADDRESS}
                    >
                      {loading ? 'Reserving Retry...' : `Reserve Retry Attempt (${activeCase.attempt_count + 1}/3)`}
                    </button>
                  )}
                </>
              )}

              {activeCase.state === 'LOCKED' && (
                <span className="badge badge-LOCKED">Case is LOCKED. Baseline finalized.</span>
              )}

              {activeCase.state === 'NOT_APPLICABLE' && (
                <span className="badge badge-NOT_APPLICABLE">Case is NOT_APPLICABLE. Concluded.</span>
              )}

              {activeCase.state === 'DRAFT' && (
                <span className="badge badge-DRAFT">Case is in DRAFT. Owner must freeze before assessment.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
