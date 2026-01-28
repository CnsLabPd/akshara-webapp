// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SignupResponse {
  success: boolean;
  userSub: string;
  email: string;
  fullName: string;
}

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const percent = Math.min(100, Math.round((score / 5) * 100));
  const label = score >= 4 ? 'Strong' : score === 3 ? 'Good' : score === 2 ? 'Fair' : 'Weak';
  return { percent, label };
}

function getStrengthColor(label: string) {
  switch (label) {
    case 'Strong':
      return 'bg-green-500';
    case 'Good':
      return 'bg-yellow-400';
    case 'Fair':
      return 'bg-orange-400';
    default:
      return 'bg-red-400';
  }
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [age, setAge] = useState('');
  const [school, setSchool] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate required fields
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!state.trim()) {
      setError('State is required');
      return;
    }

    if (!district.trim()) {
      setError('District is required');
      return;
    }

    setIsLoading(true);

    try {
      const requestBody: any = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        state: state.trim(),
        district: district.trim(),
      };

      // Add optional fields if provided
      if (age.trim() && !isNaN(Number(age))) {
        requestBody.age = Number(age);
      }
      if (school.trim()) {
        requestBody.school = school.trim();
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Signup failed');
      }

      const data: SignupResponse = await response.json();

      // Show success message
      setSuccessMessage('Account created! OTP sent to your email. Redirecting...');

      // Redirect to OTP confirmation page after a brief delay
      setTimeout(() => {
        router.push(`/confirm-email?email=${encodeURIComponent(data.email)}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join AksharA to start learning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="Enter a strong password (min 8 characters)"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-600 hover:text-purple-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>

            {/* Password strength meter */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Strength</span>
                <span className="text-xs font-semibold text-gray-700">{strength.label}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(
                    strength.label
                  )}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="Re-enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-600 hover:text-purple-800"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <p className={`text-sm mt-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
              placeholder="Enter your full name"
              required
              disabled={isLoading}
            />
          </div>

          {/* State and District in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="e.g., Karnataka"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="e.g., Bangalore"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Age and School in a row (optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age (optional)
              </label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="Enter your age"
                min="1"
                max="120"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                School (optional)
              </label>
              <input
                type="text"
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-gray-900 font-semibold placeholder:text-gray-500"
                placeholder="Enter your school name"
                disabled={isLoading}
              />
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
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
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">
              Sign in
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
