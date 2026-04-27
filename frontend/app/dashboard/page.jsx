'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDarkMode } from '@/lib/useDarkMode';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const { isDark, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading]);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Navbar */}
      <nav className={`shadow-sm px-6 py-4 flex justify-between items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className="text-xl font-bold text-blue-600">🏪 Rental App</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all
              ${isDark ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Hello, {user.name}!
          </span>
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
        <div className={`rounded-2xl shadow-sm p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Welcome back, {user.name}! 👋
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{user.email}</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🏠 As an Owner
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Create and manage your shops
            </p>
            <button
              onClick={() => router.push('/shops')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Manage Shops
            </button>
          </div>

          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🔍 As a Tenant
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Search and join a shop
            </p>
            <button
              onClick={() => router.push('/shops')}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Find a Shop
            </button>
          </div>

          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🔔 Notifications
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              View your recent alerts
            </p>
            <button
              onClick={() => router.push('/notifications')}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600"
            >
              View Notifications
            </button>
          </div>

          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              👤 Account
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user.email}
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}