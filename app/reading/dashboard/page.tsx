// app/reading/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/ProgressBar';

interface UserData {
  userSub: string;
  email: string;
  fullName?: string;
}

interface SelectedStudent {
  studentId: string;
  studentName: string;
}

interface CombinedProgress {
  completed: number;
  inProgress: number;
  notStarted: number;
  totalCharacters: number;
  completionPercentage: number;
  totalRecordings: number;
}

export default function ReadingDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [combinedProgress, setCombinedProgress] = useState<CombinedProgress | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

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

        const savedStudent = localStorage.getItem('selectedStudent');
        if (!savedStudent) {
          router.push('/students');
          return;
        }
        const studentData = JSON.parse(savedStudent) as SelectedStudent;
        setSelectedStudent(studentData);
      } catch (error) {
        console.error('Error reading data:', error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchCombinedProgress = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      setIsLoading(true);

      const [alphabetsResponse, numbersResponse] = await Promise.all([
        fetch(`/api/recordings/progress?studentId=${selectedStudent.studentId}&type=english-alphabets&t=${Date.now()}`, {
          cache: 'no-store'
        }),
        fetch(`/api/recordings/progress?studentId=${selectedStudent.studentId}&type=english-numbers&t=${Date.now()}`, {
          cache: 'no-store'
        })
      ]);

      let totalCompleted = 0;
      let totalInProgress = 0;
      let totalNotStarted = 0;
      let totalChars = 0;
      let totalRecordings = 0;

      if (alphabetsResponse.ok) {
        const data = await alphabetsResponse.json();
        if (data.summary) {
          totalCompleted += data.summary.completed;
          totalInProgress += data.summary.partial;
          totalNotStarted += data.summary.notStarted;
          totalChars += data.summary.totalCharacters;
        }
        if (data.progress) {
          Object.values(data.progress).forEach((count: any) => {
            totalRecordings += count;
          });
        }
      }

      if (numbersResponse.ok) {
        const data = await numbersResponse.json();
        if (data.summary) {
          totalCompleted += data.summary.completed;
          totalInProgress += data.summary.partial;
          totalNotStarted += data.summary.notStarted;
          totalChars += data.summary.totalCharacters;
        }
        if (data.progress) {
          Object.values(data.progress).forEach((count: any) => {
            totalRecordings += count;
          });
        }
      }

      const completionPercentage = totalChars > 0
        ? Math.round((totalCompleted / totalChars) * 100)
        : 0;

      setCombinedProgress({
        completed: totalCompleted,
        inProgress: totalInProgress,
        notStarted: totalNotStarted,
        totalCharacters: totalChars,
        completionPercentage,
        totalRecordings
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      setCombinedProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (user && selectedStudent) {
      fetchCombinedProgress();
    }
  }, [user, selectedStudent, fetchCombinedProgress]);

  const handlePracticeTypeClick = (type: string) => {
    router.push(`/reading?type=${type}`);
  };

  const handleBackToStudents = () => {
    router.push('/students');
  };

  if (!user || !selectedStudent) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBackToStudents}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            ← Back to Students
          </button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg text-center">
            Audio Data Recording
          </h1>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            💡 Instructions
          </button>
        </div>

        {showInstructions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInstructions(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recording Instructions</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-semibold">
                  Thank you for helping us by giving your time and speech data! Your contributions help improve our system.
                </p>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">How to Record:</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">1.</span>
                  <span>Choose English Alphabets (A-Z) or Numbers (0-9) to begin</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">2.</span>
                  <span>Click on any character card to start recording</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">3.</span>
                  <span>Click "Start Recording" and speak the character clearly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">4.</span>
                  <span>Click "Stop Recording" when finished</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">5.</span>
                  <span>Submit your recording - Each character needs 2 recordings</span>
                </li>
              </ol>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Tip:</strong> Record in a quiet environment and speak naturally for best results.
                </p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedStudent.studentName}'s Progress
            </h2>
            <p className="text-gray-600">
              Track audio recording progress. Each character needs 2 recordings to complete.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-6">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-lg font-medium text-gray-700">Loading progress...</span>
            </div>
          </div>
        )}

        {!isLoading && combinedProgress && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                English Alphabets (A-Z) & Numbers (0-9) Progress
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-4xl font-bold text-green-600 mb-2">{combinedProgress.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{combinedProgress.inProgress}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                  <div className="text-4xl font-bold text-gray-600 mb-2">{combinedProgress.notStarted}</div>
                  <div className="text-sm text-gray-600">Not Started</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">{combinedProgress.completionPercentage}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>

              <ProgressBar
                totalCharacters={combinedProgress.totalCharacters}
                completedCharacters={combinedProgress.completed}
                partialCharacters={combinedProgress.inProgress}
                title=""
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Select Recording Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePracticeTypeClick('english-alphabets')}
                  className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-xl hover:from-purple-200 hover:to-indigo-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🔤</div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">English Alphabets (A-Z)</h4>
                    <p className="text-sm text-gray-600">Record letters A to Z</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePracticeTypeClick('english-numbers')}
                  className="p-6 bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-xl hover:from-blue-200 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🔢</div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">English Numbers (0-9)</h4>
                    <p className="text-sm text-gray-600">Record numbers 0 to 9</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
