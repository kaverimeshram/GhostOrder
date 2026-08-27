import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OnChainOrder } from './types/contracts';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from './config/contracts';
import { Terminal, Shield, Cpu, ExternalLink } from 'lucide-react';

const MainApp: React.FC = () => {
  const { refreshOrders, refreshOrders: triggerRefresh } = useOrders();
  const { refreshBalance } = useWallet();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OnChainOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([triggerRefresh(), refreshBalance()]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Top Header */}
      <div>
        <Header
          onOpenCreateOrder={() => setIsCreateModalOpen(true)}
          onRefresh={handleRefreshAll}
          isRefreshing={isRefreshing}
        />

        {/* Hero Dashboard */}
        <Dashboard onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

        {/* Live Orders Table */}
        <main>
          <OrderList onSelectOrder={(order) => setSelectedOrder(order)} />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-8 px-6 text-xs text-[var(--text-muted)] mt-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-white" />
            <span className="text-white font-bold">GHOSTORDER PROTOCOL</span>
            <span>//</span>
            <span>Cairo 2.9 On-Chain Engine</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <span>Escrow Explorer</span>
              <ExternalLink size={10} />
            </a>
            <span>•</span>
            <span>Network: {NETWORK_CONFIG.networkName}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <OrderProvider>
        <MainApp />
      </OrderProvider>
    </WalletProvider>
  );
};

export default App;
