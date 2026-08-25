import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { DeploymentBanner } from './components/DeploymentBanner.tsx';
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

export const App: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('lookup');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);

  // Transaction Progress Modal state
  const [txStep, setTxStep] = useState<TxStep>('IDLE');
  const [txDetail, setTxDetail] = useState<any>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Unfinished recovery journal alert
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  useEffect(() => {
    const unsub = walletService.subscribe((state) => {
      setWalletState(state);
    });

    const cleanupEip6963 = walletService.initEIP6963();
    setDiscoveredProviders(walletService.getDiscoveredProviders());

    // Check for pending unfinalized operations in journal
    const pending = journalService.getPendingOperations();
    if (pending.length > 0) {
      setPendingOps(pending);
    }

    return () => {
      unsub();
      cleanupEip6963?.();
    };
  }, []);

  const handleOpenWalletModal = () => {
    setDiscoveredProviders(walletService.getDiscoveredProviders());
    setIsWalletModalOpen(true);
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
    setIsTxModalOpen(false);
    setTxStep('IDLE');
    setTxDetail(null);
    handleRefreshActiveCase();
  };

  return (
    <div
      className="app-container"
      inert={isWalletModalOpen ? true : undefined}
      aria-hidden={isWalletModalOpen ? 'true' : undefined}
    >
      <Header
        walletState={walletState}
        onOpenWalletModal={handleOpenWalletModal}
        onDisconnect={() => walletService.disconnect()}
        onSwitchChain={() => walletService.switchChain()}
      />

      <main style={{ paddingBottom: '40px' }}>
        <DeploymentBanner />

        {/* Journal Recovery Notice */}
        {pendingOps.length > 0 && (
          <div className="banner banner-warning" style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
              Pending Operation Recovery Notice
            </div>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Found {pendingOps.length} pending operation(s) recorded in your local journal prior to session reload.
              Operations must be reconciled against the Studionet RPC to confirm finality before re-attempting.
            </p>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  const result = await journalService.reconcilePendingOperations(
                    undefined,
                    (operation) => contractService.verifyPendingOperation(operation)
                  );
                  setPendingOps(result.reconciled);
                  if (result.finalized.length > 0) {
                    handleRefreshActiveCase();
                  }
                }}
              >
                Reconcile with Chain
              </button>
            </div>
          </div>
        )}

        {/* Primary Tab Navigation */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'lookup'}
            className={`tab-button ${activeTab === 'lookup' ? 'active' : ''}`}
            onClick={() => setActiveTab('lookup')}
          >
            Public Evidence Lookup
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'creator'}
            className={`tab-button ${activeTab === 'creator' ? 'active' : ''}`}
            onClick={() => setActiveTab('creator')}
          >
            Case Creator & Lifecycle
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'resolver'}
            className={`tab-button ${activeTab === 'resolver' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolver')}
          >
            Resolver Consensus
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'integrator'}
            className={`tab-button ${activeTab === 'integrator' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrator')}
          >
            Checklist Integrator
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'successor'}
            className={`tab-button ${activeTab === 'successor' ? 'active' : ''}`}
            onClick={() => setActiveTab('successor')}
          >
            Successor Wizard
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'auditor'}
            className={`tab-button ${activeTab === 'auditor' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditor')}
          >
            Auditor Hub
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'lookup' && (
          <PublicLookup selectedCaseId={selectedCaseId} onSelectCase={handleSelectCase} />
        )}

        {activeTab === 'creator' && (
          <OwnerWorkbench
            walletState={walletState}
            activeCase={activeCase}
            onTxStart={handleTxStart}
            onCaseCreated={(newId) => {
              handleSelectCase(newId);
              setActiveTab('lookup');
            }}
            onRefreshActiveCase={handleRefreshActiveCase}
          />
        )}

        {activeTab === 'resolver' && (
          <ResolverWorkbench
            walletState={walletState}
            activeCase={activeCase}
            onTxStart={handleTxStart}
            onRefreshActiveCase={handleRefreshActiveCase}
          />
        )}

        {activeTab === 'integrator' && (
          <IntegratorWorkbench
            walletState={walletState}
            activeCase={activeCase}
            onTxStart={handleTxStart}
          />
        )}

        {activeTab === 'successor' && (
          activeCase ? (
            <SuccessorWizard
              walletState={walletState}
              predecessorCase={activeCase}
              onTxStart={handleTxStart}
              onSuccessorCreated={(newId) => {
                handleSelectCase(newId);
                setActiveTab('lookup');
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

        {activeTab === 'auditor' && <AuditorView />}
      </main>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
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
