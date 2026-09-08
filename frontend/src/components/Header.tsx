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
    <header className="app-header" role="banner">
      <div className="brand-wrapper">
        <img
          src="/rule-seal-logo.svg"
          alt="RuleSeal Emblem"
          className="brand-logo-img"
          width="44"
          height="44"
        />
        <div>
          <h1 className="brand-title">
            <span className="brand-title-mark">RuleSeal</span>
          </h1>
          <p className="brand-subtitle">
            <span>14 CFR § 71.1</span>
            <span className="sep">·</span>
            <span>FAA Order JO 7400.11</span>
            <span className="sep">·</span>
            <span>IBR Baseline Lock</span>
          </p>
        </div>
      </div>

      <div className="header-actions">
        {walletState.connected ? (
          <>
            {!walletState.isCorrectChain ? (
              <button
                className="btn btn-sm btn-danger"
                onClick={onSwitchChain}
                title="Click to switch to Studionet (61999)"
                aria-label="Switch to Studionet network"
              >
                Switch to Studionet
              </button>
            ) : (
              <div className="badge-network" title="Connected to GenLayer Studionet">
                <span className="network-dot" aria-hidden="true" />
                <span>Studionet ({STUDIONET_CONFIG.chainId})</span>
              </div>
            )}

            <div className="account-pill">
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
          <button
            className="btn btn-primary"
            onClick={onOpenWalletModal}
            aria-label="Connect Web3 Wallet"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};
