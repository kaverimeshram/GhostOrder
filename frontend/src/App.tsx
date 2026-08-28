import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { OrderProvider } from './context/OrderContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { ContractsSection } from './components/ContractsSection';
import { Protocol } from './components/Protocol';
import { ProductExperience } from './components/ProductExperience';
import { Footer } from './components/Footer';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { OnChainOrder } from './types/contracts';

const MainApp: React.FC = () => {
  const { page, navigate } = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OnChainOrder | null>(null);

  return (
    <div className="min-h-screen bg-[#06080c] text-[#f5f7ff] flex flex-col justify-between selection:bg-[#6366f1] selection:text-white w-full">
      <div>
        {/* Header */}
        <Header onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

        {/* Home page route */}
        {page === 'home' && (
          <>
            {/* Hero Section */}
            <Hero onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

            {/* Trust / Protocol Bar */}
            <TrustStrip />

            {/* How It Works Section */}
            <HowItWorks onOpenCreateOrder={() => setIsCreateModalOpen(true)} />

            {/* Product Experience Section */}
            <ProductExperience />

            {/* Security & Features Section */}
            <Features />

            {/* Final CTA Section */}
            <section className="py-20 sm:py-28 lg:py-36 bg-[#07090e] border-t border-border w-full text-center">
              <div className="container-custom space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-text-primary">
                  Ready to automate your trading?
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
                  Experience institutional-grade conditional orders on Starknet. Open the app to configure your price targets and deploy secure escrows.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => navigate('dashboard')}
                    className="btn-primary text-sm font-semibold cursor-pointer animate-pulse"
                  >
                    <span>Open Dashboard →</span>
                  </button>
                </div>
              </div>
            </section>
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

        {/* Protocol route */}
        {page === 'protocol' && (
          <Protocol />
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
