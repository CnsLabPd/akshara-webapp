// app/reading/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CharacterCard from "@/components/CharacterCard";

interface UserData {
  userSub: string;
  email: string;
  fullName?: string;
}

interface SelectedStudent {
  studentId: string;
  studentName: string;
}

interface ProgressData {
  [character: string]: number;
}

function ReadingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData>({});
  const [selectedType, setSelectedType] = useState<string>("english-alphabets");
  const [showInstructions, setShowInstructions] = useState(false);

  const characterSets = {
    "english-alphabets": "abcdefghijklmnopqrstuvwxyz".split(""),
    "english-numbers": "0123456789".split(""),
  };

  const typeDisplayNames = {
    "english-alphabets": "English Alphabets (A-Z)",
    "english-numbers": "English Numbers (0-9)",
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("aksharaUser");
        if (!savedUser) {
          router.push("/login");
          return;
        }
        const userData = JSON.parse(savedUser) as UserData;
        setUser(userData);

        const savedStudent = localStorage.getItem("selectedStudent");
        if (!savedStudent) {
          router.push("/students");
          return;
        }
        const studentData = JSON.parse(savedStudent) as SelectedStudent;
        setSelectedStudent(studentData);
      } catch (error) {
        console.error("Error reading data:", error);
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const type = searchParams.get("type") || "english-alphabets";
    setSelectedType(type);
  }, [searchParams]);

  const fetchProgress = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/recordings/progress?studentId=${selectedStudent.studentId}&type=${selectedType}&t=${Date.now()}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress || {});
      } else {
        setProgress({});
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      setProgress({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent, selectedType]);

  useEffect(() => {
    if (user && selectedStudent) {
      fetchProgress();
    }
  }, [user, selectedStudent, selectedType, fetchProgress]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && selectedStudent) {
        fetchProgress();
      }
    };

    const handleFocus = () => {
      if (user && selectedStudent) {
        fetchProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, selectedStudent, fetchProgress]);

  const handleCharacterClick = (character: string) => {
    const routes = {
      "english-alphabets": `/reading/practice?char=${character}&lang=en`,
      "english-numbers": `/reading/practice/numbers?char=${character}&lang=en`,
    };

    const route = routes[selectedType as keyof typeof routes];
    if (route) {
      router.push(route);
    }
  };

  const handleBack = () => {
    router.push("/reading/dashboard");
  };

  if (!user || !selectedStudent) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              {typeDisplayNames[selectedType as keyof typeof typeDisplayNames]} – Recording
            </h1>
            <p className="text-white text-lg mt-2 drop-shadow">
              Student: {selectedStudent.studentName}
            </p>
          </div>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            💡 Instructions
          </button>
        </div>

        {showInstructions && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInstructions(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recording Instructions</h2>
                <button onClick={() => setShowInstructions(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">How to Record:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">•</span>
                  <span>Click on any character to start recording</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">•</span>
                  <span>Each character needs exactly 2 recordings to complete</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">•</span>
                  <span>
                    <strong className="text-green-600">Green cards</strong> are completed (2/2 recordings)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">•</span>
                  <span>
                    <strong className="text-orange-600">Orange cards</strong> are in progress (1/2 recordings)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-lg">•</span>
                  <span>
                    <strong className="text-blue-600">Blue cards</strong> are not started (0/2 recordings)
                  </span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Tip:</strong> You can click on any character directly - no need to complete them in order!
                </p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-lg font-medium text-gray-700">Loading...</span>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {typeDisplayNames[selectedType as keyof typeof typeDisplayNames]}
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {characterSets[selectedType as keyof typeof characterSets].map((character) => {
                const attempts = progress[character.toLowerCase()] || 0;
                return (
                  <CharacterCard
                    key={character}
                    character={character}
                    attempts={attempts}
                    onClick={() => handleCharacterClick(character)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={null}>
      <ReadingInner />
    </Suspense>
  );
}
