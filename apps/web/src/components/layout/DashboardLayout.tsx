'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, workspace, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">Outreach AI</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>Dashboard</span>
            </Link>
            <Link href="/leads" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>Leads</span>
            </Link>
            <Link href="/sequences" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>Sequences</span>
            </Link>
            <Link href="/analytics" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>Analytics</span>
            </Link>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500">{workspace?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}