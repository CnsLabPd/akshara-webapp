'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import DrawingAnimation from '@/components/DrawingAnimation';
import KeyboardDrawingTutorial from '@/components/KeyboardDrawingTutorial';
import { characterRecognizer, isNumberMatch } from '@/utils/tensorflowModel';
import { isDesktopDevice } from '@/utils/deviceDetection';
import { useKeyboardDrawing } from '@/hooks/useKeyboardDrawing';

const NUMBERS = '0123456789'.split('');

export default function PracticeNumbersPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [recognizedOutput, setRecognizedOutput] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string>('');
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Keyboard drawing mode states
  const [isDesktop, setIsDesktop] = useState(false);
  const [keyboardDrawingEnabled, setKeyboardDrawingEnabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isWKeyPressed } = useKeyboardDrawing();

  useEffect(() => {
    const initModel = async () => {
      try {
        await characterRecognizer.loadModel();
        setModelReady(true);
        console.log('TensorFlow.js model loaded for numbers practice');
      } catch (error) {
        console.error('Error loading TensorFlow.js model:', error);
        setModelError('Failed to load AI model. Please refresh the page.');
      }
    };

    initModel();

    return () => {
      characterRecognizer.dispose();
    };
  }, []);

  // Detect device type and load settings
  useEffect(() => {
    setIsDesktop(isDesktopDevice());

    // Load keyboard drawing setting from localStorage
    const savedSetting = localStorage.getItem('keyboardDrawingEnabled');
    if (savedSetting === 'true') {
      setKeyboardDrawingEnabled(true);
    }
  }, []);

  // Handle keyboard drawing toggle
  const handleKeyboardDrawingToggle = (enabled: boolean) => {
    setKeyboardDrawingEnabled(enabled);
    localStorage.setItem('keyboardDrawingEnabled', enabled.toString());

    // Show tutorial on first enable
    if (enabled) {
      const tutorialSeen = localStorage.getItem('keyboardDrawingTutorialSeen');
      if (!tutorialSeen) {
        setShowTutorial(true);
      }
    }
  };

  const currentNumber = NUMBERS[currentIndex];


  const handleDrawingComplete = (canvas: HTMLCanvasElement) => {
    setCurrentDrawing(canvas.toDataURL('image/png'));
    setHasDrawn(true);
  };

  const handleSubmit = async () => {
    if (!hasDrawn || !modelReady || isProcessing) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      setFeedback('Error: Canvas not available');
      return;
    }

    setIsProcessing(true);
    setFeedback('Checking your drawing...');
    setRecognizedOutput('');

    try {
      // Use TensorFlow.js for character recognition
      const result = await characterRecognizer.recognizeCharacter(canvas);
      
      console.log('TensorFlow.js Results:');
      console.log('- Recognized character:', result.letter);
      console.log('- Confidence:', result.confidence);
      console.log('- Expected number:', currentNumber);


      // Show what the model recognized
      setRecognizedOutput(result.letter || '(nothing detected)');

      // Custom number matching logic with specific confidence thresholds
      const customNumberMatch = (recognized: string, expected: string, confidence: number): {
        isCorrect: boolean;
        feedback: string;
      } => {
        // Direct number match - always accept with standard confidence
        if (recognized === expected && confidence >= characterRecognizer.getConfidenceThreshold(result.letter)) {
          return {
            isCorrect: true,
            feedback: `Perfect! Correctly wrote ${expected}!`
          };
        }

        // Custom mappings with specific confidence requirements
        const customMappings: { [key: string]: { numbers: string[], minConfidence: number } } = {
          'B': { numbers: ['3', '8'], minConfidence: 0.5 }, // Standard confidence for B→3, B→8
          'A': { numbers: ['4'], minConfidence: 0.3 },      // 30% confidence for A→4
          't': { numbers: ['4', '7'], minConfidence: 0.3 }, // 30% confidence for t→4, t→7
          'T': { numbers: ['7'], minConfidence: 0.7 },      // 70% confidence for T→7
          'b': { numbers: ['6'], minConfidence: 0.5 },      // Standard confidence for b→6
          // Keep existing mappings
          'O': { numbers: ['0'], minConfidence: 0.5 }, 'o': { numbers: ['0'], minConfidence: 0.5 },
          'I': { numbers: ['1'], minConfidence: 0.5 }, 'i': { numbers: ['1'], minConfidence: 0.5 }, 'l': { numbers: ['1'], minConfidence: 0.5 },
          'Z': { numbers: ['2'], minConfidence: 0.5 }, 'z': { numbers: ['2'], minConfidence: 0.5 },
          'S': { numbers: ['5'], minConfidence: 0.5 }, 's': { numbers: ['5'], minConfidence: 0.5 },
          'G': { numbers: ['6'], minConfidence: 0.5 }, 'g': { numbers: ['6'], minConfidence: 0.5 },
          'q': { numbers: ['9'], minConfidence: 0.5 }
        };

        const mapping = customMappings[recognized];
        if (mapping && mapping.numbers.includes(expected) && confidence >= mapping.minConfidence) {
          return {
            isCorrect: true,
            feedback: `Good! Recognized as ${recognized}, which looks like ${expected}!`
          };
        }

        // Check if recognized is another number
        if ('0123456789'.includes(recognized) && confidence >= characterRecognizer.getConfidenceThreshold(result.letter)) {
          return {
            isCorrect: false,
            feedback: `Try again! You wrote ${recognized}, but expected ${expected}`
          };
        }

        // Not recognized or low confidence
        return {
          isCorrect: false,
          feedback: `Try again! Draw the number ${expected}. AI saw: ${recognized}`
        };
      };

      const matchResult = customNumberMatch(result.letter, currentNumber, result.confidence);
      
      if (matchResult.isCorrect) {
        setScore(score + 1);
        setFeedback(matchResult.feedback);
        setShowCelebration(true);

        setTimeout(() => {
          setShowCelebration(false);
          if (currentIndex < NUMBERS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFeedback('');
            setRecognizedOutput('');
            setHasDrawn(false);
            setCurrentDrawing('');
            canvasRef.current?.clear();
          }
          setIsProcessing(false);
        }, 2500);
      } else {
        // Handle incorrect matches
        setFeedback(matchResult.feedback);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('TensorFlow.js Recognition Error:', error);
      setFeedback('Error processing your drawing. Please try again.');
      setRecognizedOutput('');
      setIsProcessing(false);
    }
  };

  const nextNumber = () => {
    if (currentIndex < NUMBERS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback('');
      setRecognizedOutput('');
      setHasDrawn(false);
      setCurrentDrawing('');
      canvasRef.current?.clear();
    }
  };

  const previousNumber = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback('');
      setRecognizedOutput('');
      setHasDrawn(false);
      setCurrentDrawing('');
      canvasRef.current?.clear();
    }
  };

  const handleRetry = () => {
    setFeedback('');
    setRecognizedOutput('');
    setHasDrawn(false);
    setCurrentDrawing('');
    canvasRef.current?.clear();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-300 to-red-300 p-8 relative">
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
                Amazing! 🌟
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                You did it!
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
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            ← Back
          </button>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Practice Mode - Numbers</h1>
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
              <p className="text-gray-600 text-lg mb-1">Correct Attempts</p>
              <p className="text-6xl font-bold text-blue-600">{score}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Settings Toggle - Desktop Only */}
          {isDesktop && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">⌨️ Keyboard Drawing Mode</span>
                  <span className="text-sm text-gray-500">(Hold W to draw)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyboardDrawingEnabled}
                    onChange={(e) => handleKeyboardDrawingToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Practice writing: <span className="text-orange-600">{currentNumber}</span>
            </h2>
            {modelError ? (
              <p className="text-red-600">{modelError}</p>
            ) : modelReady ? (
              <p className="text-gray-600">Draw the number, then click Submit</p>
            ) : (
              <p className="text-orange-600">Loading AI model...</p>
            )}
          </div>

          {/* Visual Indicator - Desktop Only */}
          {isDesktop && keyboardDrawingEnabled && (
            <div className="flex justify-center mb-4">
              <div
                className={`px-6 py-3 rounded-full font-semibold text-lg shadow-lg transition-all duration-200 ${
                  isWKeyPressed
                    ? 'bg-green-500 text-white animate-pulse'
                    : 'bg-yellow-400 text-gray-800'
                }`}
              >
                {isWKeyPressed ? '✏️ Drawing Enabled' : '🔓 Hold W to Draw'}
              </div>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <DrawingCanvas
              ref={canvasRef}
              onDrawingComplete={handleDrawingComplete}
              isEnabled={!isProcessing && modelReady && !modelError}
              keyboardDrawingEnabled={keyboardDrawingEnabled}
              isWKeyPressed={isWKeyPressed}
            />
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || isProcessing || !modelReady || !!modelError}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? 'AI Processing...' : 'Submit'}
            </button>
            <button
              onClick={handleRetry}
              disabled={isProcessing}
              className="px-12 py-4 bg-yellow-500 text-white rounded-lg font-bold text-2xl hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              🔄 Retry
            </button>
            <button
              onClick={() => setShowAnimation(true)}
              className="px-12 py-4 bg-purple-500 text-white rounded-lg font-bold text-2xl hover:bg-purple-600 transition-colors shadow-lg"
            >
              🎬 Animation
            </button>
          </div>

          {feedback && (
            <div className={`text-center p-4 rounded-lg mb-6 ${
              feedback.includes('correct') || feedback.includes('Great')
                ? 'bg-green-100 text-green-800'
                : feedback.includes('Try again')
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              <p className="text-xl font-semibold">{feedback}</p>
            </div>
          )}

          {recognizedOutput && (
            <div className="text-center p-4 rounded-lg mb-6 bg-purple-100 border-2 border-purple-300">
              <p className="text-gray-700 text-lg mb-2">
                <span className="font-semibold">Model Recognized:</span>
              </p>
              <p className="text-3xl font-bold text-purple-700">
                &quot;{recognizedOutput}&quot;
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Expected: <span className="font-semibold text-orange-600">{currentNumber}</span>
              </p>
            </div>
          )}


          {isProcessing && (
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
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
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Animation Modal */}
      <DrawingAnimation
        character={currentNumber}
        isVisible={showAnimation}
        onClose={() => setShowAnimation(false)}
      />

      {/* Keyboard Drawing Tutorial Modal */}
      <KeyboardDrawingTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </main>
  );
}
