// app/instructions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  userSub: string;
  email: string;
  fullName?: string;
}

export default function InstructionsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('aksharaUser');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Recording Instructions</h1>
          <div className="w-48"></div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {user.fullName || user.email.split('@')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Track your pronunciation practice progress. Each character needs 2 recordings to complete.
          </p>
        </div>

        {/* Recording Tips Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>💡</span>
            Recording Tips & Instructions
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-xl text-purple-700 mb-4">Before You Start:</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="text-lg">Make sure you&apos;re in a quiet environment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="text-lg">Allow microphone access when prompted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="text-lg">Test your microphone before starting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="text-lg">Position yourself close to the microphone</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xl text-purple-700 mb-4">How to Record:</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">1.</span>
                  <span className="text-lg">Click &quot;Start Recording&quot; button</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">2.</span>
                  <span className="text-lg">Speak the character clearly and naturally</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">3.</span>
                  <span className="text-lg">Click &quot;Stop Recording&quot; when finished</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">4.</span>
                  <span className="text-lg">Review and click &quot;Submit Recording&quot;</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-blue-800 font-semibold text-lg flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <span>Important: Each character requires exactly 2 recordings to complete. Once you submit 2 recordings, you&apos;ll automatically move to the next character.</span>
            </p>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>📌</span>
            Additional Tips for Best Results
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Speak Naturally</h5>
                  <p className="text-gray-600">Pronounce the character as you would in normal conversation. Don&apos;t shout or whisper.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Keep It Short</h5>
                  <p className="text-gray-600">Record for 2-3 seconds. Just say the character once clearly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔇</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Minimize Background Noise</h5>
                  <p className="text-gray-600">Turn off fans, TVs, or other noise sources before recording.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎤</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Check Your Microphone</h5>
                  <p className="text-gray-600">Make sure your device microphone is working properly before you start.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Two Attempts</h5>
                  <p className="text-gray-600">You get exactly 2 recordings per character. Make each one count!</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h5 className="font-semibold text-gray-800 mb-1">Review Before Submit</h5>
                  <p className="text-gray-600">Listen to your recording if possible before submitting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Button */}
        <div className="mt-8 text-center">
          <Link href="/reading/dashboard">
            <button className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-2xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-2xl">
              Start Recording Practice →
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
