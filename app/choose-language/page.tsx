"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇮🇳", description: "Learn English alphabets and pronunciation" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", description: "Coming Soon!", disabled: true },
  { code: "ta", name: "Tamil", flag: "🇮🇳", description: "Coming Soon!", disabled: true },
];

// ✅ Move your existing page logic into an inner component
function ChooseLanguageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSubsection, setSelectedSubsection] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [floatingLetters, setFloatingLetters] = useState<
    Array<{ letter: string; left: string; top: string; delay: string; duration: string }>
  >([]);

  useEffect(() => {
    // Check authentication first
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("aksharaUser");
        if (!savedUser) {
          router.push("/login");
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/login");
        return;
      }
    };

    checkAuth();

    setIsVisible(true);

    // Generate floating letters on client side to avoid hydration mismatch
    const letters = [...Array(15)].map((_, i) => ({
      letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.3}s`,
      duration: `${4 + Math.random() * 2}s`,
    }));
    setFloatingLetters(letters);

    // Read URL parameters to set initial state
    const section = searchParams.get("section");
    const subsection = searchParams.get("subsection");
    const lang = searchParams.get("lang");

    if (section) {
      setSelectedLanguage(lang || "en");
      setSelectedSection(section);
      if (subsection) setSelectedSubsection(subsection);
    }
  }, [searchParams, router]);

  // Auto-redirect for reading sections only when subsection is selected
  useEffect(() => {
    if (selectedSection === "reading" && selectedSubsection && selectedLanguage) {
      const targetUrl =
        selectedSubsection === "alphabets"
          ? `/reading/practice?lang=${selectedLanguage}`
          : `/reading/practice/numbers?lang=${selectedLanguage}`;

      router.push(targetUrl);
    }
  }, [selectedSection, selectedSubsection, selectedLanguage, router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-lg font-medium text-gray-700">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  // If not authenticated, return null (will redirect)
  if (!isAuthenticated) return null;

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
        <Link href="/dashboard">
          <button className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30">
            ← Back to Dashboard
          </button>
        </Link>

        {!selectedLanguage ? (
          /* Language Selection */
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in-up">
                Choose Your Language
              </h1>
              <p className="text-2xl text-white/90 drop-shadow animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                Select a language to start learning
              </p>
            </div>

            <div className="max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-2xl">
                <label className="block text-white font-bold text-xl mb-4 text-center">🌍 Select Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => e.target.value && setSelectedLanguage(e.target.value)}
                  className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white font-bold text-xl focus:border-white/50 focus:outline-none transition-all duration-300 cursor-pointer"
                >
                  <option value="" className="bg-purple-900 text-white">
                    Choose a language...
                  </option>
                  {LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.disabled ? "" : lang.code}
                      disabled={lang.disabled}
                      className="bg-purple-900 text-white py-2"
                    >
                      {lang.flag} {lang.name} {lang.disabled ? "(Coming Soon)" : ""}
                    </option>
                  ))}
                </select>

                {selectedLanguage && (
                  <div className="mt-6 text-center">
                    <div className="text-white/90 mb-4">
                      Selected: {LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}{" "}
                      {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
                    </div>
                    <button
                      onClick={() => {
                        /* Language is already selected, proceed to sections */
                      }}
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
              onClick={() => setSelectedLanguage("")}
              className="mb-8 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              ← Back to Languages
            </button>

            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Choose a Section</h1>
              <p className="text-2xl text-white/90 drop-shadow">What would you like to practice?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Writing Section - Disabled/Premium */}
              <div className="group p-10 bg-gradient-to-br from-gray-500/30 to-gray-600/40 backdrop-blur-sm border-2 border-gray-300/50 text-white rounded-3xl shadow-2xl cursor-not-allowed relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  🚀 PREMIUM
                </div>

                <div className="text-8xl mb-6 text-center filter drop-shadow-lg opacity-60">✍️</div>
                <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Writing
                </h3>
                <ul className="text-lg space-y-3 opacity-70">
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></span>
                    Practice writing letters
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></span>
                    AI handwriting recognition
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></span>
                    Instant feedback
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></span>
                    Track your progress
                  </li>
                </ul>

                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <div className="text-2xl font-bold text-yellow-300 mb-2">Coming Soon!</div>
                    <div className="text-sm text-gray-200">Premium Feature</div>
                  </div>
                </div>
              </div>

              {/* Speaking Section */}
              <div
                onClick={() => setSelectedSection("reading")}
                className="group p-10 bg-gradient-to-br from-pink-500/30 to-rose-600/40 backdrop-blur-sm border-2 border-pink-300/50 text-white rounded-3xl hover:from-pink-400/40 hover:to-rose-500/50 hover:border-pink-200/70 transition-all duration-300 transform hover:scale-105 shadow-2xl cursor-pointer hover:shadow-pink-500/25"
              >
                <div className="text-8xl mb-6 text-center group-hover:animate-bounce filter drop-shadow-lg">🎤</div>
                <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-pink-200 to-rose-200 bg-clip-text text-transparent">
                  Reading
                </h3>
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
        ) : null}

        {/* Info Section */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: "1.2s" }}>
          <h3 className="text-3xl font-bold text-white mb-4">About AksharA:</h3>
          <p className="text-white/90 text-lg leading-relaxed">
            AksharA uses cutting-edge AI technology to provide personalized language learning experiences. Our handwriting
            recognition system gives instant feedback to help children master letter formation and pronunciation through
            interactive, engaging activities.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-15px) rotate(5deg);
          }
          66% {
            transform: translateY(-8px) rotate(-3deg);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
  );
}

// ✅ Default export wraps searchParams usage in Suspense (fixes Vercel build)
export default function ChooseLanguagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ChooseLanguageInner />
    </Suspense>
  );
}
