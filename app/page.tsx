'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
          style={{
            left: `${mousePosition.x / 50}px`,
            top: `${mousePosition.y / 50}px`,
            transition: 'all 0.3s ease-out'
          }}
        ></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Neurogati Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 group cursor-pointer">
        <img
          src="/neurogati.png"
          alt="Neurogati"
          className="w-16 h-16 md:w-20 md:h-20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
        />
        <span className="text-white font-bold text-xl md:text-2xl transition-all duration-300 group-hover:text-cyan-400">
          Neurogati
        </span>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-screen px-4 py-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Hero Section */}
        <div className="text-center max-w-6xl">
          <div className="mb-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-3">
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent animate-shimmer">
                AksharA
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 animate-fade-in-up">
              AI-Powered Language Learning
            </h2>
          </div>

          {/* Assistive Technology Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full px-5 py-2 mb-4 animate-fade-in-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.3s'}}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-sm">Assistive Technology Platform</span>
            <div className="text-lg">🤖</div>
          </div>

          {/* Description */}
          <p className="text-base md:text-lg text-white/90 mb-2 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            Revolutionizing how children learn languages through cutting-edge AI
          </p>
          <p className="text-sm md:text-base text-cyan-200/80 mb-6 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
            Interactive handwriting recognition • Real-time feedback • Personalized learning paths
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in-up" style={{animationDelay: '1.2s'}}>
            <div
              className="group relative bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-md border border-pink-400/30 rounded-xl p-4 hover:from-pink-500/20 hover:to-rose-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 cursor-pointer"
              onMouseEnter={() => setHoveredCard(0)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`text-3xl mb-2 transition-transform duration-300 ${hoveredCard === 0 ? 'scale-125 rotate-12' : ''}`}>🧠</div>
              <h3 className="text-white font-bold text-base mb-1">AI Recognition</h3>
              <p className="text-white/80 text-xs">Advanced neural networks analyze handwriting in real-time</p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/0 to-rose-500/0 group-hover:from-pink-500/10 group-hover:to-rose-500/10 transition-all duration-300"></div>
            </div>
            <div
              className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md border border-amber-400/30 rounded-xl p-4 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer"
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`text-3xl mb-2 transition-transform duration-300 ${hoveredCard === 1 ? 'scale-125 rotate-12' : ''}`}>⚡</div>
              <h3 className="text-white font-bold text-base mb-1">Instant Feedback</h3>
              <p className="text-white/80 text-xs">Get immediate corrections and guidance</p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>
            </div>
            <div
              className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-cyan-400/30 rounded-xl p-4 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer"
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`text-3xl mb-2 transition-transform duration-300 ${hoveredCard === 2 ? 'scale-125 rotate-12' : ''}`}>🎯</div>
              <h3 className="text-white font-bold text-base mb-1">Adaptive Learning</h3>
              <p className="text-white/80 text-xs">Personalized curriculum that adapts to each child</p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-6">
            <Link href="/signup">
              <button className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-cyan-500/50 animate-fade-in-up" style={{animationDelay: '1.5s'}}>
                <span className="relative z-10 flex items-center gap-3">
                  Let's Learn! 🚀
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              </button>
            </Link>
          </div>

          {/* Animated Learning Preview - Compact */}
          <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 max-w-2xl mx-auto animate-fade-in-up shadow-2xl" style={{animationDelay: '1.8s'}}>
            <h3 className="text-white font-bold text-lg mb-3 text-center">Experience the Magic ✨</h3>
            <div className="grid grid-cols-4 gap-3">
              {['A', 'B', 'C', 'D'].map((letter, index) => (
                <div
                  key={letter}
                  className="group relative bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/30 rounded-xl p-3 text-center transform hover:scale-110 transition-all duration-300 animate-bounce-in cursor-pointer"
                  style={{animationDelay: `${2 + index * 0.2}s`}}
                >
                  <div className="text-4xl font-bold text-white transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                    {letter}
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mt-2 group-hover:h-1.5 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/0 to-blue-400/0 group-hover:from-cyan-400/20 group-hover:to-blue-400/20 transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        .animate-shimmer {
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
