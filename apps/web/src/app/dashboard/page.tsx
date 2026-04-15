'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Placeholder content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Leads</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Active Sequences</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Emails Sent</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Response Rate</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">0%</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <p className="text-gray-600">No recent activity to display.</p>
            </div>
          </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}