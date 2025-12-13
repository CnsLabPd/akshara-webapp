'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TestResults {
  score: number;
  total: number;
  wrongAnswers: string[];
  isCorrectedTest?: boolean;
  allMastered?: boolean;
  type?: 'writing' | 'reading';
  subtype?: 'letters' | 'numbers';
  letterType?: 'capital' | 'small';
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<TestResults | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('testResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleCorrectedTest = () => {
    if (results && results.wrongAnswers.length > 0) {
      // Route to the correct corrected test based on type and subtype
      if (results.type === 'reading') {
        localStorage.setItem('correctedTestLetters', JSON.stringify(results.wrongAnswers));
        router.push('/reading/corrected-test');
      } else if (results.subtype === 'numbers') {
        localStorage.setItem('correctedTestNumbers', JSON.stringify(results.wrongAnswers));
        router.push('/corrected-test/numbers');
      } else {
        localStorage.setItem('correctedTestLetters', JSON.stringify(results.wrongAnswers));
        // Store letterType information for the corrected test
        if (results.letterType) {
          localStorage.setItem('correctedTestLetterType', results.letterType);
        }
        router.push('/corrected-test'); // Default to letters writing
      }
    }
  };

  const percentage = results ? Math.round((results.score / results.total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', message: 'Good Job!' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', message: 'Keep Practicing!' };
    return { grade: 'D', color: 'text-red-600', message: 'Need More Practice' };
  };

  if (!results) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-8 flex items-center justify-center">
        <div className="text-white text-2xl">Loading results...</div>
      </main>
    );
  }

  const gradeInfo = getGrade();

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-lg">Test Results</h1>
          <p className="text-2xl text-white drop-shadow">Let&apos;s see how you did!</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-12 mb-8">
          {results.allMastered ? (
            <div className="text-center mb-8">
              <div className="text-9xl mb-4">🎉</div>
              <h2 className="text-5xl font-bold text-green-600 mb-4">Congratulations!</h2>
              <p className="text-3xl font-semibold text-gray-700 mb-4">
                You&apos;ve mastered ALL the alphabets!
              </p>
              <p className="text-6xl font-bold text-green-600">
                {results.score} / {results.total}
              </p>
              <p className="text-2xl text-green-600 mt-2">Perfect Score!</p>
            </div>
          ) : (
            <div className="text-center mb-8">
              {results.isCorrectedTest && (
                <div className="mb-4 text-xl text-orange-600 font-semibold">
                  Corrected Test Results
                </div>
              )}
              <div className={`text-9xl font-bold ${gradeInfo.color} mb-4`}>
                {gradeInfo.grade}
              </div>
              <p className="text-3xl font-semibold text-gray-700 mb-2">{gradeInfo.message}</p>
              <p className="text-6xl font-bold text-gray-800">
                {results.score} / {results.total}
              </p>
              <p className="text-2xl text-gray-600 mt-2">{percentage}% Correct</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-100 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-800 mb-3">Correct Answers</h3>
              <p className="text-6xl font-bold text-green-600">{results.score}</p>
            </div>
            <div className="bg-red-100 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-red-800 mb-3">Wrong Answers</h3>
              <p className="text-6xl font-bold text-red-600">{results.wrongAnswers.length}</p>
            </div>
          </div>

          {results.wrongAnswers.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <h3 className="text-2xl font-bold text-yellow-800 mb-3">{results.subtype === 'numbers' ? 'Numbers' : 'Letters'} to Practice:</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {results.wrongAnswers.map((letter, index) => (
                  <span
                    key={index}
                    className="text-3xl font-bold text-yellow-700 bg-yellow-200 px-6 py-3 rounded-lg"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg">
                🏠 Home
              </button>
            </Link>

            {results.wrongAnswers.length > 0 && (
              <button
                onClick={handleCorrectedTest}
                className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white rounded-lg font-bold text-xl hover:bg-orange-700 transition-colors shadow-lg"
              >
                📝 Corrected Test ({results.wrongAnswers.length} {results.subtype === 'numbers' ? 'numbers' : 'letters'})
              </button>
            )}

            <Link href={results.type === 'reading' ? '/reading/test' : '/test'}>
              <button className="w-full md:w-auto px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 transition-colors shadow-lg">
                🔄 Retake Full Test
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">What&apos;s Next?</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-lg">
            {results.wrongAnswers.length > 0 ? (
              <>
                <li>Take the Corrected Test to practice your mistakes</li>
                <li>You&apos;ll only be tested on the {results.subtype === 'numbers' ? 'numbers' : 'letters'} you got wrong</li>
                <li>Keep taking corrected tests until you master all {results.subtype === 'numbers' ? 'numbers' : 'letters'}</li>
                <li>Visit Practice mode to improve specific {results.subtype === 'numbers' ? 'numbers' : 'letters'}</li>
              </>
            ) : (
              <>
                <li>Perfect score! You&apos;ve mastered all {results.subtype === 'numbers' ? 'numbers' : 'letters'}!</li>
                <li>Try Practice mode to maintain your skills</li>
                <li>Challenge yourself by taking the test again</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
