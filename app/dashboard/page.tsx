// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  userSub: string;
  email: string;
  fullName?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('aksharaUser');
        if (!savedUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(savedUser) as UserData;
        setUser(userData);
      } catch (error) {
        console.error('Error reading user data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('aksharaUser');
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-lg font-medium text-gray-700">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user.fullName || user.email.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Manage Students Card */}
        <div className="flex justify-center mb-8">
          <Link href="/students" className="w-full max-w-md">
            <div className="group bg-white rounded-xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <div className="text-6xl mb-4 text-center group-hover:animate-bounce">👥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Manage Students</h3>
              <p className="text-gray-600 text-center mb-4">
                Create and manage student profiles for practice tracking
              </p>
              <div className="flex justify-center">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
                  View Students →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-white hover:text-gray-200 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
