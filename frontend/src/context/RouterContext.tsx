import React, { createContext, useContext, useState, useEffect } from 'react';

export type Page = 'home' | 'dashboard' | 'contracts' | 'protocol';

interface RouterContextType {
  page: Page;
  navigate: (to: Page) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [page, setPage] = useState<Page>('home');

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        setPage('dashboard');
      } else if (path === '/contracts') {
        setPage('contracts');
      } else if (path === '/protocol' || path === '/about') {
        setPage('protocol');
      } else {
        setPage('home');
      }
    };

    // Run once on load
    handleLocationChange();

    // Listen to history traversal (popstate)
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (to: Page) => {
    let path = '/';
    if (to === 'dashboard') path = '/dashboard';
    else if (to === 'contracts') path = '/contracts';
    else if (to === 'protocol') path = '/protocol';

    window.history.pushState({}, '', path);
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <RouterContext.Provider value={{ page, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
