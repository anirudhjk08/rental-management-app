'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/lib/useDarkMode';
import api from '@/lib/api';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDark, toggleDarkMode } = useDarkMode();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) fetchNotifications();
  }, [user, loading]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'payment': return '💰';
      case 'rent_proposal': return '📈';
      case 'join_request': return '🤝';
      default: return '🔔';
    }
  };

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
            onClick={() => router.push('/dashboard')}
            className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            ←
          </button>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🔔 Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-blue-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-1 rounded-full text-sm font-medium
              ${isDark ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🔔</p>
              <p className={isDark ? 'text-gray-400' : 'text-gray-400'}>
                No notifications yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border rounded-xl p-4 flex items-start gap-3
                    ${!notif.is_read
                      ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
                      : isDark ? 'border-gray-700' : 'border-gray-100'
                    }`}
                >
                  <span className="text-2xl">
                    {getNotificationIcon(notif.type)}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {notif.type.replace('_', ' ').toUpperCase()}
                    </p>
                    {notif.message_content && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Message: {notif.message_content}
                      </p>
                    )}
                    {notif.payment_amount && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Payment: ₹{notif.payment_amount} ({notif.payment_type})
                      </p>
                    )}
                    {notif.proposed_rent && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Proposed rent: ₹{notif.proposed_rent}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}