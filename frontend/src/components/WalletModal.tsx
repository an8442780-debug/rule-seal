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

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        (firstButtonRef.current || closeButtonRef.current)?.focus();
      }, 0);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Tab') {
          const controls = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || []
          );
          if (controls.length === 0) return;
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
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal((
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
          <h2 id="wallet-modal-title" className="modal-title">
            Select Wallet
          </h2>
          <button
            ref={closeButtonRef}
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Connect via an EIP-6963 provider. Supported: MetaMask, OKX Wallet, Rabby.
        </p>

        <div>
          {providers.length === 0 ? (
            <div className="banner banner-info" style={{ marginTop: '8px' }}>
              No supported wallet detected. Please install MetaMask, OKX Wallet, or Rabby.
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
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {p.info.icon ? (
                    <img
                      src={p.info.icon}
                      alt=""
                      style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{p.info.name}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Connect →</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  ), document.body);
};
