'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/lib/useDarkMode';
import api from '@/lib/api';

export default function ShopsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDark, toggleDarkMode } = useDarkMode();

  const [myShops, setMyShops] = useState([]);
  const [joinedShops, setJoinedShops] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShop, setNewShop] = useState({ name: '', address: '', monthly_rent: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) fetchData();
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [shopsRes, pendingRes, joinedRes] = await Promise.all([
        api.get('/api/shops/my-shops'),
        api.get('/api/shops/pending-requests'),
        api.get('/api/shops/joined-shops'),
      ]);
      setMyShops(shopsRes.data.shops);
      setPendingRequests(pendingRes.data.requests);
      setJoinedShops(joinedRes.data.shops);
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
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create shop');
    }
  };

  const handleDeleteShop = async (shopId) => {
    try {
      await api.delete(`/api/shops/${shopId}`);
      setMessage('Shop deleted successfully!');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete shop');
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
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send join request');
    }
  };

  const handleRespond = async (relationId, action) => {
    try {
      await api.post('/api/shops/respond', { relationId, action });
      setMessage(`Request ${action}ed successfully!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to respond');
    }
  };

  // Shared input class
  const inputClass = `w-full border rounded-lg px-4 py-2 text-sm text-gray-800 
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
        <h1 className="text-xl font-bold text-blue-600">🏪 Rental App</h1>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all
              ${isDark
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-800 text-white'}`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ← Dashboard
          </button>
        </div>
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

        {/* ── OWNER SECTION — My Created Shops ── */}
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                🏠 My Created Shops
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Shops you own and manage
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              + Create Shop
            </button>
          </div>

          {/* Create Shop Form */}
          {showCreateForm && (
            <div className={`rounded-xl p-4 mb-4 space-y-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <input
                type="text"
                placeholder="Shop Name"
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Address"
                value={newShop.address}
                onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Monthly Rent (₹)"
                value={newShop.monthly_rent}
                onChange={(e) => setNewShop({ ...newShop, monthly_rent: e.target.value })}
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateShop}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Shop
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium
                    ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Shops List */}
          {myShops.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              No shops yet. Create your first shop!
            </p>
          ) : (
            <div className="space-y-3">
              {myShops.map((shop) => (
                <div
                  key={shop.id}
                  className={`border rounded-xl p-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {shop.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {shop.address}
                      </p>
                      <p className="text-blue-500 text-sm font-medium mt-1">
                        ₹{shop.monthly_rent}/month
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block
                        ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        Code: {shop.unique_code}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {shop.tenant_name ? (
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            Active Tenant
                          </span>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {shop.tenant_name}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => router.push(`/chat/${shop.relation_id}`)}
                              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                            >
                              💬 Chat
                            </button>
                            <button
                              onClick={() => router.push(`/payments/${shop.relation_id}`)}
                              className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                            >
                              💰 Pay
                            </button>
                            <button
                              onClick={() => router.push(`/rent/${shop.relation_id}`)}
                              className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg hover:bg-yellow-100"
                            >
                              📈 Rent
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                          No Tenant
                        </span>
                      )}

                      {/* Delete Button */}
                      {deleteConfirm === shop.id ? (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleDeleteShop(shop.id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className={`text-xs px-2 py-1 rounded-lg
                              ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(shop.id)}
                          className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                          🗑 Delete
                        </button>
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
          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              ⏳ Pending Join Requests
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className={`border rounded-xl p-4 flex justify-between items-center
                    ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {req.tenant_name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {req.tenant_email}
                    </p>
                    <p className="text-blue-500 text-sm">{req.shop_name}</p>
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

        {/* ── TENANT SECTION — Shops I'm Renting ── */}
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🤝 Shops I'm Renting
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Shops where you are an active tenant
            </p>
          </div>

          {joinedShops.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              You are not renting any shops yet.
            </p>
          ) : (
            <div className="space-y-3">
              {joinedShops.map((shop) => (
                <div
                  key={shop.relation_id}
                  className={`border rounded-xl p-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {shop.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {shop.address}
                  </p>
                  <p className="text-blue-500 text-sm font-medium">
                    ₹{shop.monthly_rent}/month
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Owner: {shop.owner_name}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/chat/${shop.relation_id}`)}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() => router.push(`/payments/${shop.relation_id}`)}
                      className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                    >
                      💰 Payments
                    </button>
                    <button
                      onClick={() => router.push(`/rent/${shop.relation_id}`)}
                      className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg hover:bg-yellow-100"
                    >
                      📈 Rent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SEARCH SECTION ── */}
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🔍 Find a Shop to Rent
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter shop code (e.g. MYCL_0QHA)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              className={inputClass}
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
            <div className={`mt-4 border rounded-xl p-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {searchResult.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchResult.address}
              </p>
              <p className="text-blue-500 text-sm font-medium">
                ₹{searchResult.monthly_rent}/month
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Owner: {searchResult.owner_name}
              </p>
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