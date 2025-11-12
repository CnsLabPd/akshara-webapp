'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NUMBERS = '0123456789'.split('');

export default function SpeakingTestNumbersPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log('Recognized speech:', transcript);
        setCurrentTranscript(transcript);
        setHasRecorded(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again!');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access.');
        } else {
          alert('Error occurred. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
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

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
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

  const handleSubmit = () => {
    if (!hasRecorded || isProcessing) return;

    setIsProcessing(true);

    const cleanTranscript = currentTranscript.toLowerCase().trim();
    const numberWord = getNumberWord(currentNumber).toLowerCase();
    const isCorrect = cleanTranscript === currentNumber || cleanTranscript === numberWord || cleanTranscript.includes(numberWord);

    if (isCorrect) {
      setScore(score + 1);
    } else {
      setWrongAnswers([...wrongAnswers, currentNumber]);
    }

    setTimeout(() => {
      if (currentIndex < NUMBERS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setHasRecorded(false);
        setCurrentTranscript('');
        setIsProcessing(false);
      } else {
        const results = {
          score: isCorrect ? score + 1 : score,
          total: NUMBERS.length,
          wrongAnswers: isCorrect ? wrongAnswers : [...wrongAnswers, currentNumber],
        };
        localStorage.setItem('testResults', JSON.stringify(results));
        router.push('/results');
      }
    }, 1000);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-pink-400 p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Home
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Test Mode - Numbers</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Current Number</p>
              <p className="text-8xl font-bold text-orange-600">{currentNumber}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Progress</p>
              <p className="text-4xl font-bold text-purple-600">
                {currentIndex + 1} / {NUMBERS.length}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Score</p>
              <p className="text-6xl font-bold text-green-600">{score}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Say the number: <span className="text-orange-600">{currentNumber}</span>
            </h2>
            <p className="text-gray-600">Single attempt only! Listen, then record</p>
            <p className="text-sm text-orange-600 font-semibold mt-2">💡 Say: &quot;{getNumberWord(currentNumber)}&quot;</p>
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={playNumberSound}
              disabled={isListening || hasRecorded}
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
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
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
              <p className="text-gray-600 text-sm mb-2 font-semibold">You said:</p>
              <p className="text-4xl font-bold text-blue-600">{currentTranscript}</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!hasRecorded || isProcessing}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? 'Processing...' : 'Submit Answer'}
            </button>
          </div>

          {isProcessing && (
            <div className="text-center mt-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
              <p className="text-gray-600 mt-2">Checking your answer...</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white/80 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Test Rules:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-lg">
            <li>Say each number clearly</li>
            <li>Only ONE attempt per number</li>
            <li>Click Submit to move to the next</li>
            <li>Your score will be shown at the end</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
