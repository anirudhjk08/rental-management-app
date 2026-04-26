'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🏪 Rental App</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Hello, {user.name}!</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">

        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Owner Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              🏠 As an Owner
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Create and manage your shops
            </p>
            <button
              onClick={() => router.push('/shops')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Manage Shops
            </button>
          </div>

          {/* Tenant Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              🔍 As a Tenant
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Search and join a shop
            </p>
            <button
              onClick={() => router.push('/shops')}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
            >
              Find a Shop
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              🔔 Notifications
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              View your recent alerts
            </p>
            <button
              onClick={() => router.push('/notifications')}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-all"
            >
              View Notifications
            </button>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              👤 Profile
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {user.email}
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}