'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import KeyboardDrawingTutorial from '@/components/KeyboardDrawingTutorial';
import { characterRecognizer } from '@/utils/tensorflowModel';
import { isDesktopDevice } from '@/utils/deviceDetection';
import { useKeyboardDrawing } from '@/hooks/useKeyboardDrawing';

export default function CorrectedTestNumbersPage() {
  const router = useRouter();
  const [testNumbers, setTestNumbers] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Keyboard drawing mode states
  const [isDesktop, setIsDesktop] = useState(false);
  const [keyboardDrawingEnabled, setKeyboardDrawingEnabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isWKeyPressed } = useKeyboardDrawing();

  useEffect(() => {
    const storedNumbers = localStorage.getItem('correctedTestNumbers');
    if (storedNumbers) {
      setTestNumbers(JSON.parse(storedNumbers));
    } else {
      router.push('/');
    }

    const initModel = async () => {
      try {
        await characterRecognizer.loadModel();
        setModelReady(true);
        console.log('TensorFlow.js model loaded for numbers corrected test');
      } catch (error) {
        console.error('Error loading TensorFlow.js model:', error);
        setModelError('Failed to load AI model. Please refresh the page.');
      }
    };

    initModel();

    return () => {
      characterRecognizer.dispose();
    };
  }, [router]);

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

  const currentNumber = testNumbers[currentIndex];

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
      // Use TensorFlow.js for character recognition
      const result = await characterRecognizer.recognizeCharacter(canvas);
      
      console.log('TensorFlow.js Results:');
      console.log('- Recognized character:', result.letter);
      console.log('- Confidence:', result.confidence);
      console.log('- Expected number:', currentNumber);

      // Same custom number matching logic as test
      const customNumberMatch = (recognized: string, expected: string, confidence: number): boolean => {
        // Direct number match - always accept with standard confidence
        if (recognized === expected && confidence >= characterRecognizer.getConfidenceThreshold(result.letter)) {
          return true;
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
        return mapping && mapping.numbers.includes(expected) && confidence >= mapping.minConfidence;
      };

      const isAnswerCorrect = customNumberMatch(result.letter, currentNumber, result.confidence);

      // Set feedback and update score
      if (isAnswerCorrect) {
        setScore(score + 1);
        setFeedbackMessage('Correct!');
        setIsCorrect(true);
      } else {
        setWrongAnswers([...wrongAnswers, currentNumber]);
        setFeedbackMessage('Wrong!');
        setIsCorrect(false);
      }

      setShowFeedback(true);
      setIsProcessing(false);

      // Auto-advance after showing feedback
      setTimeout(() => {
        setShowFeedback(false);
        
        // Move to next number or finish test
        if (currentIndex < testNumbers.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setHasDrawn(false);
          setCurrentDrawing('');
          canvasRef.current?.clear();
        } else {
          // Corrected test complete
          const finalWrongAnswers = isAnswerCorrect ? wrongAnswers : [...wrongAnswers, currentNumber];

          if (finalWrongAnswers.length > 0) {
            // Still have wrong answers - need another corrected test cycle
            const results = {
              score: isAnswerCorrect ? score + 1 : score,
              total: testNumbers.length,
              wrongAnswers: finalWrongAnswers,
              isCorrectedTest: true,
              type: 'writing' as const,
            };
            localStorage.setItem('testResults', JSON.stringify(results));
            localStorage.setItem('correctedTestNumbers', JSON.stringify(finalWrongAnswers));
          } else {
            // All correct - mastered all numbers!
            const results = {
              score: isAnswerCorrect ? score + 1 : score,
              total: testNumbers.length,
              wrongAnswers: [],
              isCorrectedTest: true,
              allMastered: true,
              type: 'writing' as const,
            };
            localStorage.setItem('testResults', JSON.stringify(results));
          }

          router.push('/results');
        }
      }, 1500); // Show feedback for 1.5 seconds

    } catch (error) {
      console.error('TensorFlow.js Recognition Error:', error);
      setIsProcessing(false);
    }
  };

  if (testNumbers.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-8 flex items-center justify-center">
        <div className="text-white text-2xl">Loading test...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-300 to-red-400 p-8 relative">
      {/* Feedback Overlay */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative">
            <div className={`relative rounded-full p-8 shadow-2xl animate-bounce ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
              <div className="text-center">
                <h2 className="text-6xl font-bold text-white drop-shadow-lg">
                  {feedbackMessage}
                </h2>
                <div className="text-4xl mt-4">
                  {isCorrect ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/results">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Back to Results
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Numbers Corrected Test</h1>
          <div className="w-32"></div>
        </div>

        <div className="bg-orange-100 rounded-xl shadow-xl p-4 mb-6 border-4 border-orange-400">
          <p className="text-center text-orange-800 font-bold text-xl">
            🔢 Practice makes perfect! Let's master these numbers!
          </p>
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
                {currentIndex + 1} / {testNumbers.length}
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
              Write the number: <span className="text-orange-600">{currentNumber}</span>
            </h2>
            {modelError ? (
              <p className="text-red-600">{modelError}</p>
            ) : modelReady ? (
              <p className="text-gray-600">Take your time and write carefully!</p>
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
              isEnabled={!isProcessing && modelReady && !modelError && !showFeedback}
              keyboardDrawingEnabled={keyboardDrawingEnabled}
              isWKeyPressed={isWKeyPressed}
            />
          </div>

          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || isProcessing || !modelReady || !!modelError || showFeedback}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? 'AI Processing...' : 'Submit Answer'}
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
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Corrected Test Info:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-lg">
            <li>Focus on the numbers you got wrong</li>
            <li>Each answer shows "Correct!" or "Wrong!" feedback</li>
            <li>Keep practicing until you master all numbers</li>
            <li>If you make mistakes again, you'll retake those numbers</li>
            <li>Once you get all correct, you'll complete the learning cycle!</li>
          </ul>
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