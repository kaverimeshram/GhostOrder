import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { OrderProvider } from './context/OrderContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Header } from './components/Header';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import QuestionsSection from './components/QuestionsSection';
import Features from './components/Features';
import Protocol from './components/Protocol';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import RequestAccessModal from './components/RequestAccessModal';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { ContractsSection } from './components/ContractsSection';
import Footer from './components/Footer';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OnChainOrder } from './types/contracts';

const MainApp: React.FC = () => {
  const { page, navigate } = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OnChainOrder | null>(null);
  const [isRequestAccessModalOpen, setIsRequestAccessModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-bg text-[#f5f7ff] flex flex-col justify-between selection:bg-[#10b981] selection:text-[#030508] w-full">
      <div>
        {/* Header */}
        <Header onRequestAccess={() => setIsRequestAccessModalOpen(true)} />

        {/* Home page route */}
        {page === 'home' && (
          <>
            {/* Hero Section */}
            <Hero onRequestAccess={() => setIsRequestAccessModalOpen(true)} />

            {/* Trust Strip */}
            <TrustStrip />

            {/* Why It Matters */}
            <QuestionsSection />

            {/* Product walkthrough and comparison */}
            <Features />

            {/* Protocol Invariants */}
            <Protocol />

            {/* FAQ Section */}
            <FAQ />

            {/* Final CTA Section */}
            <FinalCTA onRequestAccess={() => setIsRequestAccessModalOpen(true)} />
          </>
        )}

        {/* Dashboard route */}
        {page === 'dashboard' && (
          <>
            {/* Dashboard & On-Chain Order Management */}
            <Dashboard onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

            {/* Orders Table */}
            <main>
              <OrderList onSelectOrder={(order) => setSelectedOrder(order)} />
            </main>
          </>
        )}

        {/* Contracts route */}
        {page === 'contracts' && (
          <ContractsSection />
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {isRequestAccessModalOpen && (
        <RequestAccessModal onClose={() => setIsRequestAccessModalOpen(false)} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <OrderProvider>
        <RouterProvider>
          <MainApp />
        </RouterProvider>
      </OrderProvider>
    </WalletProvider>
  );
};

export default App;
