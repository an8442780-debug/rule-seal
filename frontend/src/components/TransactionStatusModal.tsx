import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TxStep } from '../types/domain.ts';
import { STUDIONET_EXPLORER } from '../config/chain.ts';

const PHASES: TxStep[] = ['WAITING_FOR_WALLET', 'SUBMITTED', 'WAITING_FOR_FINALITY', 'VERIFYING_EXECUTION', 'VERIFYING_READBACK', 'SUCCESS'];
const COPY: Record<TxStep, [string, string]> = {
  IDLE: ['Ready', 'No transaction is in progress.'],
  WAITING_FOR_WALLET: ['Confirm in your wallet', 'Review the request in your selected wallet and confirm or reject it.'],
  SUBMITTED: ['Transaction submitted', 'Your wallet returned a transaction hash. The result is not yet verified.'],
  WAITING_FOR_FINALITY: ['Waiting for finality', 'Studionet is processing the transaction. Submission or acceptance is not final success.'],
  VERIFYING_EXECUTION: ['Verifying execution', 'The transaction is finalized. Its execution result is being checked.'],
  VERIFYING_READBACK: ['Verifying the result', 'The finalized execution is being compared with authoritative contract state.'],
  SUCCESS: ['Transaction complete', 'Finality, successful execution and the resulting contract state were verified. Opening the updated record…'],
  REJECTED: ['Request rejected', 'You declined the wallet request. Review the form before trying again.'],
  FAILED: ['Transaction failed', 'The finalized transaction did not execute successfully.'],
  RECONCILIATION_REQUIRED: ['Verification interrupted', 'Do not submit again. Close this dialog and use Reconcile with Chain to check the existing operation.'],
};

interface Props {
  isOpen: boolean;
  step: TxStep;
  detail?: any;
  onClose: () => void;
}

export const TransactionStatusModal: React.FC<Props> = ({ isOpen, step, detail, onClose }) => {
  // The matching CSS keeps status text visible while prefers-reduced-motion disables rotation.
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isPending = PHASES.includes(step) && step !== 'SUCCESS';
  const pendingRef = useRef(isPending);
  const visible = isOpen && step !== 'IDLE';
  const [copyStatus, setCopyStatus] = useState('');
  onCloseRef.current = onClose;
  pendingRef.current = isPending;

  useEffect(() => {
    if (!visible) return;
    setCopyStatus('');
    const trigger = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => dialogRef.current?.focus(), 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!pendingRef.current) onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') ?? []);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) { event.preventDefault(); dialogRef.current?.focus(); return; }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current || !dialogRef.current?.contains(active))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', keydown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 'SUCCESS') return;
    const timer = window.setTimeout(() => onCloseRef.current(), 1800);
    return () => window.clearTimeout(timer);
  }, [visible, step]);

  if (!visible) return null;
  const hash = /^0x[0-9a-fA-F]{64}$/.test(detail?.txHash ?? '') ? detail.txHash as string : null;
  const alert = ['FAILED', 'REJECTED', 'RECONCILIATION_REQUIRED'].includes(step);
  const [title, description] = COPY[step];

  return createPortal(
    <div className="modal-overlay" onClick={(event) => {
      if (event.target === event.currentTarget && !pendingRef.current) onCloseRef.current();
    }}>
      <div ref={dialogRef} className="modal-content transaction-dialog" role="dialog" aria-modal="true"
        aria-labelledby="tx-modal-title" aria-describedby="tx-modal-description" tabIndex={-1}>
        <div data-transaction-phase={step} role={alert ? 'alert' : 'status'} aria-live={alert ? 'assertive' : 'polite'} aria-atomic="true">
          <h2 id="tx-modal-title">{title}</h2>
          {isPending && <span className="transaction-spinner" aria-hidden="true" />}
          <p id="tx-modal-description">{description}</p>
        </div>
        {detail?.message && <p>{detail.message}</p>}
        {detail?.persistenceDegraded && <p role="alert">Keep this page open and copy the hash now. Browser storage could not retain it reliably; do not reload or submit again.</p>}
        {hash && <div className="transaction-hash">
          <span>Transaction hash · Studionet</span>
          <code>{hash}</code>
          <div className="transaction-actions">
            <button type="button" className="btn btn-secondary" onClick={async () => {
              try { await navigator.clipboard.writeText(hash); setCopyStatus('Hash copied.'); }
              catch { setCopyStatus('Copy unavailable. Select and copy the full hash above.'); }
            }}>Copy hash</button>
            <a href={`${STUDIONET_EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer noopener">View transaction ↗</a>
          </div>
          <span role="status">{copyStatus}</span>
        </div>}
        <ol className="transaction-phases" aria-label="Transaction lifecycle">
          {PHASES.map((phase) => <li key={phase} aria-current={phase === step ? 'step' : undefined}>
            {COPY[phase][0]}
          </li>)}
        </ol>
        {!isPending && <button type="button" className="btn btn-primary" onClick={onClose}>
          {step === 'RECONCILIATION_REQUIRED' ? 'Review recovery options' : 'Close'}
        </button>}
      </div>
    </div>, document.body,
  );
};
