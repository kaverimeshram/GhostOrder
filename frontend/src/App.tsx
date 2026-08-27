import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { OrderProvider } from './context/OrderContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { ContractsSection } from './components/ContractsSection';
import { Footer } from './components/Footer';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OnChainOrder } from './types/contracts';

const MainApp: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OnChainOrder | null>(null);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] flex flex-col justify-between selection:bg-[var(--accent-blue)] selection:text-white">
      <div>
        {/* Header */}
        <Header
          onOpenCreateOrder={() => setIsCreateModalOpen(true)}
          onScrollToSection={scrollToSection}
        />

        {/* Hero Section */}
        <Hero
          onOpenCreateOrder={() => setIsCreateModalOpen(true)}
          onScrollToSection={scrollToSection}
        />

        {/* Trust / Protocol Bar */}
        <TrustStrip />

        {/* How It Works Section */}
        <HowItWorks
          onOpenCreateOrder={() => setIsCreateModalOpen(true)}
        />

        {/* Security & Features Section */}
        <Features />

        {/* Dashboard & On-Chain Order Management */}
        <Dashboard onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

        {/* Orders Table */}
        <main>
          <OrderList onSelectOrder={(order) => setSelectedOrder(order)} />
        </main>

        {/* Deployed Smart Contracts */}
        <ContractsSection />
      </div>

      {/* Footer */}
      <Footer onScrollToSection={scrollToSection} />

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
