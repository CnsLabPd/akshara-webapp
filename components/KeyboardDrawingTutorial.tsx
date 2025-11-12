/**
 * Tutorial Modal for Keyboard Drawing Mode
 * Shows instructions on how to use keyboard drawing with W key
 */

'use client';

import { useState, useEffect } from 'react';

interface KeyboardDrawingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardDrawingTutorial({
  isOpen,
  onClose,
}: KeyboardDrawingTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('keyboardDrawingTutorialSeen', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close tutorial"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✏️</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Keyboard Drawing Mode
          </h2>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Hold the &apos;W&apos; key</span> on your
                keyboard to enable drawing
              </li>
              <li>
                <span className="font-semibold">Use your touchpad</span> to trace the
                letter while holding W
              </li>
              <li>
                <span className="font-semibold">Release the &apos;W&apos; key</span> to stop
                drawing
              </li>
              <li>
                Practice proper <span className="font-semibold">stroke tracing</span>{' '}
                to improve your handwriting!
              </li>
            </ol>
          </div>

          {/* Visual hint */}
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-center">
            <p className="text-sm text-gray-700">
              💡 <span className="font-semibold">Tip:</span> Watch for the indicator
              that shows when drawing is enabled
            </p>
          </div>

          {/* W Key visual */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 border-2 border-gray-400 rounded-lg shadow-md px-6 py-3">
              <span className="text-3xl font-bold text-gray-800">W</span>
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              Don&apos;t show this again
            </span>
          </label>
        </div>

        {/* Action button */}
        <button
          onClick={handleClose}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Got it! Let&apos;s Practice
        </button>
      </div>
    </div>
  );
}
