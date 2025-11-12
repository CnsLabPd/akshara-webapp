'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

export default function LearnAlphabetsPracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | ''>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize audio preprocessing with amplification
  const initAudioProcessing = async () => {
    try {
      console.log('🎚️ Initializing audio preprocessing with gain amplification...');
      
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
      
      console.log('✅ Audio preprocessing initialized successfully');
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

    console.log('🎯 Checking pronunciation:', { 
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
      setFeedback(`✅ Correct! You said ${targetWord}!`);
      setFeedbackType('correct');
      setShowCelebration(true);
      playCorrectSound();
      createConfetti();

      setTimeout(() => {
        setShowCelebration(false);
        // Auto-advance after success in practice mode
        setTimeout(() => goToNextLetter(), 1000);
      }, 2500);
    } else {
      setFeedback('❌ Try Again!');
      setFeedbackType('incorrect');
      playIncorrectSound();
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
        console.log('🔴 Recording started');
        setIsListening(true);
        setCurrentTranscript('Listening...');
        
        if (gainNode) {
          console.log('🎚️ Audio amplification active:', gainNode.gain.value + 'x');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toUpperCase();
        const confidence = event.results[0][0].confidence;
        console.log('🎯 Recognition result:', { transcript, confidence: `${(confidence * 100).toFixed(2)}%` });
        
        setCurrentTranscript(`"${transcript}"`);
        setHasRecorded(true);
        handleRecognitionResult(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('⚠️ Recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          setCurrentTranscript('No speech detected. Please try again.');
        } else {
          setCurrentTranscript(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Recording ended');
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

  // Navigation functions
  const goToNextLetter = () => {
    if (currentIndex < alphabetData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    } else {
      setShowCompletion(true);
    }
  };

  const goToPreviousLetter = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  };

  const jumpToLetter = (index: number) => {
    setCurrentIndex(index);
    resetState();
  };

  const resetState = () => {
    setHasRecorded(false);
    setCurrentTranscript('');
    setFeedback('');
    setFeedbackType('');
    setShowCelebration(false);
  };


  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      resetState();
      recognitionRef.current.start();
    }
  };

  const handleRetry = () => {
    resetState();
  };

  if (!isSupported) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-8">
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

  if (showCompletion) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-6">🎉</div>
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Great Job!
          </h1>
          <p className="text-3xl text-white mb-8 drop-shadow">
            You mastered all alphabets!
          </p>
          <Link href="/">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-2xl hover:bg-gray-100 transition-colors shadow-lg">
              🏠 Home
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 relative">
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
                Excellent! 🌟
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                Perfect Pronunciation!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white/95 shadow-lg">
        <Link href="/">
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-colors shadow-lg">
            ← Back
          </button>
        </Link>
        
        <h1 className="text-4xl font-bold text-green-600">
          🧩 Practice Mode - Learn Alphabets
        </h1>

        <div className="w-24"></div>
      </div>

      {/* Alphabet Navigation */}
      <div className="bg-white/95 p-4 flex justify-center gap-2 flex-wrap shadow-lg">
        {alphabetData.map((data, index) => (
          <button
            key={data.letter}
            onClick={() => jumpToLetter(index)}
            className={`w-12 h-12 rounded-full font-bold text-lg transition-all hover:scale-110 cursor-pointer ${
              index === currentIndex
                ? 'bg-green-600 text-white border-2 border-green-800'
                : 'bg-white border-2 border-green-300 text-green-600 hover:bg-green-100'
            }`}
          >
            {data.letter}
          </button>
        ))}
      </div>

      {/* Main Learning Area */}
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
              isSpeaking ? 'text-orange-500' : 'text-green-600'
            }`}>
              {currentData.word}
            </div>
            {isSpeaking && (
              <div className="text-center mt-4">
                <div className="text-sm text-orange-500 font-semibold animate-pulse">
                  🔊 Speaking...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Action Area */}
        <div className="flex-1 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`px-8 py-6 text-2xl lg:text-3xl font-bold rounded-full shadow-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
              }`}
            >
              🎙️ Say {currentData.word}!
            </button>

            <div className="w-full p-6 bg-black/30 rounded-2xl min-h-20 flex items-center justify-center">
              <span className="text-white text-xl lg:text-2xl text-center">
                {currentTranscript || 'Your voice will appear here...'}
              </span>
            </div>

            {feedback && (
              <div className={`text-2xl lg:text-3xl font-bold text-center p-4 rounded-xl ${
                feedbackType === 'correct' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {feedback}
              </div>
            )}

            {hasRecorded && (
              <div className="flex gap-4">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
                >
                  🔁 Re-record
                </button>
                
                {feedbackType === 'correct' && (
                  <button
                    onClick={goToNextLetter}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors shadow-lg"
                  >
                    ⏭️ Next
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
              <button
                onClick={goToPreviousLetter}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={goToNextLetter}
                disabled={currentIndex === alphabetData.length - 1}
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
          </div>
        </div>
      </div>
    </main>
  );
}