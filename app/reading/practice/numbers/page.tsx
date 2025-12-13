'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { pronunciationDataCollector } from '@/utils/pronunciationDataCollector';

const NUMBERS = '0123456789'.split('');

export default function SpeakingPracticeNumbersPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isDataCollectionMode, setIsDataCollectionMode] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [collectionStats, setCollectionStats] = useState<any>(null);
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
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 3;

      let finalTranscript = '';
      let interimTranscript = '';

      recognition.onresult = (event: any) => {
        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const detectedText = (finalTranscript || interimTranscript).trim();
        console.log('Recognized speech:', detectedText);

        if (detectedText) {
          setCurrentTranscript(detectedText);
          setHasRecorded(true);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        if (event.error === 'no-speech') {
          setFeedback('No speech detected. Please speak louder and try again!');
          setTimeout(() => {
            if (!hasRecorded) {
              setFeedback('');
            }
          }, 2000);
        } else if (event.error === 'not-allowed') {
          setFeedback('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'aborted') {
          return;
        } else {
          setFeedback('Error occurred. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        finalTranscript = '';
        interimTranscript = '';
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const currentNumber = NUMBERS[currentIndex];

  const handleSubmit = () => {
    if (!hasRecorded) return;

    const isCorrect = checkNumberMatch(currentTranscript, currentNumber);

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('Perfect! You said it correctly!');
      setShowCelebration(true);

      setTimeout(() => {
        setShowCelebration(false);
        if (currentIndex < NUMBERS.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setFeedback('');
          setHasRecorded(false);
          setCurrentTranscript('');
        }
      }, 2500);
    } else {
      setFeedback(`Try again! Say the number "${getNumberWord(currentNumber)}"`);
    }
  };

  const checkNumberMatch = (transcript: string, expectedNumber: string): boolean => {
    const cleanTranscript = transcript.toLowerCase().trim();

    console.log('User said:', cleanTranscript);
    console.log('Expected number:', expectedNumber);

    // Get the word for the number
    const numberWord = getNumberWord(expectedNumber).toLowerCase();

    // Direct match with the digit
    if (cleanTranscript === expectedNumber) {
      console.log('Match found: Exact number match');
      return true;
    }

    // Match with the word (e.g., "zero", "one", "two")
    if (cleanTranscript === numberWord || cleanTranscript.startsWith(numberWord + ' ') || cleanTranscript.startsWith(numberWord)) {
      console.log(`Match found: Word match with "${numberWord}"`);
      return true;
    }

    return false;
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !hasRecorded) {
      setFeedback('');
      setCurrentTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const playNumberSound = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(getNumberWord(currentNumber));
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const getNumberWord = (number: string): string => {
    const numberWords: { [key: string]: string } = {
      '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
      '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
    };
    return numberWords[number] || number;
  };

  const nextNumber = () => {
    if (currentIndex < NUMBERS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback('');
      setHasRecorded(false);
      setCurrentTranscript('');
    }
  };

  const previousNumber = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback('');
      setHasRecorded(false);
      setCurrentTranscript('');
    }
  };

  const handleRetry = () => {
    setFeedback('');
    setHasRecorded(false);
    setCurrentTranscript('');
  };

  if (!isSupported) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-300 to-purple-300 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link href="/choose-language?section=reading&lang=en">
              <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                ← Back
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-300 to-purple-300 p-8 relative">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
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

            <div className="relative bg-white rounded-full p-8 shadow-2xl animate-bounce">
              <svg
                className="w-48 h-48 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <Link href="/choose-language?section=reading&lang=en">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Back
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Speaking Practice - Numbers</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Current Number</p>
              <p className="text-8xl font-bold text-pink-600">{currentNumber}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Progress</p>
              <p className="text-4xl font-bold text-purple-600">
                {currentIndex + 1} / {NUMBERS.length}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Correct Attempts</p>
              <p className="text-6xl font-bold text-blue-600">{score}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Practice saying: <span className="text-pink-600">{currentNumber}</span>
            </h2>
            <p className="text-gray-600">Click &apos;Listen&apos; to hear, then record and submit</p>
            <p className="text-sm text-orange-600 font-semibold mt-2">💡 Tip: Say &quot;{getNumberWord(currentNumber)}&quot;</p>
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={playNumberSound}
              disabled={isListening}
              className="px-8 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-2xl hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-4xl">🔊</span>
              <span>Listen</span>
            </button>

            <button
              onClick={startListening}
              disabled={isListening || hasRecorded}
              className={`px-8 py-6 ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : hasRecorded
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
              } text-white rounded-xl font-bold text-2xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-75`}
            >
              <span className="text-4xl">🎤</span>
              <span>
                {isListening ? 'Listening...' : hasRecorded ? 'Recorded!' : 'Start Recording'}
              </span>
            </button>
          </div>

          {currentTranscript && (
            <div className="text-center mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-2 font-semibold">You said:</p>
                <p className="text-4xl font-bold text-blue-600">{currentTranscript}</p>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="text-gray-500 text-xs mb-1">Expected pronunciation:</p>
                <p className="text-lg font-semibold text-purple-600">
                  &quot;{getNumberWord(currentNumber)}&quot;
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleSubmit}
              disabled={!hasRecorded}
              className="px-12 py-4 bg-pink-500 text-white rounded-lg font-bold text-2xl hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              Submit
            </button>
            <button
              onClick={handleRetry}
              disabled={isListening}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              🔄 Retry
            </button>
          </div>

          {feedback && (
            <div className={`text-center p-4 rounded-lg mb-6 ${
              feedback.includes('Perfect') || feedback.includes('correct')
                ? 'bg-green-100 text-green-800'
                : feedback.includes('Try again')
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              <p className="text-xl font-semibold">{feedback}</p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={previousNumber}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={nextNumber}
              disabled={currentIndex === NUMBERS.length - 1}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg font-bold text-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
