'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { pronunciationDataCollector } from '@/utils/pronunciationDataCollector';

// Tamil Consonants (மெய்)
const TAMIL_CONSONANTS = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];

export default function TamilConsonantsReadingPracticePage() {
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ta-IN'; // Tamil language
      recognition.maxAlternatives = 5;

      let lastSpeechTime = 0;
      let silenceTimer: any = null;
      let detectedTranscript = '';

      recognition.onresult = (event: any) => {
        lastSpeechTime = Date.now();

        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];

          for (let j = 0; j < Math.min(result.length, 5); j++) {
            const transcript = result[j].transcript.trim();

            if (transcript) {
              console.log(`Tamil Consonant Alternative ${j + 1}:`, transcript, 'Confidence:', result[j].confidence);

              if (result.isFinal || result[j].confidence > 0.3) {
                detectedTranscript = transcript;
                setCurrentTranscript(transcript);

                silenceTimer = setTimeout(() => {
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
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
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

  // Initialize data collection session for Tamil consonants
  useEffect(() => {
    const initDataCollection = () => {
      // Update the pronunciation data collector to handle Tamil consonants
      const id = pronunciationDataCollector.initSession('tamil-consonants' as any);
      setSessionId(id);
      setIsDataCollectionMode(true);
      updateCollectionStats();
    };

    initDataCollection();
  }, []);

  // Update collection statistics
  const updateCollectionStats = () => {
    const stats = pronunciationDataCollector.getSessionStats();
    setCollectionStats(stats);
  };

  // Find next Tamil consonant that needs data collection
  const findNextConsonantNeedingCollection = (): number => {
    for (let i = 0; i < TAMIL_CONSONANTS.length; i++) {
      if (pronunciationDataCollector.needsCollection(TAMIL_CONSONANTS[i])) {
        return i;
      }
    }
    return -1; // All consonants have been collected
  };

  const currentConsonant = TAMIL_CONSONANTS[currentIndex];

  const handleSubmit = async () => {
    if (!hasRecorded) return;

    // Tamil consonant matching
    const isCorrect = checkTamilConsonantMatch(currentTranscript, currentConsonant);

    // Collect pronunciation data if in data collection mode
    if (isDataCollectionMode && isRecordingAudio) {
      try {
        const audioData = await pronunciationDataCollector.stopRecording();
        const expectedPronunciation = getTamilConsonantPronunciation(currentConsonant);
        
        const stored = await pronunciationDataCollector.storePronunciationData(
          currentConsonant,
          expectedPronunciation,
          currentTranscript,
          audioData
        );

        if (stored) {
          setFeedback('Tamil consonant data collected successfully! Thank you for contributing.');
          updateCollectionStats();
          
          // Send to API
          try {
            const response = await fetch('/api/pronunciation-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                character: currentConsonant,
                expectedPronunciation,
                transcript: currentTranscript,
                userAudio: audioData,
                sessionId,
                attemptNumber: pronunciationDataCollector.getCurrentAttemptNumber(currentConsonant),
                practiceType: 'tamil-consonants'
              })
            });
            
            if (response.ok) {
              console.log('Tamil consonant pronunciation data sent to server successfully');
            }
          } catch (apiError) {
            console.error('Error sending Tamil consonant data to API:', apiError);
          }
        } else {
          setFeedback('Data already collected for this Tamil consonant (2 times)');
        }
        
        setIsRecordingAudio(false);
      } catch (error) {
        console.error('Error collecting Tamil consonant pronunciation data:', error);
        setFeedback('Error collecting data. Please try again.');
        setIsRecordingAudio(false);
      }
    } else {
      // Normal practice mode
      if (isCorrect) {
        setScore(score + 1);
        setFeedback('Perfect! You said it correctly!');
        setShowCelebration(true);

        setTimeout(() => {
          setShowCelebration(false);
          if (currentIndex < TAMIL_CONSONANTS.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFeedback('');
            setHasRecorded(false);
            setCurrentTranscript('');
          }
        }, 2500);
      } else {
        setFeedback(`Try again! Say the Tamil consonant "${currentConsonant}"`);
      }
    }

    // Auto-advance to next consonant that needs collection
    if (isDataCollectionMode) {
      setTimeout(() => {
        const nextIndex = findNextConsonantNeedingCollection();
        if (nextIndex !== -1) {
          setCurrentIndex(nextIndex);
          setFeedback('');
          setHasRecorded(false);
          setCurrentTranscript('');
        }
      }, 2000);
    }
  };

  // Tamil consonant pronunciation matching function
  const checkTamilConsonantMatch = (transcript: string, expectedConsonant: string): boolean => {
    const cleanTranscript = transcript.trim();

    console.log('=== TAMIL CONSONANT MATCHING DEBUG ===');
    console.log('User said:', `"${cleanTranscript}"`);
    console.log('Expected Tamil consonant:', expectedConsonant);

    // Direct match with the Tamil consonant
    if (cleanTranscript === expectedConsonant) {
      console.log('✅ Match found: Exact Tamil consonant match');
      return true;
    }

    // Match with romanized pronunciation
    const tamilConsonantPronunciationMap: { [key: string]: string[] } = {
      'க': ['ka', 'க'],
      'ங': ['nga', 'ங'],
      'ச': ['cha', 'sa', 'ச'],
      'ஞ': ['nya', 'nja', 'ஞ'],
      'ட': ['ta', 'da', 'ட'],
      'ண': ['na', 'ண'],
      'த': ['tha', 'th', 'த'],
      'ந': ['na', 'ந'],
      'ப': ['pa', 'ba', 'ப'],
      'ம': ['ma', 'ம'],
      'ய': ['ya', 'ய'],
      'ர': ['ra', 'ர'],
      'ல': ['la', 'ல'],
      'வ': ['va', 'wa', 'வ'],
      'ழ': ['zha', 'la', 'ழ'],
      'ள': ['la', 'ள'],
      'ற': ['ra', 'ற'],
      'ன': ['na', 'ன']
    };

    const validPronunciations = tamilConsonantPronunciationMap[expectedConsonant] || [];
    
    const pronunciationMatched = validPronunciations.some(pronunciation => {
      if (cleanTranscript.toLowerCase() === pronunciation.toLowerCase()) {
        console.log(`✅ Tamil consonant match found: pronunciation match with "${pronunciation}"`);
        return true;
      }
      return false;
    });

    if (pronunciationMatched) {
      return true;
    }

    console.log('❌ No Tamil consonant match found.');
    console.log('Valid options:', validPronunciations);
    return false;
  };

  const startListening = async () => {
    if (recognitionRef.current && !isListening && !hasRecorded) {
      setFeedback('');
      setCurrentTranscript('');
      setIsListening(true);

      // Start audio recording for data collection
      if (isDataCollectionMode && pronunciationDataCollector.needsCollection(currentConsonant)) {
        try {
          await pronunciationDataCollector.startRecording();
          setIsRecordingAudio(true);
          setFeedback('Recording Tamil consonant pronunciation for data collection...');
        } catch (error) {
          console.error('Error starting Tamil consonant audio recording:', error);
          setFeedback('Error starting audio recording. Please try again.');
        }
      }

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting Tamil consonant recognition:', error);
        setIsListening(false);
        setFeedback('Error starting microphone. Please try again.');
      }
    }
  };

  const playTamilConsonantSound = () => {
    // Use browser's speech synthesis to pronounce the Tamil consonant
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentConsonant);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      utterance.lang = 'ta-IN'; // Tamil language
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper function to get Tamil consonant pronunciation
  const getTamilConsonantPronunciation = (consonant: string): string => {
    const tamilConsonantPronunciationMap: { [key: string]: string } = {
      'க': 'ka',
      'ங': 'nga',
      'ச': 'cha',
      'ஞ': 'nya',
      'ட': 'ta',
      'ண': 'na',
      'த': 'tha',
      'ந': 'na',
      'ப': 'pa',
      'ம': 'ma',
      'ய': 'ya',
      'ர': 'ra',
      'ல': 'la',
      'வ': 'va',
      'ழ': 'zha',
      'ள': 'la',
      'ற': 'ra',
      'ன': 'na'
    };
    return tamilConsonantPronunciationMap[consonant] || consonant;
  };

  const nextConsonant = () => {
    if (currentIndex < TAMIL_CONSONANTS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback('');
      setHasRecorded(false);
      setCurrentTranscript('');
    }
  };

  const previousConsonant = () => {
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
      <main className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-300 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link href="/choose-language?section=reading&lang=ta">
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
    <main className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-300 p-8 relative">
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
                சிறப்பு! 🎉
              </h2>
              <p className="text-3xl text-yellow-300 font-semibold drop-shadow">
                Perfect Tamil Consonant Pronunciation!
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
          <Link href="/choose-language?section=reading&lang=ta">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Back
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Tamil Speaking Practice - மெய் (Consonants)</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">Current Tamil Consonant</p>
              <p className="text-8xl font-bold text-emerald-600">{currentConsonant}</p>
              {isDataCollectionMode && (
                <p className="text-sm text-orange-600 font-semibold">
                  Attempt: {pronunciationDataCollector.getCurrentAttemptNumber(currentConsonant)}/2
                </p>
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">
                {isDataCollectionMode ? 'Tamil Consonant Data Collection' : 'Progress'}
              </p>
              {isDataCollectionMode && collectionStats ? (
                <div>
                  <p className="text-4xl font-bold text-purple-600">
                    {collectionStats.totalCollected} / {collectionStats.targetCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {collectionStats.progress}% Complete
                  </p>
                </div>
              ) : (
                <p className="text-4xl font-bold text-purple-600">
                  {currentIndex + 1} / {TAMIL_CONSONANTS.length}
                </p>
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-gray-600 text-lg mb-1">
                {isDataCollectionMode ? 'Collection Status' : 'Correct Attempts'}
              </p>
              {isDataCollectionMode ? (
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {pronunciationDataCollector.needsCollection(currentConsonant) ? 'NEEDED' : 'COMPLETE'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {pronunciationDataCollector.needsCollection(currentConsonant) ? 
                      `${2 - pronunciationDataCollector.getCurrentAttemptNumber(currentConsonant) + 1} more needed` : 
                      'All recordings done'
                    }
                  </p>
                </div>
              ) : (
                <p className="text-6xl font-bold text-blue-600">{score}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isDataCollectionMode ? 'Tamil Consonant Data Collection for:' : 'Practice saying:'} <span className="text-emerald-600">{currentConsonant}</span>
            </h2>
            <p className="text-gray-600">
              {isDataCollectionMode ? 
                'Help us improve Tamil speech recognition by recording your consonant pronunciation' : 
                'Click \'Listen\' to hear, then record and submit'
              }
            </p>
            <p className="text-sm text-orange-600 font-semibold mt-2">
              💡 Tip: Say the Tamil consonant "{currentConsonant}" (romanized: "{getTamilConsonantPronunciation(currentConsonant)}")
            </p>
            {isDataCollectionMode && pronunciationDataCollector.needsCollection(currentConsonant) && (
              <p className="text-sm text-blue-600 font-semibold mt-2">
                🎤 Recording attempt {pronunciationDataCollector.getCurrentAttemptNumber(currentConsonant)} of 2 for Tamil consonant {currentConsonant}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={playTamilConsonantSound}
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
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
              } text-white rounded-xl font-bold text-2xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-75`}
            >
              <span className="text-4xl">🎤</span>
              <span>
                {isListening ? 'Listening...' : hasRecorded ? 'Recorded!' : 'Start Recording'}
              </span>
            </button>
          </div>

          {currentTranscript && (
            <div className="text-center mb-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-2 font-semibold">You said:</p>
                <p className="text-4xl font-bold text-emerald-600">{currentTranscript}</p>
              </div>
              <div className="pt-4 border-t border-emerald-200">
                <p className="text-gray-500 text-xs mb-1">Expected pronunciation:</p>
                <p className="text-lg font-semibold text-purple-600">
                  &quot;{currentConsonant}&quot; (romanized: &quot;{getTamilConsonantPronunciation(currentConsonant)}&quot;)
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleSubmit}
              disabled={!hasRecorded}
              className="px-12 py-4 bg-emerald-500 text-white rounded-lg font-bold text-2xl hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              Submit
            </button>
            <button
              onClick={handleRetry}
              disabled={isListening}
              className="px-12 py-4 bg-red-500 text-white rounded-lg font-bold text-2xl hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              🔄 Retry
            </button>
          </div>

          {feedback && (
            <div className={`text-center p-4 rounded-lg mb-6 ${
              feedback.includes('Perfect') || feedback.includes('correct') || feedback.includes('சிறப்பு')
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
              onClick={previousConsonant}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={nextConsonant}
              disabled={currentIndex === TAMIL_CONSONANTS.length - 1}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-bold text-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}