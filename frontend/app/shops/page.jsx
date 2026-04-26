'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ShopsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Owner state
  const [myShops, setMyShops] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Tenant state
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Create shop form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShop, setNewShop] = useState({ name: '', address: '', monthly_rent: '' });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) fetchMyShops();
  }, [user, loading]);

  const fetchMyShops = async () => {
    try {
      const res = await api.get('/api/shops/my-shops');
      setMyShops(res.data.shops);
      const pending = await api.get('/api/shops/pending-requests');
      setPendingRequests(pending.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCreateShop = async () => {
    setError('');
    try {
      await api.post('/api/shops/create', newShop);
      setMessage('Shop created successfully!');
      setShowCreateForm(false);
      setNewShop({ name: '', address: '', monthly_rent: '' });
      fetchMyShops();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create shop');
    }
  };

  const handleSearch = async () => {
    setSearchError('');
    setSearchResult(null);
    try {
      const res = await api.get(`/api/shops/search?code=${searchCode}`);
      setSearchResult(res.data.shop);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Shop not found');
    }
  };

  const handleJoinShop = async (shopId) => {
    try {
      await api.post('/api/shops/join', { shopId });
      setMessage('Join request sent! Waiting for owner approval.');
      setSearchResult(null);
      setSearchCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send join request');
    }
  };

  const handleRespond = async (relationId, action) => {
    try {
      await api.post('/api/shops/respond', { relationId, action });
      setMessage(`Request ${action}ed successfully!`);
      fetchMyShops();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to respond');
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🏪 Rental App</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

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

        {/* ── OWNER SECTION ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🏠 My Shops</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              + Create Shop
            </button>
          </div>

          {/* Create Shop Form */}
          {showCreateForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Shop Name"
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Address"
                value={newShop.address}
                onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Monthly Rent (₹)"
                value={newShop.monthly_rent}
                onChange={(e) => setNewShop({ ...newShop, monthly_rent: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateShop}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create Shop
              </button>
            </div>
          )}

          {/* Shops List */}
          {myShops.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              No shops yet. Create your first shop!
            </p>
          ) : (
            <div className="space-y-3">
              {myShops.map((shop) => (
                <div key={shop.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                      <p className="text-gray-500 text-sm">{shop.address}</p>
                      <p className="text-blue-600 text-sm font-medium mt-1">
                        ₹{shop.monthly_rent}/month
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mt-1 inline-block">
                        Code: {shop.unique_code}
                      </span>
                    </div>
                    <div className="text-right">
                      {shop.tenant_name ? (
                        <div>
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            Active Tenant
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{shop.tenant_name}</p>
                          <button
                            onClick={() => router.push(`/chat/${shop.relation_id}`)}
                            className="mt-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                          >
                            💬 Chat
                          </button>
                          <button
                            onClick={() => router.push(`/payments/${shop.relation_id}`)}
                            className="mt-2 ml-1 text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                          >
                            💰 Payments
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                          No Tenant
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Join Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ⏳ Pending Join Requests
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{req.tenant_name}</p>
                    <p className="text-gray-500 text-sm">{req.tenant_email}</p>
                    <p className="text-blue-600 text-sm">{req.shop_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(req.id, 'accept')}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, 'reject')}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TENANT SECTION ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Find a Shop</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter shop code (e.g. MYCL_0QHA)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {searchError && (
            <p className="text-red-500 text-sm mt-2">{searchError}</p>
          )}

          {searchResult && (
            <div className="mt-4 border border-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800">{searchResult.name}</h3>
              <p className="text-gray-500 text-sm">{searchResult.address}</p>
              <p className="text-blue-600 text-sm font-medium">
                ₹{searchResult.monthly_rent}/month
              </p>
              <p className="text-gray-500 text-sm">Owner: {searchResult.owner_name}</p>
              <button
                onClick={() => handleJoinShop(searchResult.id)}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Request to Join
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}