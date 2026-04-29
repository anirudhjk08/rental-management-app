'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useDarkMode } from '@/lib/useDarkMode';
import api from '@/lib/api';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { relationId } = useParams();
  const { isDark, toggleDarkMode } = useDarkMode();

  const [payments, setPayments] = useState([]);
  const [showCashForm, setShowCashForm] = useState(false);
  const [showOnlineForm, setShowOnlineForm] = useState(false);
  const [cashForm, setCashForm] = useState({ amount: '', note: '', payment_date: '' });
  const [onlineAmount, setOnlineAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) fetchPayments();
  }, [user, loading]);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/api/payments/${relationId}/history`);
      setPayments(res.data.payments);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleLogCash = async () => {
    setError('');
    try {
      await api.post('/api/payments/cash/log', {
        relationId,
        ...cashForm,
      });
      setMessage('Cash payment logged successfully!');
      setShowCashForm(false);
      setCashForm({ amount: '', note: '', payment_date: '' });
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log payment');
    }
  };

  const handleRespond = async (paymentId, action) => {
    setError('');
    try {
      await api.post('/api/payments/cash/respond', { paymentId, action });
      setMessage(`Payment ${action}ed successfully!`);
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to respond');
    }
  };

  const handleOnlinePayment = async () => {
    setError('');
    try {
      const res = await api.post('/api/payments/online/create', {
        relationId,
        amount: onlineAmount,
      });

      const { payment, order, key_id } = res.data;

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Rental Management App',
        description: 'Monthly Rent Payment',
        order_id: order.id,

        handler: async (response) => {
          try {
            await api.post('/api/payments/online/verify', {
              paymentId: payment.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage('Online payment successful! ✅');
            setShowOnlineForm(false);
            setOnlineAmount('');
            fetchPayments();
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          }
        },

        prefill: {
          name: user.name,
          email: user.email,
        },

        theme: { color: '#2563eb' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
      });

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'success': return 'bg-green-100 text-green-600';
      case 'rejected':
      case 'failed': return 'bg-red-100 text-red-600';
      case 'pending_approval':
      case 'initiated': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const inputClass = `w-full border rounded-lg px-4 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500
    ${isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-200 text-gray-800'}`;

  if (pageLoading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading...</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Navbar */}
      <nav className={`shadow-sm px-6 py-4 flex justify-between items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/shops')}
            className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            ←
          </button>
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            💰 Payment Ledger
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`px-3 py-1 rounded-full text-sm font-medium
            ${isDark ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Payment Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setShowCashForm(!showCashForm); setShowOnlineForm(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border
              ${isDark
                ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            + Log Cash Payment
          </button>
          <button
            onClick={() => { setShowOnlineForm(!showOnlineForm); setShowCashForm(false); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            💳 Pay Online
          </button>
        </div>

        {/* Cash Payment Form */}
        {showCashForm && (
          <div className={`rounded-2xl shadow-sm p-6 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Log Cash Payment
            </h2>
            <input
              type="number"
              placeholder="Amount (₹)"
              value={cashForm.amount}
              onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
              className={inputClass}
            />
            <input
              type="date"
              value={cashForm.payment_date}
              onChange={(e) => setCashForm({ ...cashForm, payment_date: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={cashForm.note}
              onChange={(e) => setCashForm({ ...cashForm, note: e.target.value })}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                onClick={handleLogCash}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Submit
              </button>
              <button
                onClick={() => setShowCashForm(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium
                  ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Online Payment Form */}
        {showOnlineForm && (
          <div className={`rounded-2xl shadow-sm p-6 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              💳 Pay Online via Razorpay
            </h2>
            <input
              type="number"
              placeholder="Amount (₹)"
              value={onlineAmount}
              onChange={(e) => setOnlineAmount(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                onClick={handleOnlinePayment}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Pay Now
              </button>
              <button
                onClick={() => setShowOnlineForm(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium
                  ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}
              >
                Cancel
              </button>
            </div>
            <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              🔒 Secured by Razorpay — Test mode active
            </p>
          </div>
        )}

        {/* Payment History */}
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Payment History
          </h2>

          {payments.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              No payments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`border rounded-xl p-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        ₹{payment.amount}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {payment.type === 'cash' ? '💵 Cash' : '💳 Online'} •{' '}
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                      {payment.note && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Note: {payment.note}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        By: {payment.initiated_by_name}
                      </p>
                      {payment.confirmed_by_name && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Confirmed by: {payment.confirmed_by_name}
                        </p>
                      )}
                      {payment.gateway_ref_id && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Payment ID: {payment.gateway_ref_id}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.replace('_', ' ')}
                      </span>
                      {payment.status === 'pending_approval' &&
                        payment.type === 'cash' &&
                        payment.initiated_by !== user.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRespond(payment.id, 'confirm')}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleRespond(payment.id, 'reject')}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}