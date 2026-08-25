import React from 'react';
import { WalletState } from '../types/domain.ts';
import { STUDIONET_CONFIG } from '../config/chain.ts';

interface HeaderProps {
  walletState: WalletState;
  onOpenWalletModal: () => void;
  onDisconnect: () => void;
  onSwitchChain: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  onOpenWalletModal,
  onDisconnect,
  onSwitchChain,
}) => {
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="app-header">
      <div>
        <h1 className="brand-title">Regulatory Edition Applicability Lock</h1>
        <p className="brand-subtitle">14 CFR § 71.1 · FAA Order JO 7400.11 · IBR Baseline Lock</p>
      </div>

      <div className="header-actions">
        {walletState.connected ? (
          <>
            {!walletState.isCorrectChain ? (
              <button
                className="btn btn-sm btn-danger"
                onClick={onSwitchChain}
                title="Click to switch to Studionet (61999)"
              >
                Switch to Studionet
              </button>
            ) : (
              <span className="badge-network">Studionet ({STUDIONET_CONFIG.chainId})</span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 600 }}>
                {formatAddress(walletState.address || '')}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onDisconnect}
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onOpenWalletModal}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};
