import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Footer from '../../components/widgets/Footer';
import Header from '../../components/widgets/Header';
import { Sidebar } from '../../components/widgets/Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster
        toastOptions={{
          style: { background: '#F5F0FF', color: '#3B0764', border: '.2px solid rgba(124, 58, 237, 0.2)', borderRadius: '4px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
          duration: 3000,
        }}
        position="top-right"
        richColors
      />
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] px-8 py-6">
          <Header />
          <Outlet />
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Layout;
