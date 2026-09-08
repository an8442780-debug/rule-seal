import React, { useState } from 'react';
import { contractService } from '../services/contractService.ts';
import { WalletState, CaseRecord, IntegrationRecord, TxStep } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';

interface IntegratorWorkbenchProps {
  walletState: WalletState;
  activeCase?: CaseRecord | null;
  onTxStart: (step: TxStep, detail?: any) => void;
}

export const IntegratorWorkbench: React.FC<IntegratorWorkbenchProps> = ({
  walletState,
  activeCase,
  onTxStart,
}) => {
  const [namespace, setNamespace] = useState('compliance-checklist-ops');
  const [lookupNamespace, setLookupNamespace] = useState('compliance-checklist-ops');
  const [integrationResult, setIntegrationResult] = useState<IntegrationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletState.connected) {
      setError('Please connect your wallet.');
      return;
    }
    if (!activeCase || activeCase.state !== 'LOCKED') {
      setError('Selected case must be in LOCKED state to bind integration.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await contractService.activateIntegration(namespace.trim(), activeCase.case_id, (step, detail) => {
        onTxStart(step, detail);
      });
      await handleLookup();
    } catch (err: any) {
      setError(err?.message || 'Failed to activate integration');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!walletState.address || !lookupNamespace.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contractService.getIntegration(walletState.address, lookupNamespace.trim(), true);
      setIntegrationResult(res);
    } catch (err: any) {
      setError(err?.message || 'Integration not found');
      setIntegrationResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <RoleBoundaryBanner
        role="integrator"
        title="Downstream Systems Integrator Mode"
        description="Record which LOCKED case your checklist uses. This records an evidence reference, not a compliance certification."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Downstream Checklist Integrator Workbench</h2>
          <p className="card-description">
            Bind external compliance checklist namespaces to locked edition baselines or advance to declared successors.
          </p>
        </div>

        <p className="card-description">
          Namespaces belong to the connected account; surrounding whitespace is ignored.
          Rebinding the same namespace to the same still-LOCKED case changes nothing.
          Advancement is explicit and accepts only the currently bound case's declared LOCKED successor.
          NOT_APPLICABLE cases cannot be bound, and supersession never advances a checklist automatically.
        </p>

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleActivate} style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label htmlFor="integration-namespace" className="form-label">
              Checklist Namespace (3–64 characters)
            </label>
            <input
              id="integration-namespace"
              type="text"
              className="form-input mono"
              placeholder="e.g. flight-dispatch-checklist"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              required
              minLength={3}
              maxLength={64}
            />
            <span className="form-hint">An identifier scoped to your account. Another account may use the same namespace independently.</span>
          </div>

          <div className="form-group">
            <label htmlFor="integration-target-case" className="form-label">Target Case to Bind</label>
            <input
              id="integration-target-case"
              type="text"
              className="form-input mono"
              value={activeCase ? `${activeCase.case_id} (${activeCase.state})` : 'No case selected'}
              disabled
            />
            {activeCase && activeCase.state !== 'LOCKED' && (
              <span className="form-hint" style={{ color: 'var(--rs-rose-bright)' }}>
                Selected case is not LOCKED. Integrations can only bind to LOCKED cases.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !walletState.connected || !activeCase || activeCase.state !== 'LOCKED' || !CONTRACT_ADDRESS}
          >
            {loading ? 'Binding...' : 'Bind / Advance Integration Namespace'}
          </button>
        </form>

        {/* Integration Status Readback */}
        <div style={{ borderTop: '1px solid var(--rs-border)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--rs-text-heading)', marginBottom: '10px' }}>
            Lookup Active Integration
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                className="form-input mono"
                placeholder="Namespace"
                value={lookupNamespace}
                onChange={(e) => setLookupNamespace(e.target.value)}
                aria-label="Lookup namespace"
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLookup}
              disabled={loading || !walletState.address}
              style={{ flexShrink: 0 }}
            >
              Lookup
            </button>
          </div>

          {integrationResult && (
            <div
              style={{
                background: 'var(--rs-bg-card-alt)',
                border: '1px solid var(--rs-border)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '10px', color: 'var(--rs-text-heading)' }}>
                Namespace: <span className="mono" style={{ color: 'var(--rs-cyan-bright)' }}>{integrationResult.namespace}</span>
              </h4>
              <table className="kv-table">
                <tbody>
                  <tr>
                    <th>Bound Case ID</th>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--rs-emerald-bright)' }}>{integrationResult.case_id}</td>
                  </tr>
                  <tr>
                    <th>Previous Case ID</th>
                    <td className="mono">{integrationResult.previous_case_id || 'None'}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td><span className="badge badge-LOCKED">{integrationResult.state}</span></td>
                  </tr>
                  <tr>
                    <th>Caller</th>
                    <td className="mono" style={{ fontSize: '11.5px' }}>{integrationResult.caller}</td>
                  </tr>
                  <tr>
                    <th>Updated At</th>
                    <td className="mono" style={{ fontSize: '12px' }}>{integrationResult.updated_at}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
