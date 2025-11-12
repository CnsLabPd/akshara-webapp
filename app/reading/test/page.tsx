'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SpeakingTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [testComplete, setTestComplete] = useState(false);
  const [isCorrectedTest, setIsCorrectedTest] = useState(false);
  const [lettersToTest, setLettersToTest] = useState<string[]>(ALPHABETS);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening for continuous speech
      recognition.interimResults = true; // Enable interim results for real-time feedback
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 5; // Get more alternatives for better single letter accuracy

      let lastSpeechTime = 0;
      let silenceTimer: any = null;
      let detectedTranscript = '';

      recognition.onresult = (event: any) => {
        // Update last speech time
        lastSpeechTime = Date.now();

        // Clear any existing silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        // Process all results including alternatives
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];

          // Check all alternatives for better single letter detection
          for (let j = 0; j < Math.min(result.length, 5); j++) {
            const transcript = result[j].transcript.toUpperCase().trim();

            if (transcript) {
              console.log(`Alternative ${j + 1}:`, transcript, 'Confidence:', result[j].confidence);

              // Accept both interim and final results
              if (result.isFinal || result[j].confidence > 0.3) {
                detectedTranscript = transcript;
                setCurrentTranscript(transcript);

                // Start 2-second pause timer after detecting speech
                silenceTimer = setTimeout(() => {
                  // After 2 seconds of silence, stop recording and mark as recorded
                  if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    setHasRecorded(true);
                  }
                }, 2000);

                break;
              }
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Don't show error for 'no-speech' immediately - user might be trying
        if (event.error === 'no-speech') {
          setFeedback('No speech detected. Please speak louder and try again!');
          // Allow retry without resetting everything
          setTimeout(() => {
            if (!hasRecorded) {
              setFeedback('');
            }
          }, 2000);
        } else if (event.error === 'not-allowed') {
          setFeedback('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'aborted') {
          // Ignore aborted errors (usually from user clicking stop)
          return;
        } else {
          setFeedback('Error occurred. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Clear silence timer if recording ends
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        // Reset variables for next recognition
        lastSpeechTime = 0;
        detectedTranscript = '';
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const currentLetter = lettersToTest[currentIndex];

  const handleSubmit = () => {
    if (!hasRecorded) return;

    // Improved matching for single letters
    const isCorrect = checkLetterMatch(currentTranscript, currentLetter);

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('Perfect! You said it correctly!');
      setShowCelebration(true);

      setTimeout(() => {
        setShowCelebration(false);
        // Check if test is complete
        if (currentIndex === lettersToTest.length - 1) {
          setTestComplete(true);
        } else {
          // Auto-advance to next letter
          setCurrentIndex(currentIndex + 1);
          setFeedback('');
          setHasRecorded(false);
          setCurrentTranscript('');
        }
      }, 2500);
    } else {
      // Track wrong answer
      setWrongAnswers([...wrongAnswers, currentLetter]);
      setFeedback('❌ Wrong!');

      setTimeout(() => {
        // Check if test is complete
        if (currentIndex === lettersToTest.length - 1) {
          setTestComplete(true);
        } else {
          // Auto-advance to next letter after wrong answer
          setCurrentIndex(currentIndex + 1);
          setFeedback('');
          setHasRecorded(false);
          setCurrentTranscript('');
        }
      }, 1500);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !hasRecorded) {
      setFeedback('');
      setCurrentTranscript('');
      setIsListening(true);

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
        setFeedback('Error starting microphone. Please try again.');
      }
    }
  };

  const playLetterSound = () => {
    // Use browser's speech synthesis to pronounce the full phrase
    if ('speechSynthesis' in window) {
      const association = getLetterAssociation(currentLetter);
      const phrase = `${currentLetter} for ${association.word}`;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.8; // Slower speech for clarity
      utterance.pitch = 1.2; // Slightly higher pitch for children
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCorrectedTest = () => {
    // Start corrected test with only wrong answers
    if (wrongAnswers.length > 0) {
      setLettersToTest(wrongAnswers);
      setCurrentIndex(0);
      setScore(0);
      setCurrentTranscript('');
      setFeedback('');
      setHasRecorded(false);
      setTestComplete(false);
      setIsCorrectedTest(true);
      // Clear wrong answers for the new corrected test
      setWrongAnswers([]);
    }
  };

  const handleReAttempt = () => {
    // Restart full test from beginning
    setLettersToTest(ALPHABETS);
    setCurrentIndex(0);
    setScore(0);
    setCurrentTranscript('');
    setFeedback('');
    setHasRecorded(false);
    setTestComplete(false);
    setIsCorrectedTest(false);
    setWrongAnswers([]);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  // Exact letter pronunciation matching function
  const checkLetterMatch = (transcript: string, expectedLetter: string): boolean => {
    // Clean up transcript - remove extra spaces and convert to uppercase
    const cleanTranscript = transcript.toUpperCase().trim().replace(/\s+/g, ' ');

    console.log('=== MATCHING DEBUG ===');
    console.log('User said:', `"${cleanTranscript}"`);
    console.log('Expected letter:', expectedLetter);

    // Get the expected word association (e.g., "Elephant" for "E")
    const expectedWord = getLetterAssociation(expectedLetter).word.toUpperCase();
    console.log('Expected word:', expectedWord);

    // Method 1: Direct exact match with the letter itself
    if (cleanTranscript === expectedLetter) {
      console.log('✅ Match found: Exact letter match');
      return true;
    }

    // Method 2: Check for "[LETTER] FOR [WORD]" pattern with exact word match
    const forPatterns = [
      `${expectedLetter} FOR ${expectedWord}`,
      `${expectedLetter} 4 ${expectedWord}`,
    ];

    console.log('Checking patterns:', forPatterns);

    for (const pattern of forPatterns) {
      console.log(`Comparing "${cleanTranscript}" === "${pattern}"`);
      if (cleanTranscript === pattern) {
        console.log('✅ Match found: Exact pattern match -', pattern);
        return true;
      }
    }

    // Also check if transcript contains the pattern
    for (const pattern of forPatterns) {
      if (cleanTranscript.includes(pattern)) {
        console.log('✅ Match found: Contains exact pattern -', pattern);
        return true;
      }
    }

    // Check variations with different spacing
    const variations = [
      `${expectedLetter}FOR${expectedWord}`, // No spaces
      `${expectedLetter} FOR${expectedWord}`, // Space before FOR
      `${expectedLetter}FOR ${expectedWord}`, // Space after FOR
    ];

    for (const variation of variations) {
      if (cleanTranscript.replace(/\s+/g, '') === variation.replace(/\s+/g, '')) {
        console.log('✅ Match found: Spacing variation -', variation);
        return true;
      }
    }

    // Method 3: Match with standard pronunciation (letter alone)
    const pronunciationVariants: { [key: string]: string[] } = {
      'A': ['AY'],
      'B': ['BEE'],
      'C': ['SEE', 'CEE'],
      'D': ['DEE'],
      'E': ['EE'],
      'F': ['EFF', 'EF'],
      'G': ['GEE', 'JEE'],
      'H': ['AITCH', 'EICH'],
      'I': ['EYE', 'AI'],
      'J': ['JAY', 'JEY'],
      'K': ['KAY', 'KEY'],
      'L': ['ELL', 'EL'],
      'M': ['EM'],
      'N': ['EN'],
      'O': ['OH', 'OW'],
      'P': ['PEE', 'PE'],
      'Q': ['CUE', 'KYU', 'KYOU'],
      'R': ['ARE', 'AR'],
      'S': ['ESS', 'ES'],
      'T': ['TEE', 'TE'],
      'U': ['YOU', 'YU', 'YOO'],
      'V': ['VEE', 'VE'],
      'W': ['DOUBLE YOU', 'DOUBLEYOU', 'DOUBLE U'],
      'X': ['EX', 'EKS'],
      'Y': ['WHY', 'WYE'],
      'Z': ['ZEE', 'ZED'],
    };

    const validPronunciations = pronunciationVariants[expectedLetter] || [];

    const pronunciationMatched = validPronunciations.some(pronunciation => {
      if (cleanTranscript === pronunciation) {
        console.log(`✅ Match found: Exact pronunciation match with "${pronunciation}"`);
        return true;
      }
      return false;
    });

    if (pronunciationMatched) {
      return true;
    }

    console.log('❌ No match found.');
    console.log('Valid options:');
    console.log(`  - "${expectedLetter}"`);
    console.log(`  - ${validPronunciations.map(p => `"${p}"`).join(', ')}`);
    console.log(`  - "${expectedLetter} FOR ${expectedWord}"`);
    return false;
  };

  const getLetterPronunciation = (letter: string): string => {
    const pronunciationMap: { [key: string]: string } = {
      'A': 'ay', 'B': 'bee', 'C': 'see', 'D': 'dee', 'E': 'ee',
      'F': 'ef', 'G': 'gee', 'H': 'aitch', 'I': 'eye', 'J': 'jay',
      'K': 'kay', 'L': 'el', 'M': 'em', 'N': 'en', 'O': 'oh',
      'P': 'pee', 'Q': 'cue', 'R': 'are', 'S': 'ess', 'T': 'tee',
      'U': 'you', 'V': 'vee', 'W': 'double-u', 'X': 'ex', 'Y': 'why', 'Z': 'zee'
    };
    return pronunciationMap[letter] || letter.toLowerCase();
  };

  const getLetterAssociation = (letter: string): { word: string; emoji: string } => {
    const associations: { [key: string]: { word: string; emoji: string } } = {
      'A': { word: 'Apple', emoji: '🍎' },
      'B': { word: 'Ball', emoji: '⚽' },
      'C': { word: 'Cat', emoji: '🐱' },
      'D': { word: 'Dog', emoji: '🐶' },
      'E': { word: 'Elephant', emoji: '🐘' },
      'F': { word: 'Fish', emoji: '🐠' },
      'G': { word: 'Grapes', emoji: '🍇' },
      'H': { word: 'House', emoji: '🏠' },
      'I': { word: 'Ice cream', emoji: '🍦' },
      'J': { word: 'Juice', emoji: '🧃' },
      'K': { word: 'Kite', emoji: '🪁' },
      'L': { word: 'Lion', emoji: '🦁' },
      'M': { word: 'Monkey', emoji: '🐵' },
      'N': { word: 'Nest', emoji: '🪹' },
      'O': { word: 'Orange', emoji: '🍊' },
      'P': { word: 'Penguin', emoji: '🐧' },
      'Q': { word: 'Queen', emoji: '👸' },
      'R': { word: 'Rabbit', emoji: '🐰' },
      'S': { word: 'Sun', emoji: '☀️' },
      'T': { word: 'Tiger', emoji: '🐯' },
      'U': { word: 'Umbrella', emoji: '☂️' },
      'V': { word: 'Van', emoji: '🚐' },
      'W': { word: 'Watch', emoji: '⌚' },
      'X': { word: 'Xylophone', emoji: '🎹' },
      'Y': { word: 'Yo-yo', emoji: '🪀' },
      'Z': { word: 'Zebra', emoji: '🦓' }
    };
    return associations[letter] || { word: letter, emoji: '📝' };
  };

  if (!isSupported) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-pink-400 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                ← Home
              </button>
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Speech Recognition Not Supported
            </h2>
            <p className="text-lg text-gray-600">
              Your browser doesn&apos;t support speech recognition. Please try using Google Chrome or Microsoft Edge.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Test Complete Screen
  if (testComplete) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-pink-400 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                ← Home
              </button>
            </Link>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">Test Complete!</h1>
            <div className="w-24"></div>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">
              {wrongAnswers.length === 0 ? '🎉' : '📝'}
            </div>

            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {wrongAnswers.length === 0 ? (isCorrectedTest ? 'All Corrected! 🎊' : 'Perfect Score!') : (isCorrectedTest ? 'Corrected Test Completed' : 'Test Completed')}
            </h2>

            <div className="mb-8">
              <p className="text-2xl text-gray-700 mb-2">
                Score: <span className="font-bold text-green-600">{score}</span> / {lettersToTest.length}
              </p>
              <p className="text-xl text-gray-600">
                Correct: {score} | Wrong: {wrongAnswers.length}
              </p>
            </div>

            {wrongAnswers.length > 0 && (
              <div className="mb-8 p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <h3 className="text-2xl font-bold text-red-800 mb-4">
                  Letters to Practice:
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {wrongAnswers.map((letter, index) => (
                    <div key={index} className="px-4 py-2 bg-red-200 text-red-800 rounded-lg font-bold text-xl">
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wrongAnswers.length === 0 && (
              <div className="mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  Excellent Work!
                </h3>
                <p className="text-lg text-green-700">
                  {isCorrectedTest
                    ? 'You have corrected all your mistakes! Perfect! 🌟'
                    : 'You got all letters correct! 🌟'}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-4 flex-wrap">
              {wrongAnswers.length > 0 ? (
                <>
                  <button
                    onClick={handleCorrectedTest}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    ✏️ Corrected Test
                  </button>
                  <button
                    onClick={handleReAttempt}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold text-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Re-attempt Full Test
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-xl hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🏠 Go Home
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReAttempt}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold text-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Re-attempt Full Test
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-xl hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🏠 Go Home
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Regular Test Screen
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-pink-400 p-8 relative">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
            {/* Confetti Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-ping"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i % 6],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Green Tick Mark */}
            <div className="relative bg-white rounded-full p-8 shadow-2xl animate-bounce">
              <svg
                className="w-48 h-48 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  animation: 'checkmark 0.5s ease-in-out',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                    animation: 'draw 0.5s ease-in-out forwards',
                  }}
                />
              </svg>
            </div>

            {/* Success Messages */}
            <div className="text-center mt-6 space-y-3">
              <h2 className="text-6xl font-bold text-white drop-shadow-lg animate-pulse">
                Excellent! 🎉
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                Perfect Pronunciation!
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Home
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            {isCorrectedTest ? 'Corrected Test' : 'Speaking Test'}
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Compact Progress Bar */}
        <div className="bg-white rounded-lg shadow-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Progress:</span>
            <span className="text-lg font-bold text-orange-600">
              {currentIndex + 1} / {lettersToTest.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Score:</span>
            <span className="text-2xl font-bold text-green-600">{score}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6">
          {/* Visual Letter Display with Association */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-4 border-2 border-orange-200">
              <div className="flex items-center justify-center gap-6">
                {/* Large Letter */}
                <div className="text-9xl font-bold text-orange-600">{currentLetter}</div>

                {/* Visual Association */}
                <div className="text-center">
                  <div className="text-7xl mb-2">{getLetterAssociation(currentLetter).emoji}</div>
                  <p className="text-2xl font-bold text-gray-700">
                    {currentLetter} for {getLetterAssociation(currentLetter).word}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
              <p className="text-sm text-red-700 font-semibold">
                💡 Click Listen to hear, then click Speak and say <strong>&quot;{getLetterPronunciation(currentLetter)}&quot;</strong> or <strong>&quot;{currentLetter} for {getLetterAssociation(currentLetter).word}&quot;</strong>
              </p>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex justify-center gap-3 mb-4">
            {/* Listen Button */}
            <button
              onClick={playLetterSound}
              disabled={isListening}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🔊</span>
              <span>Listen</span>
            </button>

            {/* Record Button */}
            <button
              onClick={startListening}
              disabled={isListening || hasRecorded}
              className={`px-6 py-3 ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : hasRecorded
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              } text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-75`}
            >
              <span className="text-2xl">🎤</span>
              <span>
                {isListening ? 'Listening...' : hasRecorded ? 'Recorded!' : 'Record'}
              </span>
            </button>
          </div>

          {/* Show what user said */}
          {currentTranscript && (
            <div className="text-center mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <p className="text-gray-600 text-xs mb-1 font-semibold">You said:</p>
              <p className="text-2xl font-bold text-blue-600">{currentTranscript}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={handleSubmit}
              disabled={!hasRecorded}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              Submit
            </button>
          </div>

          {feedback && (
            <div className={`text-center p-3 rounded-lg mb-3 ${
              feedback.includes('Perfect') || feedback.includes('correct')
                ? 'bg-green-100 text-green-800'
                : feedback.includes('Wrong')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              <p className="text-lg font-semibold">{feedback}</p>
            </div>
          )}
        </div>

        {/* Test Info */}
        <div className="mt-4 bg-white/90 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {isCorrectedTest ? 'Corrected Test Instructions:' : 'Test Instructions:'}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            <li>Click <strong>Listen</strong> to hear the letter</li>
            <li>Click <strong>Record</strong> to start recording</li>
            <li>Say the letter clearly and pause for 2 seconds</li>
            <li>Click <strong>Submit</strong> to check your answer</li>
            <li>Test will auto-advance to the next letter after showing feedback</li>
            {isCorrectedTest ? (
              <li>This test only includes letters you got wrong previously</li>
            ) : (
              <li>After completing, you can take a <strong>Corrected Test</strong> with only the wrong letters</li>
            )}
            <li>Keep taking corrected tests until you get all letters correct!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
