'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { io } from 'socket.io-client';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { relationId } = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) initChat();

    // Cleanup socket on unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    // Load message history via REST
    try {
      const res = await api.get(`/api/chat/${relationId}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    // Connect to Socket.io
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join_room', relationId);
    });

    newSocket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      relationId,
      senderId: user.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  // Send message on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/shops')}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">💬 Chat</h1>
            <p className="text-xs text-gray-500">
              {connected ? '🟢 Connected' : '🔴 Connecting...'}
            </p>
          </div>
        </div>
      </nav>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {msg.sender_name}
                    </span>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 mx-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}