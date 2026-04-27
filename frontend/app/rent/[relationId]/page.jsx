'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useDarkMode } from '@/lib/useDarkMode';
import api from '@/lib/api';

export default function RentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { relationId } = useParams();
  const { isDark, toggleDarkMode } = useDarkMode();

  const [proposals, setProposals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ new_rent: '', effective_date: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) fetchProposals();
  }, [user, loading]);

  const fetchProposals = async () => {
    try {
      const res = await api.get(`/api/rent/${relationId}/proposals`);
      setProposals(res.data.proposals);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handlePropose = async () => {
    setError('');
    try {
      await api.post('/api/rent/propose', { relationId, ...form });
      setMessage('Rent increase proposed successfully!');
      setShowForm(false);
      setForm({ new_rent: '', effective_date: '' });
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to propose');
    }
  };

  const handleRespond = async (proposalId, action) => {
    setError('');
    try {
      await api.post('/api/rent/respond', { proposalId, action });
      setMessage(`Proposal ${action}ed successfully!`);
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to respond');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
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
            📈 Rent Proposals
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

        {/* Propose Button — Owner only */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Propose Rent Increase
          </button>
        </div>

        {/* Propose Form */}
        {showForm && (
          <div className={`rounded-2xl shadow-sm p-6 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              New Rent Proposal
            </h2>
            <input
              type="number"
              placeholder="New Rent Amount (₹)"
              value={form.new_rent}
              onChange={(e) => setForm({ ...form, new_rent: e.target.value })}
              className={inputClass}
            />
            <input
              type="date"
              value={form.effective_date}
              onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                onClick={handlePropose}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Submit Proposal
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium
                  ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Proposals List */}
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Proposal History
          </h2>

          {proposals.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              No proposals yet.
            </p>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`border rounded-xl p-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        ₹{proposal.old_rent} → ₹{proposal.new_rent}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Effective: {new Date(proposal.effective_date).toLocaleDateString()}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Proposed by: {proposal.proposed_by_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>

                      {/* Tenant can accept/reject pending proposals */}
                      {proposal.status === 'pending' &&
                       proposal.proposed_by !== user.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRespond(proposal.id, 'accept')}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(proposal.id, 'reject')}
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