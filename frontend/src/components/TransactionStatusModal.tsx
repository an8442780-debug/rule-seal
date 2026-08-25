import React from 'react';
import { TxStep } from '../types/domain.ts';
import { STUDIONET_EXPLORER } from '../config/chain.ts';

interface TransactionStatusModalProps {
  isOpen: boolean;
  step: TxStep;
  detail?: any;
  onClose: () => void;
}

export const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  isOpen,
  step,
  detail,
  onClose,
}) => {
  if (!isOpen || step === 'IDLE') return null;

  const getStepTitle = () => {
    switch (step) {
      case 'SIGNING':
        return 'Awaiting Wallet Signature';
      case 'SUBMITTED':
        return 'Transaction Submitted to Studionet';
      case 'FINALIZING':
        return 'Validators Executing Consensus';
      case 'SUCCESS':
        return 'Transaction Finalized & Authoritative';
      case 'ERROR':
        return 'Transaction Failed';
      default:
        return 'Processing Transaction';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'SIGNING':
        return 'Please confirm and sign the transaction in your connected wallet extension.';
      case 'SUBMITTED':
        return 'Transaction has been broadcast to GenLayer Studionet RPC and is queued for leader inclusion.';
      case 'FINALIZING':
        return 'GenLayer intelligent validators are fetching external regulatory sources and verifying substantive consensus.';
      case 'SUCCESS':
        return 'The operation succeeded and the immutable state has been recorded on-chain.';
      case 'ERROR':
        return detail?.error || detail?.message || 'An error occurred while processing the transaction.';
      default:
        return '';
    }
  };

  const txHash = detail?.txHash || (typeof detail === 'string' && detail.startsWith('0x') ? detail : null);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{getStepTitle()}</h3>
          {(step === 'SUCCESS' || step === 'ERROR') && (
            <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          {step !== 'SUCCESS' && step !== 'ERROR' && (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-color)',
                borderTop: '3px solid var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto',
              }}
            />
          )}

          {step === 'SUCCESS' && (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 auto 16px auto',
              }}
            >
              ✓
            </div>
          )}

          {step === 'ERROR' && (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 auto 16px auto',
              }}
            >
              ✕
            </div>
          )}

          <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '12px' }}>
            {getStepDescription()}
          </p>

          {txHash && (
            <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: '4px', marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                TRANSACTION HASH
              </div>
              <a
                href={`${STUDIONET_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mono"
                style={{ fontSize: '12px', color: 'var(--accent-primary)', wordBreak: 'break-all' }}
              >
                {txHash}
              </a>
            </div>
          )}
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: step === 'SIGNING' ? 700 : 400, color: step === 'SIGNING' ? 'var(--accent-primary)' : 'inherit' }}>
            1. Sign
          </span>
          <span>→</span>
          <span style={{ fontWeight: step === 'SUBMITTED' ? 700 : 400, color: step === 'SUBMITTED' ? 'var(--accent-primary)' : 'inherit' }}>
            2. Broadcast
          </span>
          <span>→</span>
          <span style={{ fontWeight: step === 'FINALIZING' ? 700 : 400, color: step === 'FINALIZING' ? 'var(--accent-primary)' : 'inherit' }}>
            3. Consensus
          </span>
          <span>→</span>
          <span style={{ fontWeight: step === 'SUCCESS' ? 700 : 400, color: step === 'SUCCESS' ? '#16a34a' : 'inherit' }}>
            4. Verify
          </span>
        </div>

        {(step === 'SUCCESS' || step === 'ERROR') && (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
};
