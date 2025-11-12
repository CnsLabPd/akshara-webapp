'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [floatingLetters, setFloatingLetters] = useState<Array<{letter: string, left: string, top: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    setIsVisible(true);
    // Generate floating letters on client side to avoid hydration mismatch
    const letters = [...Array(20)].map((_, i) => ({
      letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${i * 0.5}s`,
      duration: `${4 + Math.random() * 3}s`
    }));
    setFloatingLetters(letters);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Letters Animation */}
        {floatingLetters.map((letterData, i) => (
          <div
            key={i}
            className="absolute text-white/10 text-6xl font-bold animate-float"
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
        
        {/* Geometric Shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-cyan-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-yellow-400/20 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-400/20 rounded-lg animate-bounce-slow"></div>
        <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-pink-400/20 rounded-full animate-pulse"></div>
      </div>

      {/* Neurogati Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <img 
          src="/neurogati.png" 
          alt="Neurogati" 
          className="w-16 h-16 md:w-20 md:h-20 opacity-90 hover:opacity-100 transition-opacity"
        />
        <span className="text-white font-bold text-xl md:text-2xl opacity-90 hover:opacity-100 transition-opacity">
          Neurogati
        </span>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6 animate-gradient-x">
              AksharA
            </h1>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                AI-Powered Language Learning
              </h2>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-pink-600 rounded-lg blur opacity-25"></div>
            </div>
          </div>

          {/* Assistive Technology Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-8 py-4 mb-8 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-lg">Assistive Technology Platform</span>
            <div className="text-2xl">🤖</div>
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            Revolutionizing how children learn languages through cutting-edge AI
          </p>
          <p className="text-lg md:text-xl text-white/80 mb-12 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
            Interactive handwriting recognition • Real-time feedback • Personalized learning paths
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-up" style={{animationDelay: '1.2s'}}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="text-white font-bold text-lg mb-2">AI Recognition</h3>
              <p className="text-white/80 text-sm">Advanced neural networks analyze handwriting in real-time</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-white font-bold text-lg mb-2">Instant Feedback</h3>
              <p className="text-white/80 text-sm">Get immediate corrections and guidance</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-white font-bold text-lg mb-2">Adaptive Learning</h3>
              <p className="text-white/80 text-sm">Personalized curriculum that adapts to each child</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/choose-language">
            <button className="group relative bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold py-6 px-12 rounded-full text-2xl hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 shadow-2xl animate-fade-in-up" style={{animationDelay: '1.5s'}}>
              <span className="relative z-10">Let's Learn! 🚀</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </button>
          </Link>
        </div>

        {/* Animated Learning Preview */}
        <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-4xl w-full animate-fade-in-up" style={{animationDelay: '1.8s'}}>
          <h3 className="text-white font-bold text-2xl mb-6 text-center">Experience the Magic ✨</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['A', 'B', 'C', 'D'].map((letter, index) => (
              <div 
                key={letter}
                className="bg-white/20 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 animate-bounce-in"
                style={{animationDelay: `${2 + index * 0.2}s`}}
              >
                <div className="text-6xl font-bold text-white mb-2 animate-letter-glow">
                  {letter}
                </div>
                <div className="w-full h-1 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(10deg); }
          66% { transform: translateY(-10px) rotate(-5deg); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes letter-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
          50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(139, 233, 253, 0.5); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; opacity: 0; }
        .animate-letter-glow { animation: letter-glow 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
      `}</style>
    </main>
  );
}
