// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LoginResponse {
  success: boolean;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  email: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user just verified email
    const verified = searchParams.get('verified');
    const emailParam = searchParams.get('email');

    if (verified === 'true' && emailParam) {
      setSuccessMessage('Email verified successfully! You can now log in.');
      setEmail(decodeURIComponent(emailParam));
      return;
    }

    // Check if user just signed up (legacy flow - can be removed)
    const signupSuccess = sessionStorage.getItem('signupSuccess');
    const signupEmail = sessionStorage.getItem('signupEmail');
    if (signupSuccess === 'true' && signupEmail) {
      setSuccessMessage('Account created successfully! Please log in.');
      setEmail(signupEmail);
      sessionStorage.removeItem('signupSuccess');
      sessionStorage.removeItem('signupEmail');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if user needs email confirmation
        if (errorData.message && errorData.message.includes('not confirmed')) {
          setNeedsConfirmation(true);
          setError('Your email is not verified. Please confirm your email with the OTP sent to you.');
        } else {
          throw new Error(errorData.message || 'Invalid email or password');
        }
        return;
      }

      const data: LoginResponse = await response.json();

      // Decode idToken to get userSub
      const idTokenPayload = JSON.parse(atob(data.idToken.split('.')[1]));
      const userSub = idTokenPayload.sub;

      // Fetch user profile from DynamoDB
      const profileResponse = await fetch(`/api/auth/profile?userSub=${userSub}`);
      let fullName = '';

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        fullName = profileData.fullName || '';
      }

      // Save user data to localStorage (combining auth tokens and profile)
      localStorage.setItem('aksharaUser', JSON.stringify({
        userSub,
        email: data.email,
        fullName: fullName || data.email.split('@')[0], // fallback to email prefix
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      }));

      // Redirect to students page
      router.push('/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue learning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p>{error}</p>
              {needsConfirmation && (
                <Link
                  href={`/confirm-email?email=${encodeURIComponent(email.trim())}`}
                  className="inline-block mt-2 text-red-800 font-semibold underline hover:text-red-900"
                >
                  Click here to verify your email →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-purple-600 hover:text-purple-800 font-medium">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
