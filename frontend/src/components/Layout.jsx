// src/components/Layout.jsx — Medical Blue & White Responsive Shell & Accessible Layout
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F8FC] text-[#4B5D6B]">
      {/* Accessible Skip Link for Keyboard Navigation */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Navigation Drawer / Deep Navy Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F8FC]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F8FC] text-[#4B5D6B] focus:outline-none"
        >
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
