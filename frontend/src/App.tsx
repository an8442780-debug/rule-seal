import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { DeploymentBanner } from './components/DeploymentBanner.tsx';
import { RegulatoryLandingIntro } from './components/RegulatoryLandingIntro.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { PublicLookup } from './components/PublicLookup.tsx';
import { OwnerWorkbench } from './components/OwnerWorkbench.tsx';
import { ResolverWorkbench } from './components/ResolverWorkbench.tsx';
import { IntegratorWorkbench } from './components/IntegratorWorkbench.tsx';
import { SuccessorWizard } from './components/SuccessorWizard.tsx';
import { AuditorView } from './components/AuditorView.tsx';
import { TransactionStatusModal } from './components/TransactionStatusModal.tsx';
import { walletService } from './services/walletService.ts';
import { journalService } from './services/journalService.ts';
import { contractService } from './services/contractService.ts';
import { WalletState, CaseRecord, TxStep, PendingOperation, EIP6963ProviderDetail } from './types/domain.ts';

type ActiveTab = 'lookup' | 'creator' | 'resolver' | 'integrator' | 'successor' | 'auditor';

interface TabItem {
  id: ActiveTab;
  label: string;
  roleTag: string;
}

const TABS: TabItem[] = [
  { id: 'lookup', label: 'Public Evidence Lookup', roleTag: 'Public' },
  { id: 'creator', label: 'Case Creator & Lifecycle', roleTag: 'Owner' },
  { id: 'resolver', label: 'Resolver Consensus', roleTag: 'Resolver' },
  { id: 'integrator', label: 'Checklist Integrator', roleTag: 'Integrator' },
  { id: 'successor', label: 'Successor Wizard', roleTag: 'Owner' },
  { id: 'auditor', label: 'Auditor Hub', roleTag: 'Auditor' },
];

export const App: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('lookup');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);

  // Ref array for tab buttons to manage roving focus
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Transaction Progress Modal state
  const [txStep, setTxStep] = useState<TxStep>('IDLE');
  const [txDetail, setTxDetail] = useState<any>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Unfinished recovery journal alert
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  useEffect(() => {
    const unsub = walletService.subscribe((state) => {
      setWalletState(state);
      // EIP-6963 announcements can arrive after the chooser opens; keep the
      // visible provider list synchronized with the page-level registry.
      setDiscoveredProviders(walletService.getDiscoveredProviders());
    });

    const cleanupEip6963 = walletService.initEIP6963();
    setDiscoveredProviders(walletService.getDiscoveredProviders());

    // Check for pending unfinalized operations in journal
    try {
      setPendingOps(journalService.getPendingOperations());
    } catch {
      setRecoveryError('Recovery storage is unavailable or unreadable. Restore browser storage access before another write. Existing recovery data has not been deleted.');
    }

    return () => {
      unsub();
      cleanupEip6963?.();
    };
  }, []);

  const handleOpenWalletModal = () => {
    setDiscoveredProviders(walletService.getDiscoveredProviders());
    walletService.openChooser();
    setIsWalletModalOpen(true);
  };

  const handleCloseWalletModal = () => {
    walletService.closeChooser();
    setIsWalletModalOpen(false);
  };

  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    try {
      const c = await contractService.getCase(caseId, true);
      setActiveCase(c);
    } catch {
      setActiveCase(null);
    }
  };

  const handleRefreshActiveCase = async () => {
    if (selectedCaseId) {
      await handleSelectCase(selectedCaseId);
    }
  };

  const handleTxStart = (step: TxStep, detail?: any) => {
    setTxStep(step);
    setTxDetail(detail);
    if (step !== 'IDLE') {
      setIsTxModalOpen(true);
    }
  };

  const handleTxClose = () => {
    const completedCaseId = txStep === 'SUCCESS' ? txDetail?.newCaseId || txDetail?.caseId : null;
    setIsTxModalOpen(false);
    setTxStep('IDLE');
    setTxDetail(null);
    try { setPendingOps(journalService.getPendingOperations()); }
    catch { setRecoveryError('Recovery storage is unavailable. Do not submit again until the existing operation is verified.'); }
    if (completedCaseId) {
      setActiveTab('lookup');
      void handleSelectCase(completedCaseId);
    } else {
      void handleRefreshActiveCase();
    }
  };

  // Keyboard navigation for WAI-ARIA tabs (ArrowLeft, ArrowRight, Home, End)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab.id);
      tabButtonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      className="app-container"
      inert={isWalletModalOpen || isTxModalOpen ? true : undefined}
      aria-hidden={isWalletModalOpen || isTxModalOpen ? 'true' : undefined}
    >
      <Header
        walletState={walletState}
        onOpenWalletModal={handleOpenWalletModal}
        onDisconnect={() => walletService.disconnect()}
        onSwitchChain={() => walletService.switchChain()}
      />

      <main style={{ paddingBottom: '40px' }} role="main">
        <DeploymentBanner />

        {/* 4-Pillar Regulatory Dossier Intro Briefing */}
        <RegulatoryLandingIntro />

        {/* Journal Recovery Notice */}
        {(pendingOps.length > 0 || recoveryError) && (
          <div className="banner banner-warning" role="alert" style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠</span>
                <span>Pending Operation Recovery Notice</span>
              </div>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {recoveryError || <>
                Found {pendingOps.length} pending operation(s) recorded in your local recovery journal prior to session reload.
                Operations must be reconciled against the Studionet RPC to confirm finality before re-attempting.
                </>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={reconciling}
                onClick={async () => {
                  setReconciling(true);
                  try {
                    const result = await journalService.reconcilePendingOperations(
                      undefined,
                      (operation) => contractService.verifyPendingOperation(operation)
                    );
                    setPendingOps(result.reconciled);
                    setRecoveryError('');
                    if (result.finalized.length > 0) {
                      handleRefreshActiveCase();
                    }
                  } catch {
                    setRecoveryError('Verification could not finish. Keep the existing operation and restore storage or network access before checking again. Do not resubmit.');
                  } finally {
                    setReconciling(false);
                  }
                }}
              >
                {reconciling ? 'Reconciling...' : 'Reconcile with Chain'}
              </button>
            </div>
          </div>
        )}

        {/* Primary WAI-ARIA Tab Navigation */}
        <nav className="tabs" role="tablist" aria-label="RuleSeal Workflows">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[idx] = el;
                }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                <span>{tab.label}</span>
                <span className="tab-role-tag">{tab.roleTag}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panels with synchronized role="tabpanel" */}
        <div id="tab-panels-region">
          <div id="panel-lookup" role="tabpanel" aria-labelledby="tab-lookup" hidden={activeTab !== 'lookup'} tabIndex={activeTab === 'lookup' ? 0 : -1}>
            {activeTab === 'lookup' && (
              <PublicLookup selectedCaseId={selectedCaseId} onSelectCase={handleSelectCase} />
            )}
          </div>

          <div id="panel-creator" role="tabpanel" aria-labelledby="tab-creator" hidden={activeTab !== 'creator'} tabIndex={activeTab === 'creator' ? 0 : -1}>
            {activeTab === 'creator' && (
              <OwnerWorkbench
                walletState={walletState}
                activeCase={activeCase}
                onTxStart={handleTxStart}
                onCaseCreated={(newId) => {
                  handleSelectCase(newId);
                  setActiveTab('lookup');
                  tabButtonRefs.current[0]?.focus();
                }}
                onRefreshActiveCase={handleRefreshActiveCase}
              />
            )}
          </div>

          <div id="panel-resolver" role="tabpanel" aria-labelledby="tab-resolver" hidden={activeTab !== 'resolver'} tabIndex={activeTab === 'resolver' ? 0 : -1}>
            {activeTab === 'resolver' && (
              <ResolverWorkbench
                walletState={walletState}
                activeCase={activeCase}
                onTxStart={handleTxStart}
                onRefreshActiveCase={handleRefreshActiveCase}
              />
            )}
          </div>

          <div id="panel-integrator" role="tabpanel" aria-labelledby="tab-integrator" hidden={activeTab !== 'integrator'} tabIndex={activeTab === 'integrator' ? 0 : -1}>
            {activeTab === 'integrator' && (
              <IntegratorWorkbench
                walletState={walletState}
                activeCase={activeCase}
                onTxStart={handleTxStart}
              />
            )}
          </div>

          <div id="panel-successor" role="tabpanel" aria-labelledby="tab-successor" hidden={activeTab !== 'successor'} tabIndex={activeTab === 'successor' ? 0 : -1}>
            {activeTab === 'successor' && (
              activeCase ? (
                <SuccessorWizard
                  walletState={walletState}
                  predecessorCase={activeCase}
                  onTxStart={handleTxStart}
                  onSuccessorCreated={(newId) => {
                    handleSelectCase(newId);
                    setActiveTab('lookup');
                    tabButtonRefs.current[0]?.focus();
                  }}
                />
              ) : (
                <div className="card">
                  <div className="banner banner-info">
                    Please select or lookup a terminal case (<code>LOCKED</code> or <code>NOT_APPLICABLE</code>) in Public Lookup to propose a successor.
                  </div>
                </div>
              )
            )}
          </div>

          <div id="panel-auditor" role="tabpanel" aria-labelledby="tab-auditor" hidden={activeTab !== 'auditor'} tabIndex={activeTab === 'auditor' ? 0 : -1}>
            {activeTab === 'auditor' && (
              <AuditorView />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={handleCloseWalletModal}
        providers={discoveredProviders}
        onSelectProvider={(p) => walletService.connectProvider(p)}
      />

      <TransactionStatusModal
        isOpen={isTxModalOpen}
        step={txStep}
        detail={txDetail}
        onClose={handleTxClose}
      />
    </div>
  );
};
