'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import KeyboardDrawingTutorial from '@/components/KeyboardDrawingTutorial';
import { characterRecognizer, isCharacterMatch, isCharacterMatchStrict } from '@/utils/tensorflowModel';
import { isDesktopDevice } from '@/utils/deviceDetection';
import { useKeyboardDrawing } from '@/hooks/useKeyboardDrawing';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function TestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [recognizedOutput, setRecognizedOutput] = useState<string>('');
  const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string>('');
  const [wrongCaseDetected, setWrongCaseDetected] = useState(false);
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
        console.log('TensorFlow.js model loaded for test mode');
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

  const currentLetter = ALPHABETS[currentIndex];

  const handleDrawingComplete = (canvas: HTMLCanvasElement) => {
    setHasDrawn(true);
    setCurrentDrawing(canvas.toDataURL('image/png'));
  };

  const handleSubmit = async () => {
    if (!hasDrawn || !modelReady || isProcessing) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      console.error('Canvas not available');
      return;
    }

    setIsProcessing(true);

    try {
      // Use TensorFlow.js model for character recognition
      const result = await characterRecognizer.recognizeCharacter(canvas);
      
      console.log('TensorFlow.js prediction:', result);
      console.log('Expected letter:', currentLetter);

      // Show what the model recognized with confidence
      const confidencePercent = Math.round(result.confidence * 100);
      setRecognizedOutput(`${result.letter} (${confidencePercent}% confidence)`);
      
      // Show the preprocessed image that was sent to the model
      if (result.preprocessedImageUrl) {
        setPreprocessedImageUrl(result.preprocessedImageUrl);
      }

      // Use strict educational character matching for test mode
      const hasGoodConfidence = result.confidence >= characterRecognizer.getConfidenceThreshold(result.letter);
      const matchResult = isCharacterMatchStrict(result.letter, currentLetter, 'capital');

      if (matchResult.isCorrect && hasGoodConfidence) {
        // Only count EXACT capital letter matches as correct in test
        setScore(score + 1);
        setWrongCaseDetected(false);
        setShowCelebration(true);

        // Show celebration for 2 seconds before moving to next
        setTimeout(() => {
          setShowCelebration(false);

          if (currentIndex < ALPHABETS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setHasDrawn(false);
            setCurrentDrawing('');
            setRecognizedOutput('');
            setPreprocessedImageUrl('');
            canvasRef.current?.clear();
            setIsProcessing(false);
          } else {
            // Test complete - navigate to results
            const results = {
              score: score + 1,
              total: ALPHABETS.length,
              wrongAnswers: wrongAnswers,
              type: 'writing' as const,
            };
            localStorage.setItem('testResults', JSON.stringify(results));
            router.push('/results');
          }
        }, 2500);
      } else {
        // Mark as wrong - includes wrong case, wrong letter, or low confidence
        setWrongAnswers([...wrongAnswers, currentLetter]);
        setWrongCaseDetected(matchResult.isWrongCase && hasGoodConfidence);
        setShowIncorrect(true);

        // Move to next letter or finish test
        if (currentIndex < ALPHABETS.length - 1) {
          setTimeout(() => {
            setShowIncorrect(false);
            setWrongCaseDetected(false);
            setCurrentIndex(currentIndex + 1);
            setHasDrawn(false);
            setCurrentDrawing('');
            setRecognizedOutput('');
            setPreprocessedImageUrl('');
            canvasRef.current?.clear();
            setIsProcessing(false);
          }, 3000); // Longer timeout to show feedback
        } else {
          // Test complete - show incorrect feedback then navigate to results
          setTimeout(() => {
            setShowIncorrect(false);
            const results = {
              score: score,
              total: ALPHABETS.length,
              wrongAnswers: [...wrongAnswers, currentLetter],
              type: 'writing' as const,
            };
            localStorage.setItem('testResults', JSON.stringify(results));
            router.push('/results');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('TensorFlow.js Recognition Error:', error);
      setIsProcessing(false);
    }
  };

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
                Perfect Writing!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incorrect Answer Overlay */}
      {showIncorrect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
            {/* Red X Mark */}
            <div className="relative bg-white rounded-full p-8 shadow-2xl animate-bounce">
              <svg
                className="w-48 h-48 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  animation: 'xmark 0.5s ease-in-out',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                    animation: 'draw 0.5s ease-in-out forwards',
                  }}
                />
              </svg>
            </div>

            {/* Error Messages */}
            <div className="text-center mt-6 space-y-3">
              <h2 className="text-6xl font-bold text-white drop-shadow-lg animate-pulse">
                {wrongCaseDetected ? 'Wrong Case! ⚠️' : 'Incorrect! ❌'}
              </h2>
              <p className="text-3xl text-red-300 font-semibold drop-shadow">
                {wrongCaseDetected ? 'Remember: Write CAPITAL letters!' : 'Moving to next letter...'}
              </p>
              {recognizedOutput && (
                <p className="text-xl text-yellow-300 drop-shadow">
                  AI recognized: {recognizedOutput}
                </p>
              )}
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
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Test Mode</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Current Letter</p>
              <p className="text-8xl font-bold text-orange-600">{currentLetter}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Progress</p>
              <p className="text-4xl font-bold text-purple-600">
                {currentIndex + 1} / {ALPHABETS.length}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Score</p>
              <p className="text-6xl font-bold text-green-600">
                {score}
              </p>
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
              Write the letter: <span className="text-orange-600">{currentLetter}</span>
            </h2>
            {modelError ? (
              <p className="text-red-600">{modelError}</p>
            ) : modelReady ? (
              <p className="text-gray-600">Draw carefully - single attempt only!</p>
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

          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || isProcessing || !modelReady || !!modelError}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? 'AI Processing...' : 'Submit Answer'}
            </button>
          </div>

          {recognizedOutput && !showCelebration && !showIncorrect && (
            <div className="text-center p-4 rounded-lg mt-6 bg-purple-100 border-2 border-purple-300">
              <p className="text-gray-700 text-lg mb-2">
                <span className="font-semibold">Model Recognized:</span>
              </p>
              <p className="text-3xl font-bold text-purple-700">
                &quot;{recognizedOutput}&quot;
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Expected: <span className="font-semibold text-orange-600">{currentLetter}</span>
              </p>
            </div>
          )}

          {preprocessedImageUrl && !showCelebration && !showIncorrect && (
            <div className="text-center p-4 rounded-lg mt-6 bg-blue-100 border-2 border-blue-300">
              <p className="text-gray-700 text-lg mb-4">
                <span className="font-semibold">🔍 Preprocessed Input (What the Model Sees):</span>
              </p>
              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">28x28 pixels, normalized</p>
                  <div className="inline-block p-2 bg-white rounded-lg shadow-lg">
                    <img 
                      src={preprocessedImageUrl} 
                      alt="Preprocessed input"
                      className="w-32 h-32 image-rendering-pixelated border border-gray-300"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is the actual 28x28 grayscale image sent to the AI model
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center mt-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
              <p className="text-gray-600 mt-2">Checking your answer...</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white/80 rounded-xl p-6">
          {/* <h3 className="text-2xl font-bold text-gray-800 mb-3">Test Rules:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-lg">
            <li>Write each letter carefully</li>
            <li>Only ONE attempt per letter</li>
            <li>Click Submit to move to the next letter</li>
            <li>Your score will be shown at the end</li>
            <li>Incorrect letters will be retested in a corrected test</li>
          </ul> */}
        </div>
      </div>

      {/* Keyboard Drawing Tutorial Modal */}
      <KeyboardDrawingTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </main>
  );
}
