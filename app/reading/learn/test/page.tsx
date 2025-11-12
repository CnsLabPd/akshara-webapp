'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Alphabet data with visual associations
const alphabetData = [
  { letter: 'A', word: 'APPLE', emoji: '🍎' },
  { letter: 'B', word: 'BALL', emoji: '⚽' },
  { letter: 'C', word: 'CAT', emoji: '🐱' },
  { letter: 'D', word: 'DOG', emoji: '🐶' },
  { letter: 'E', word: 'ELEPHANT', emoji: '🐘' },
  { letter: 'F', word: 'FISH', emoji: '🐠' },
  { letter: 'G', word: 'GRAPES', emoji: '🍇' },
  { letter: 'H', word: 'HOUSE', emoji: '🏠' },
  { letter: 'I', word: 'ICE CREAM', emoji: '🍦' },
  { letter: 'J', word: 'JUICE', emoji: '🧃' },
  { letter: 'K', word: 'KITE', emoji: '🪁' },
  { letter: 'L', word: 'LION', emoji: '🦁' },
  { letter: 'M', word: 'MONKEY', emoji: '🐵' },
  { letter: 'N', word: 'NEST', emoji: '🪺' },
  { letter: 'O', word: 'ORANGE', emoji: '🍊' },
  { letter: 'P', word: 'PIZZA', emoji: '🍕' },
  { letter: 'Q', word: 'QUEEN', emoji: '👸' },
  { letter: 'R', word: 'RABBIT', emoji: '🐰' },
  { letter: 'S', word: 'SUN', emoji: '☀️' },
  { letter: 'T', word: 'TIGER', emoji: '🐯' },
  { letter: 'U', word: 'UMBRELLA', emoji: '☂️' },
  { letter: 'V', word: 'VIOLIN', emoji: '🎻' },
  { letter: 'W', word: 'WATCH', emoji: '⌚' },
  { letter: 'X', word: 'XYLOPHONE', emoji: '🎹' },
  { letter: 'Y', word: 'YELLOW', emoji: '💛' },
  { letter: 'Z', word: 'ZEBRA', emoji: '🦓' }
];

export default function LearnAlphabetsTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [testResults, setTestResults] = useState<{[key: string]: 'correct' | 'incorrect'}>({});
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize audio preprocessing with amplification
  const initAudioProcessing = async () => {
    try {
      console.log('🎚️ Initializing audio preprocessing for test mode...');
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      const source = context.createMediaStreamSource(micStream);
      const gain = context.createGain();
      
      // 1.4x amplification for better recognition
      gain.gain.value = 1.4;
      
      source.connect(gain);
      // Note: NOT connecting to destination to avoid feedback loop
      // The amplified signal is available for monitoring but not played back
      
      setAudioContext(context);
      setGainNode(gain);
      
      console.log('✅ Audio preprocessing initialized for test mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio preprocessing:', error);
      return false;
    }
  };

  // Handle recognition result with useCallback to avoid stale closures
  const handleRecognitionResult = useCallback((transcript: string) => {
    // Get current data fresh to avoid stale closure issues
    const currentLetterData = alphabetData[currentIndex];
    const targetWord = currentLetterData.word.toUpperCase();
    
    // Clean and normalize both transcript and target for comparison
    const cleanTranscript = transcript.toUpperCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const cleanTarget = targetWord.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    
    // Check multiple matching patterns
    const isExactMatch = cleanTranscript === cleanTarget;
    const isContainsMatch = cleanTranscript.includes(cleanTarget);
    const isStartsWithMatch = cleanTranscript.startsWith(cleanTarget);
    
    const isCorrect = isExactMatch || isContainsMatch || isStartsWithMatch;

    console.log('🎯 Test checking pronunciation:', { 
      currentIndex,
      currentLetter: currentLetterData.letter,
      originalTranscript: transcript,
      cleanTranscript, 
      cleanTarget, 
      isExactMatch,
      isContainsMatch,
      isStartsWithMatch,
      isCorrect 
    });

    if (isCorrect) {
      setScore(score + 1);
      setTestResults(prev => ({ ...prev, [currentLetterData.letter]: 'correct' }));
      setShowCelebration(true);
      playCorrectSound();
      createConfetti();

      setTimeout(() => {
        setShowCelebration(false);
        moveToNextLetter();
      }, 2500);
    } else {
      setWrongAnswers(prev => [...prev, currentLetterData.letter]);
      setTestResults(prev => ({ ...prev, [currentLetterData.letter]: 'incorrect' }));
      setShowIncorrect(true);
      playIncorrectSound();

      setTimeout(() => {
        setShowIncorrect(false);
        moveToNextLetter();
      }, 3000);
    }
  }, [currentIndex]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🔴 Test recording started');
        setIsListening(true);
        setCurrentTranscript('Listening...');
        
        if (gainNode) {
          console.log('🎚️ Audio amplification active:', gainNode.gain.value + 'x');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toUpperCase();
        const confidence = event.results[0][0].confidence;
        console.log('🎯 Test recognition result:', { transcript, confidence: `${(confidence * 100).toFixed(2)}%` });
        
        setCurrentTranscript(`"${transcript}"`);
        setHasRecorded(true);
        setIsProcessing(true);
        handleRecognitionResult(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('⚠️ Test recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          setCurrentTranscript('No speech detected. Please try again.');
        } else {
          setCurrentTranscript(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Test recording ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize audio processing
    initAudioProcessing();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [handleRecognitionResult]);

  const currentData = alphabetData[currentIndex];

  const moveToNextLetter = () => {
    if (currentIndex < alphabetData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
      setIsProcessing(false);
    } else {
      // Test complete - navigate to results
      const results = {
        score: score + (testResults[alphabetData[currentIndex].letter] === 'correct' ? 1 : 0),
        total: alphabetData.length,
        wrongAnswers: wrongAnswers,
        type: 'reading' as const,
        subtype: 'learn-alphabets' as const,
      };
      localStorage.setItem('testResults', JSON.stringify(results));
      router.push('/results');
    }
  };

  const resetState = () => {
    setHasRecorded(false);
    setCurrentTranscript('');
  };

  // Audio feedback functions
  const playCorrectSound = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    gain.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => { oscillator.frequency.value = 659.25; }, 100); // E5
    setTimeout(() => { oscillator.frequency.value = 783.99; }, 200); // G5
    setTimeout(() => { oscillator.stop(); context.close(); }, 400);
  };

  const playIncorrectSound = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    gain.gain.value = 0.2;

    oscillator.start();
    setTimeout(() => { oscillator.frequency.value = 100; }, 200);
    setTimeout(() => { oscillator.stop(); context.close(); }, 400);
  };

  // Confetti animation
  const createConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.opacity = '1';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear forwards`;
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
      }, i * 30);
    }
  };

  // Text-to-Speech with anti-double-play protection
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window && !isSpeaking) {
      setIsSpeaking(true);
      
      // Cancel any ongoing speech to prevent overlapping
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is processed
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-IN';
        utterance.rate = 0.6;
        utterance.pitch = 1.2;
        utterance.volume = 1;
        
        // Reset speaking state when done
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
        };
        
        console.log(`🔊 Speaking word: "${word}"`);
        window.speechSynthesis.speak(utterance);
      }, 50);
    } else if (isSpeaking) {
      console.log('🔇 Ignoring click - already speaking');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !hasRecorded) {
      resetState();
      recognitionRef.current.start();
    }
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
    <main className="min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-pink-400 relative">
      {/* Add confetti keyframes */}
      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
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
                />
              </svg>
            </div>
            <div className="text-center mt-6 space-y-3">
              <h2 className="text-6xl font-bold text-white drop-shadow-lg animate-pulse">
                Correct! 🌟
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                Perfect Answer!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incorrect Answer Overlay */}
      {showIncorrect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
            <div className="relative bg-white rounded-full p-8 shadow-2xl">
              <svg
                className="w-48 h-48 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="text-center mt-6 space-y-3">
              <h2 className="text-6xl font-bold text-white drop-shadow-lg">
                Try Again! 🔄
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                Keep Learning!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white/95 shadow-lg">
        <Link href="/">
          <button className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg">
            ← Back
          </button>
        </Link>
        
        <h1 className="text-4xl font-bold text-orange-600">
          🧠 Test Mode - Learn Alphabets
        </h1>

        <div className="w-24"></div>
      </div>

      {/* Alphabet Navigation - Show Progress */}
      <div className="bg-white/95 p-4 flex justify-center gap-2 flex-wrap shadow-lg">
        {alphabetData.map((data, index) => (
          <button
            key={data.letter}
            disabled={true}
            className={`w-12 h-12 rounded-full font-bold text-lg transition-all cursor-default ${
              index === currentIndex
                ? 'bg-orange-600 text-white border-2 border-orange-800'
                : testResults[data.letter] === 'correct'
                ? 'bg-green-500 text-white border-2 border-green-600'
                : testResults[data.letter] === 'incorrect'
                ? 'bg-red-500 text-white border-2 border-red-600'
                : 'bg-white border-2 border-orange-300 text-orange-600'
            }`}
          >
            {data.letter}
          </button>
        ))}
      </div>

      {/* Main Test Area */}
      <div className="flex flex-col lg:flex-row justify-between items-center p-8 gap-12">
        {/* Left Side - Letter Display */}
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-6xl lg:text-8xl font-bold text-white mb-8 drop-shadow-lg text-center">
            {currentData.letter} for {currentData.word}
          </h2>
          
          <div 
            className={`bg-white p-12 rounded-3xl shadow-2xl transition-all ${
              isSpeaking 
                ? 'cursor-not-allowed opacity-75 scale-95' 
                : 'cursor-pointer hover:scale-105 hover:shadow-3xl'
            }`}
            onClick={() => speakWord(currentData.word)}
          >
            <div className="text-8xl lg:text-9xl text-center mb-6">
              {currentData.emoji}
            </div>
            <div className={`text-4xl lg:text-5xl font-bold text-center transition-colors ${
              isSpeaking ? 'text-red-500' : 'text-orange-600'
            }`}>
              {currentData.word}
            </div>
            {isSpeaking && (
              <div className="text-center mt-4">
                <div className="text-sm text-red-500 font-semibold animate-pulse">
                  🔊 Speaking...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Test Area */}
        <div className="flex-1 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <button
              onClick={startListening}
              disabled={isListening || hasRecorded || isProcessing}
              className={`px-8 py-6 text-2xl lg:text-3xl font-bold rounded-full shadow-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse cursor-not-allowed'
                  : hasRecorded || isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-105'
              }`}
            >
              🎙️ Say {currentData.word}!
            </button>

            <div className="w-full p-6 bg-black/30 rounded-2xl min-h-20 flex items-center justify-center">
              <span className="text-white text-xl lg:text-2xl text-center">
                {currentTranscript || 'Your voice will appear here...'}
              </span>
            </div>

            <div className="text-center">
              <p className="text-white text-lg mb-2">
                Progress: {currentIndex + 1} / {alphabetData.length}
              </p>
              <p className="text-white text-lg font-bold">
                Score: {score} / {currentIndex + (hasRecorded ? 1 : 0)}
              </p>
            </div>

            {isProcessing && (
              <div className="text-center mt-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
                <p className="text-white mt-2">Processing your answer...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Rules */}
      <div className="mt-8 bg-white/80 rounded-xl p-6 mx-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Test Rules:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 text-lg">
          <li>Listen to each word and say it clearly</li>
          <li>Only ONE attempt per word</li>
          <li>Click the image to hear the word again</li>
          <li>Your score will be shown at the end</li>
        </ul>
      </div>
    </main>
  );
}