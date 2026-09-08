import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { EIP6963ProviderDetail } from '../types/domain.ts';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: EIP6963ProviderDetail[];
  onSelectProvider: (provider: EIP6963ProviderDetail) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  providers,
  onSelectProvider,
}) => {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger element that held focus prior to opening
    const triggerElement = (document.activeElement as HTMLElement) || null;
    previouslyFocusedRef.current = triggerElement;

    // Delay initial focus to permit DOM mount, capturing timer id for cancellation
    const timerId = window.setTimeout(() => {
      (firstButtonRef.current || closeButtonRef.current)?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) || []
        );
        if (controls.length === 0) {
          e.preventDefault();
          return;
        }
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original trigger element upon close or unmount
      triggerElement?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }} aria-hidden="true">🔑</span>
            <h2 id="wallet-modal-title" className="modal-title">
              Select Wallet
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--rs-text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
          Connect via an EIP-6963 multi-injected provider to sign transactions on GenLayer Studionet. Supported wallets include MetaMask, OKX Wallet, and Rabby.
        </p>

        <div>
          {providers.length === 0 ? (
            <div className="banner banner-info" style={{ marginTop: '8px' }}>
              <div>
                <strong>No supported wallet detected.</strong> Please install MetaMask, OKX Wallet, or Rabby extension in your browser to interact with on-chain cases.
              </div>
            </div>
          ) : (
            providers.map((p, index) => (
              <button
                key={p.info.uuid || index}
                ref={index === 0 ? firstButtonRef : undefined}
                className="wallet-card"
                onClick={() => {
                  onSelectProvider(p);
                  onClose();
                }}
                aria-label={`Connect with ${p.info.name}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {p.info.icon ? (
                    <img
                      src={p.info.icon}
                      alt=""
                      aria-hidden="true"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'var(--rs-border)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--rs-text-muted)',
                      }}
                    >
                      {p.info.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--rs-text-heading)', display: 'block' }}>
                      {p.info.name}
                    </span>
                    {p.info.rdns && (
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--rs-text-subtle)' }}>
                        {p.info.rdns}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--rs-cyan-bright)' }}>
                  Connect →
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
