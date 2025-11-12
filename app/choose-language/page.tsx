'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇮🇳', description: 'Learn English alphabets and pronunciation' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', description: 'Coming Soon!', disabled: true },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', description: 'Coming Soon!', disabled: true },
];

export default function ChooseLanguage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubsection, setSelectedSubsection] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [floatingLetters, setFloatingLetters] = useState<Array<{letter: string, left: string, top: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    setIsVisible(true);
    // Generate floating letters on client side to avoid hydration mismatch
    const letters = [...Array(15)].map((_, i) => ({
      letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.3}s`,
      duration: `${4 + Math.random() * 2}s`
    }));
    setFloatingLetters(letters);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Letters Animation */}
        {floatingLetters.map((letterData, i) => (
          <div
            key={i}
            className="absolute text-white/10 text-4xl font-bold animate-float"
            style={{
              left: letterData.left,
              top: letterData.top,
              animationDelay: letterData.delay,
              animationDuration: letterData.duration,
            }}
          >
            {letterData.letter}
          </div>
        ))}
      </div>

      {/* Neurogati Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <Link href="/">
          <img 
            src="/neurogati.png" 
            alt="Neurogati" 
            className="w-16 h-16 md:w-20 md:h-20 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          />
        </Link>
        <span className="text-white font-bold text-xl md:text-2xl opacity-90 hover:opacity-100 transition-opacity">
          Neurogati
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
        {/* Back Button */}
        <Link href="/">
          <button className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30">
            ← Back to Home
          </button>
        </Link>

        {!selectedLanguage ? (
          /* Language Selection */
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in-up">
                Choose Your Language
              </h1>
              <p className="text-2xl text-white/90 drop-shadow animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                Select a language to start learning
              </p>
            </div>

            <div className="max-w-lg mx-auto animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-2xl">
                <label className="block text-white font-bold text-xl mb-4 text-center">
                  🌍 Select Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => e.target.value && setSelectedLanguage(e.target.value)}
                  className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-bold text-xl focus:border-white/50 focus:outline-none transition-all duration-300 cursor-pointer"
                >
                  <option value="" className="bg-purple-900 text-white">Choose a language...</option>
                  {LANGUAGES.map((lang) => (
                    <option 
                      key={lang.code} 
                      value={lang.disabled ? '' : lang.code}
                      disabled={lang.disabled}
                      className="bg-purple-900 text-white py-2"
                    >
                      {lang.flag} {lang.name} {lang.disabled ? '(Coming Soon)' : ''}
                    </option>
                  ))}
                </select>
                
                {selectedLanguage && (
                  <div className="mt-6 text-center">
                    <div className="text-white/90 mb-4">
                      Selected: {LANGUAGES.find(l => l.code === selectedLanguage)?.flag} {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                    </div>
                    <button
                      onClick={() => {/* Language is already selected, proceed to sections */}}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-lg transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      Continue →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !selectedSection ? (
          /* Section Selection (Writing or Speaking) */
          <div className="animate-fade-in-up">
            <button
              onClick={() => setSelectedLanguage('')}
              className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              ← Back to Languages
            </button>

            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Choose a Section
              </h1>
              <p className="text-2xl text-white/90 drop-shadow">
                What would you like to practice?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Writing Section */}
              <div
                onClick={() => setSelectedSection('writing')}
                className="group p-10 bg-gradient-to-br from-cyan-500/30 to-blue-600/40 backdrop-blur-sm border-2 border-cyan-300/50 text-white rounded-3xl hover:from-cyan-400/40 hover:to-blue-500/50 hover:border-cyan-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-cyan-500/25"
              >
                <div className="text-8xl mb-6 text-center group-hover:animate-bounce filter drop-shadow-lg">✍️</div>
                <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">Writing</h3>
                <ul className="text-lg space-y-3">
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></span>
                    Practice writing letters
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></span>
                    AI handwriting recognition
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></span>
                    Instant feedback
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></span>
                    Track your progress
                  </li>
                </ul>
              </div>

              {/* Speaking Section */}
              <div
                onClick={() => setSelectedSection('reading')}
                className="group p-10 bg-gradient-to-br from-pink-500/30 to-rose-600/40 backdrop-blur-sm border-2 border-pink-300/50 text-white rounded-3xl hover:from-pink-400/40 hover:to-rose-500/50 hover:border-pink-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-pink-500/25"
              >
                <div className="text-8xl mb-6 text-center group-hover:animate-bounce filter drop-shadow-lg">🎤</div>
                <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-pink-200 to-rose-200 bg-clip-text text-transparent">Reading</h3>
                <ul className="text-lg space-y-3">
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse"></span>
                    Practice pronunciation
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse"></span>
                    Voice recognition
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse"></span>
                    Listen and repeat
                  </li>
                  <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse"></span>
                    Improve reading skills
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (selectedSection === 'writing' || selectedSection === 'reading') && !selectedSubsection ? (
          /* Subsection Selection for Writing or Speaking */
          <div className="animate-fade-in-up">
            <button
              onClick={() => setSelectedSection('')}
              className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              ← Back to Sections
            </button>

            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Choose What to Practice
              </h1>
              <p className="text-2xl text-white/90 drop-shadow">
                {selectedSection === 'writing' ? 'Writing Practice Options' : 'Speaking Practice Options'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Writing: 3 options, Speaking: 3 options */}
              {selectedSection === 'writing' ? (
                <>
                  {/* Capital Alphabets */}
                  <div
                    onClick={() => setSelectedSubsection('capital')}
                    className="group p-8 bg-gradient-to-br from-violet-600/40 to-purple-700/50 backdrop-blur-sm border-2 border-violet-300/50 text-white rounded-3xl hover:from-violet-500/50 hover:to-purple-600/60 hover:border-violet-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-violet-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-pulse bg-gradient-to-r from-violet-200 to-purple-200 bg-clip-text text-transparent filter drop-shadow-lg">ABC</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-violet-100 to-purple-100 bg-clip-text text-transparent">Capital Alphabets</h3>
                    <p className="text-center text-violet-100">A to Z</p>
                  </div>

                  {/* Small Alphabets */}
                  <div
                    onClick={() => setSelectedSubsection('small')}
                    className="group p-8 bg-gradient-to-br from-emerald-600/40 to-green-700/50 backdrop-blur-sm border-2 border-emerald-300/50 text-white rounded-3xl hover:from-emerald-500/50 hover:to-green-600/60 hover:border-emerald-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-emerald-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-pulse bg-gradient-to-r from-emerald-200 to-green-200 bg-clip-text text-transparent filter drop-shadow-lg">abc</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-emerald-100 to-green-100 bg-clip-text text-transparent">Small Alphabets</h3>
                    <p className="text-center text-emerald-100">a to z</p>
                  </div>

                  {/* Numbers */}
                  <div
                    onClick={() => setSelectedSubsection('numbers')}
                    className="group p-8 bg-gradient-to-br from-amber-600/40 to-orange-700/50 backdrop-blur-sm border-2 border-amber-300/50 text-white rounded-3xl hover:from-amber-500/50 hover:to-orange-600/60 hover:border-amber-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-amber-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-pulse bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent filter drop-shadow-lg">123</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-amber-100 to-orange-100 bg-clip-text text-transparent">Numbers</h3>
                    <p className="text-center text-amber-100">0 to 9</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Learn Alphabets for Speaking */}
                  <div
                    onClick={() => setSelectedSubsection('learn')}
                    className="group p-8 bg-gradient-to-br from-indigo-600/40 to-blue-700/50 backdrop-blur-sm border-2 border-indigo-300/50 text-white rounded-3xl hover:from-indigo-500/50 hover:to-blue-600/60 hover:border-indigo-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-indigo-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-bounce filter drop-shadow-lg">🎓</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-indigo-100 to-blue-100 bg-clip-text text-transparent">Learn Alphabets</h3>
                    <p className="text-center text-indigo-100">Interactive Learning</p>
                  </div>

                  {/* Alphabets for Speaking */}
                  <div
                    onClick={() => setSelectedSubsection('alphabets')}
                    className="group p-8 bg-gradient-to-br from-sky-600/40 to-cyan-700/50 backdrop-blur-sm border-2 border-sky-300/50 text-white rounded-3xl hover:from-sky-500/50 hover:to-cyan-600/60 hover:border-sky-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-sky-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-pulse bg-gradient-to-r from-sky-200 to-cyan-200 bg-clip-text text-transparent filter drop-shadow-lg">ABC</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-sky-100 to-cyan-100 bg-clip-text text-transparent">Alphabets</h3>
                    <p className="text-center text-sky-100">A to Z</p>
                  </div>

                  {/* Numbers for Speaking */}
                  <div
                    onClick={() => setSelectedSubsection('numbers')}
                    className="group p-8 bg-gradient-to-br from-rose-600/40 to-pink-700/50 backdrop-blur-sm border-2 border-rose-300/50 text-white rounded-3xl hover:from-rose-500/50 hover:to-pink-600/60 hover:border-rose-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-rose-500/30"
                  >
                    <div className="text-7xl mb-4 text-center font-bold group-hover:animate-pulse bg-gradient-to-r from-rose-200 to-pink-200 bg-clip-text text-transparent filter drop-shadow-lg">123</div>
                    <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-rose-100 to-pink-100 bg-clip-text text-transparent">Numbers</h3>
                    <p className="text-center text-rose-100">0 to 9</p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Mode Selection (Practice or Test) */
          <div className="animate-fade-in-up">
            <button
              onClick={() => {
                if (selectedSection === 'writing' || selectedSection === 'reading') {
                  setSelectedSubsection('');
                } else {
                  setSelectedSection('');
                }
              }}
              className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              ← Back
            </button>

            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Choose a Mode
              </h1>
              <p className="text-2xl text-white/90 drop-shadow">
                How would you like to learn?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Practice Mode */}
              <Link href={
                selectedSection === 'writing'
                  ? selectedSubsection === 'capital'
                    ? '/practice'
                    : selectedSubsection === 'small'
                    ? '/practice/small'
                    : '/practice/numbers'
                  : selectedSubsection === 'learn'
                    ? '/reading/learn/practice'
                    : selectedSubsection === 'alphabets'
                    ? '/reading/practice'
                    : '/reading/practice/numbers'
              }>
                <div className="group p-10 bg-gradient-to-br from-emerald-600/40 to-green-700/50 backdrop-blur-sm border-2 border-emerald-300/50 text-white rounded-3xl hover:from-emerald-500/50 hover:to-green-600/60 hover:border-emerald-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-emerald-500/30">
                  <div className="text-8xl mb-6 text-center group-hover:animate-bounce filter drop-shadow-lg">✏️</div>
                  <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-100 to-green-100 bg-clip-text text-transparent">Practice</h3>
                  <ul className="text-lg space-y-3">
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse"></span>
                      Learn at your own pace
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse"></span>
                      Instant feedback
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse"></span>
                      No pressure
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse"></span>
                      Repeat as many times
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Test Mode */}
              <Link href={
                selectedSection === 'writing'
                  ? selectedSubsection === 'capital'
                    ? '/test'
                    : selectedSubsection === 'small'
                    ? '/test/small'
                    : '/test/numbers'
                  : selectedSubsection === 'learn'
                    ? '/reading/learn/test'
                    : selectedSubsection === 'alphabets'
                    ? '/reading/test'
                    : '/reading/test/numbers'
              }>
                <div className="group p-10 bg-gradient-to-br from-orange-600/40 to-red-700/50 backdrop-blur-sm border-2 border-orange-300/50 text-white rounded-3xl hover:from-orange-500/50 hover:to-red-600/60 hover:border-orange-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-orange-500/30">
                  <div className="text-8xl mb-6 text-center group-hover:animate-bounce filter drop-shadow-lg">📝</div>
                  <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-orange-100 to-red-100 bg-clip-text text-transparent">Test</h3>
                  <ul className="text-lg space-y-3">
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></span>
                      Test your knowledge
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></span>
                      Single attempt per letter
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></span>
                      Score tracking
                    </li>
                    <li className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300">
                      <span className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></span>
                      Corrected tests for mistakes
                    </li>
                  </ul>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 animate-fade-in-up" style={{animationDelay: '1.2s'}}>
          <h3 className="text-3xl font-bold text-white mb-4">About AksharA:</h3>
          <p className="text-white/90 text-lg leading-relaxed">
            AksharA uses cutting-edge AI technology to provide personalized language learning experiences. 
            Our handwriting recognition system gives instant feedback to help children master letter formation 
            and pronunciation through interactive, engaging activities.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(5deg); }
          66% { transform: translateY(-8px) rotate(-3deg); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; opacity: 0; }
      `}</style>
    </main>
  );
}