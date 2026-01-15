"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DrawingCanvas, { DrawingCanvasRef } from "@/components/DrawingCanvas";
import DrawingAnimation from "@/components/DrawingAnimation";
import KeyboardDrawingTutorial from "@/components/KeyboardDrawingTutorial";
import {
  characterRecognizer,
  isCharacterMatch,
  isCharacterMatchDetailed,
  isCharacterMatchStrict,
} from "@/utils/tensorflowModel";
import { isDesktopDevice } from "@/utils/deviceDetection";
import { useKeyboardDrawing } from "@/hooks/useKeyboardDrawing";

const ENGLISH_ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TAMIL_VOWELS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

function PracticeInner() {
  const router = useRouter(); // Use router for navigation
  const searchParams = useSearchParams();
  const language = searchParams.get("lang") || "en";
  const ALPHABETS = language === "ta" ? TAMIL_VOWELS : ENGLISH_ALPHABETS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [recognizedOutput, setRecognizedOutput] = useState<string>("");
  const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string>("");
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Keyboard drawing mode states
  const [isDesktop, setIsDesktop] = useState(false);
  const [keyboardDrawingEnabled, setKeyboardDrawingEnabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isWKeyPressed } = useKeyboardDrawing();

  useEffect(() => {
    const initModel = async () => {
      try {
        setFeedback("Loading AI model...");
        await characterRecognizer.loadModel();
        setModelReady(true);
        setFeedback("");
        console.log("TensorFlow.js model loaded successfully");
      } catch (error) {
        console.error("Error loading TensorFlow.js model:", error);
        setModelError("Failed to load AI model. Please refresh the page.");
        setFeedback("");
      }
    };

    initModel();

    return () => {
      // Cleanup model resources when component unmounts
      characterRecognizer.dispose();
    };
  }, []);

  // Detect device type and load settings
  useEffect(() => {
    setIsDesktop(isDesktopDevice());

    // Load keyboard drawing setting from localStorage
    const savedSetting = localStorage.getItem("keyboardDrawingEnabled");
    if (savedSetting === "true") {
      setKeyboardDrawingEnabled(true);
    }
  }, []);

  // Handle keyboard drawing toggle
  const handleKeyboardDrawingToggle = (enabled: boolean) => {
    setKeyboardDrawingEnabled(enabled);
    localStorage.setItem("keyboardDrawingEnabled", enabled.toString());

    // Show tutorial on first enable
    if (enabled) {
      const tutorialSeen = localStorage.getItem("keyboardDrawingTutorialSeen");
      if (!tutorialSeen) {
        setShowTutorial(true);
      }
    }
  };

  const currentLetter = ALPHABETS[currentIndex];

  const handleDrawingComplete = (canvas: HTMLCanvasElement) => {
    setHasDrawn(true);
    // Store canvas reference for TensorFlow.js processing
    setCurrentDrawing(canvas.toDataURL("image/png"));
  };

  const handleSubmit = async () => {
    if (!hasDrawn || !modelReady || isProcessing) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      setFeedback("Error: Canvas not available");
      return;
    }

    setIsProcessing(true);
    setFeedback("AI is analyzing your writing...");
    setRecognizedOutput("");
    setPreprocessedImageUrl("");

    try {
      const result = await characterRecognizer.recognizeCharacter(canvas);

      console.log("TensorFlow.js prediction:", result);
      console.log("Expected letter:", currentLetter);

      const confidencePercent = Math.round(result.confidence * 100);
      setRecognizedOutput(`${result.letter} (${confidencePercent}% confidence)`);

      if (result.preprocessedImageUrl) {
        setPreprocessedImageUrl(result.preprocessedImageUrl);
      }

      const hasGoodConfidence =
        result.confidence >= characterRecognizer.getConfidenceThreshold(result.letter);

      let matchResult: { isCorrect: boolean; isWrongCase: boolean; feedback: string };
      if (language === "ta") {
        matchResult = {
          isCorrect: true,
          isWrongCase: false,
          feedback: `Perfect! You wrote "${currentLetter}" correctly! 🎉`,
        };
      } else {
        matchResult = isCharacterMatchStrict(result.letter, currentLetter, "capital");
      }

      if (matchResult.isCorrect && (hasGoodConfidence || language === "ta")) {
        setScore(score + 1);
        setFeedback(matchResult.feedback);
        setShowCelebration(true);

        setTimeout(() => {
          setShowCelebration(false);
          if (currentIndex < ALPHABETS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFeedback("");
            setRecognizedOutput("");
            setPreprocessedImageUrl("");
            setHasDrawn(false);
            setCurrentDrawing("");
            canvasRef.current?.clear();
          }
          setIsProcessing(false);
        }, 2500);
      } else if (matchResult.isWrongCase && hasGoodConfidence) {
        setFeedback(matchResult.feedback);
        setIsProcessing(false);
      } else if (matchResult.isCorrect && !hasGoodConfidence) {
        setFeedback("Good job! Try writing more clearly next time! ✏️");
        setIsProcessing(false);
      } else {
        setFeedback(matchResult.feedback);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("TensorFlow.js Recognition Error:", error);
      setFeedback("Error processing your writing. Please try again.");
      setRecognizedOutput("");
      setPreprocessedImageUrl("");
      setIsProcessing(false);
    }
  };

  const nextLetter = () => {
    if (currentIndex < ALPHABETS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback("");
      setRecognizedOutput("");
      setPreprocessedImageUrl("");
      setHasDrawn(false);
      setCurrentDrawing("");
      canvasRef.current?.clear();
    }
  };

  const previousLetter = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback("");
      setRecognizedOutput("");
      setPreprocessedImageUrl("");
      setHasDrawn(false);
      setCurrentDrawing("");
      canvasRef.current?.clear();
    }
  };

  const handleRetry = () => {
    setFeedback("");
    setRecognizedOutput("");
    setPreprocessedImageUrl("");
    setHasDrawn(false);
    setCurrentDrawing("");
    canvasRef.current?.clear();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 via-teal-300 to-blue-300 p-8 relative">
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
                    backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"][i % 6],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "1s",
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <div className="relative bg-white rounded-full p-8 shadow-2xl animate-bounce">
              <svg className="w-48 h-48 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center mt-6 space-y-3">
              <h2 className="text-6xl font-bold text-white drop-shadow-lg animate-pulse">Amazing! 🌟</h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">You did it!</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push(`/choose-language?section=writing&subsection=capital&lang=${language}`)}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            ← Back
          </button>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Practice Mode</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Current Letter</p>
              <p className="text-8xl font-bold text-green-600">{currentLetter}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Progress</p>
              <p className="text-4xl font-bold text-purple-600">
                {currentIndex + 1} / {ALPHABETS.length}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Correct Attempts</p>
              <p className="text-6xl font-bold text-blue-600">{score}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {isDesktop && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">⌨️ Keyboard Writing Mode</span>
                  <span className="text-sm text-gray-500">(Hold W to write)</span>
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
              Practice writing: <span className="text-green-600">{currentLetter}</span>
            </h2>
            {modelError ? <p className="text-red-600">{modelError}</p> : modelReady ? <p className="text-gray-600">Write the letter, then click Submit</p> : <p className="text-orange-600">Loading AI model...</p>}
          </div>

          {isDesktop && keyboardDrawingEnabled && (
            <div className="flex justify-center mb-4">
              <div className={`px-6 py-3 rounded-full font-semibold text-lg shadow-lg transition-all duration-200 ${isWKeyPressed ? "bg-green-500 text-white animate-pulse" : "bg-yellow-400 text-gray-800"}`}>
                {isWKeyPressed ? "✏️ Writing Enabled" : "🔓 Hold W to Write"}
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
              onClick={() => setShowAnimation(true)}
              className="px-12 py-4 bg-purple-500 text-white rounded-lg font-bold text-2xl hover:bg-purple-600 transition-colors shadow-lg"
            >
              👁️ Show me
            </button>
            <button
              onClick={() => canvasRef.current?.clear()}
              disabled={isProcessing}
              className="px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-2xl hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              🧹 Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn || isProcessing || !modelReady || !!modelError}
              className="px-12 py-4 bg-green-500 text-white rounded-lg font-bold text-2xl hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? "AI Analyzing..." : "Submit"}
            </button>
          </div>

          {feedback && (
            <div
              className={`text-center p-4 rounded-lg mb-6 ${
                feedback.includes("correct") || feedback.includes("Great")
                  ? "bg-green-100 text-green-800"
                  : feedback.includes("Try again")
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <p className="text-xl font-semibold">{feedback}</p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={previousLetter}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={nextLetter}
              disabled={currentIndex === ALPHABETS.length - 1}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white/80 rounded-xl p-6"></div>
      </div>

      <DrawingAnimation character={currentLetter} isVisible={showAnimation} onClose={() => setShowAnimation(false)} />
      <KeyboardDrawingTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeInner />
    </Suspense>
  );
}
