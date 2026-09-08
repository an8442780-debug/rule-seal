import React, { useState } from 'react';
import { contractService } from '../services/contractService.ts';
import { WalletState, CaseRecord, TxStep } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';

interface SuccessorWizardProps {
  walletState: WalletState;
  predecessorCase: CaseRecord;
  onTxStart: (step: TxStep, detail?: any) => void;
  onSuccessorCreated: (newCaseId: string) => void;
}

export const SuccessorWizard: React.FC<SuccessorWizardProps> = ({
  walletState,
  predecessorCase,
  onTxStart,
  onSuccessorCreated,
}) => {
  const [newActivityDate, setNewActivityDate] = useState('2026-10-01');
  const [nonce, setNonce] = useState(() => `succ-nonce-${Date.now().toString(36)}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner =
    walletState.address &&
    predecessorCase.owner.toLowerCase() === walletState.address.toLowerCase();

  const isTerminal = predecessorCase.state === 'LOCKED' || predecessorCase.state === 'NOT_APPLICABLE';
  const hasSuccessor = Boolean(predecessorCase.successor_case_id);

  const handleProposeSuccessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletState.connected) {
      setError('Please connect your wallet.');
      return;
    }
    if (!isOwner) {
      setError('Only the case owner can propose a successor.');
      return;
    }
    if (newActivityDate === predecessorCase.activity_date) {
      setError('New activity date must differ from predecessor activity date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await contractService.createSuccessor(
        predecessorCase.case_id,
        nonce,
        newActivityDate,
        (step, detail) => {
          onTxStart(step, detail);
        }
      );
      onSuccessorCreated(result.newCaseId);
    } catch (err: any) {
      setError(err?.message || 'Failed to propose successor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <RoleBoundaryBanner
        role="owner"
        title="Successor Lineage Registrar Mode (Owner Only)"
        description="Create a linked draft for a different activity date. Only the predecessor's owner can propose its successor."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Successor Lineage Proposal Wizard</h2>
          <p className="card-description">
            Create a successor draft without replacing the predecessor's assessment.
          </p>
        </div>

        <p className="card-description">
          The predecessor remains unchanged while the successor is DRAFT, FROZEN or UNRESOLVED.
          It becomes SUPERSEDED_BY_SUCCESSOR only after the successor reaches LOCKED or NOT_APPLICABLE.
          Checklist bindings never advance automatically; integrators must explicitly select a LOCKED successor.
        </p>

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {!isTerminal ? (
          <div className="banner banner-info" role="status">
            <div>
              Successors can only be proposed once a case reaches a terminal state (<code>LOCKED</code> or <code>NOT_APPLICABLE</code>). Current state: <strong>{predecessorCase.state}</strong>.
            </div>
          </div>
        ) : hasSuccessor ? (
          <div className="banner banner-info" role="status">
            <div>
              A successor has already been declared for this case: <strong className="mono">{predecessorCase.successor_case_id}</strong>.
            </div>
          </div>
        ) : !isOwner ? (
          <div className="banner banner-warning" role="alert">
            <div>
              Only the owner of case {predecessorCase.case_id} ({predecessorCase.owner.slice(0, 8)}...) can propose a successor.
            </div>
          </div>
        ) : (
          <form onSubmit={handleProposeSuccessor}>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="successor-predecessor-id" className="form-label">Predecessor Case ID</label>
                <input id="successor-predecessor-id" type="text" className="form-input mono" value={predecessorCase.case_id} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="successor-predecessor-date" className="form-label">Predecessor Activity Date</label>
                <input id="successor-predecessor-date" type="text" className="form-input mono" value={predecessorCase.activity_date} disabled />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="successor-activity-date" className="form-label">
                  New Target Activity Date
                </label>
                <input
                  id="successor-activity-date"
                  type="date"
                  className="form-input mono"
                  min="2000-01-01"
                  max="2035-12-31"
                  value={newActivityDate}
                  onChange={(e) => setNewActivityDate(e.target.value)}
                  required
                />
                <span className="form-hint">Must differ from predecessor activity date ({predecessorCase.activity_date}).</span>
              </div>

              <div className="form-group">
                <label htmlFor="successor-nonce" className="form-label">
                  Successor Client Nonce
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="successor-nonce"
                    type="text"
                    className="form-input mono"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setNonce(`succ-nonce-${Date.now().toString(36)}`)}
                    title="Generate new nonce"
                  >
                    ↻ New
                  </button>
                </div>
                <span className="form-hint">Idempotency nonce for successor registration.</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !walletState.connected || !CONTRACT_ADDRESS}
            >
              {loading ? 'Declaring Successor...' : 'Create Successor Draft'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
