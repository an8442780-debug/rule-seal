import React, { useState } from 'react';
import { contractService } from '../services/contractService.ts';
import { WalletState, CaseRecord, TxStep } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';

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
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Successor Lineage Proposal Wizard</h2>
        <p className="card-description">
          Create an immutable successor baseline for a new activity date while preserving full historical lineage.
        </p>
      </div>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {!isTerminal ? (
        <div className="banner banner-info">
          Successors can only be proposed once a case reaches a terminal state (<code>LOCKED</code> or <code>NOT_APPLICABLE</code>). Current state: <strong>{predecessorCase.state}</strong>.
        </div>
      ) : hasSuccessor ? (
        <div className="banner banner-info">
          A successor has already been declared for this case: <strong className="mono">{predecessorCase.successor_case_id}</strong>.
        </div>
      ) : !isOwner ? (
        <div className="banner banner-warning">
          Only the owner of case {predecessorCase.case_id} ({predecessorCase.owner.slice(0, 8)}...) can propose a successor.
        </div>
      ) : (
        <form onSubmit={handleProposeSuccessor}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Predecessor Case ID</label>
              <input type="text" className="form-input mono" value={predecessorCase.case_id} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Predecessor Activity Date</label>
              <input type="text" className="form-input mono" value={predecessorCase.activity_date} disabled />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="successor-activity-date" className="form-label">New Target Activity Date</label>
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
            </div>
            <div className="form-group">
              <label htmlFor="successor-nonce" className="form-label">Successor Client Nonce</label>
              <input
                id="successor-nonce"
                type="text"
                className="form-input mono"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                required
              />
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
  );
};
