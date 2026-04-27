'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import { useDarkMode } from '@/lib/useDarkMode';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();

  // If already logged in → go straight to dashboard
  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`px-3 py-1 rounded-full text-sm font-medium
            ${isDark ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Hero */}
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">🏪</p>
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Rental Management App
        </h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Manage your rental relationships between owners and tenants — payments, chat, and more.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/auth')}
            className={`px-6 py-3 rounded-xl font-medium transition-all
              ${isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'}`}
          >
            Login
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-2xl w-full">
        {[
          { icon: '📧', text: 'Email OTP Auth' },
          { icon: '🏠', text: 'Shop Management' },
          { icon: '💬', text: 'Real-time Chat' },
          { icon: '💰', text: 'Payment Ledger' },
          { icon: '📈', text: 'Rent Proposals' },
          { icon: '🔔', text: 'Notifications' },
        ].map((feature) => (
          <div
            key={feature.text}
            className={`rounded-xl p-4 text-center ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}
          >
            <p className="text-2xl mb-1">{feature.icon}</p>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}