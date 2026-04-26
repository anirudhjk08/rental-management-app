'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Which step we're on
  const [mode, setMode] = useState('register'); // 'register' or 'login'
  const [step, setStep] = useState(1); // 1=form, 2=otp

  // Form state
  const [formData, setFormData] = useState({ email: '', name: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await api.post('/api/auth/register', formData);
        setUserId(res.data.userId);
        setMessage(res.data.message);
        setStep(2);
      } else {
        const res = await api.post('/api/auth/login', { email: formData.email });
        setUserId(res.data.userId);
        setMessage(res.data.message);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/verify-otp', { userId, otp });
      login(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🏪 Rental Management
        </h1>
        <p className="text-gray-500 mb-6">
          {step === 1 ? 'Sign in or create an account' : 'Check your email for the OTP'}
        </p>

        {/* Mode Toggle */}
        {step === 1 && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                ${mode === 'register'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-500'}`}
            >
              Register
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                ${mode === 'login'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-500'}`}
            >
              Login
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {/* Step 1 — Form */}
        {step === 1 && (
          <div className="space-y-4">
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => { setStep(1); setMessage(''); setOtp(''); }}
              className="w-full text-gray-500 text-sm hover:text-gray-700"
            >
              ← Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}