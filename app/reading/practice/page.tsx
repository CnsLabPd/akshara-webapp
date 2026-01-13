// app/reading/practice/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface UserData {
  userSub: string;
  email: string;
  fullName?: string;
}

interface SelectedStudent {
  studentId: string;
  studentName: string;
}

export default function ReadingPracticePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const currentLetter = ALPHABETS[currentIndex];

  useEffect(() => {
    const savedUser = localStorage.getItem('aksharaUser');
    if (!savedUser) {
      window.location.href = '/login';
      return;
    }
    setUser(JSON.parse(savedUser));

    const savedStudent = localStorage.getItem('selectedStudent');
    if (!savedStudent) {
      window.location.href = '/students';
      return;
    }
    setSelectedStudent(JSON.parse(savedStudent));

    const charParam = searchParams.get('char');
    if (charParam) {
      const charIndex = ALPHABETS.indexOf(charParam.toUpperCase());
      if (charIndex !== -1) {
        setCurrentIndex(charIndex);
      }
    }
  }, [searchParams]);

  const fetchAttempts = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/recordings/progress?studentId=${selectedStudent.studentId}&type=english-alphabets&t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const attempts = data.progress?.[currentLetter.toLowerCase()] || 0;
        setAttemptsUsed(attempts);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  }, [selectedStudent, currentLetter]);

  useEffect(() => {
    if (user && selectedStudent) {
      fetchAttempts();
    }
  }, [user, selectedStudent, currentIndex, fetchAttempts]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setErrorMessage('');
      setSuccessMessage('');
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitRecording = async () => {
    if (!audioBlob || !user || !selectedStudent) return;

    setUploadStatus('uploading');
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('teacherUserId', user.userSub);
    formData.append('teacherName', user.fullName || '');
    formData.append('studentId', selectedStudent.studentId);
    formData.append('studentName', selectedStudent.studentName);
    formData.append('character', currentLetter);
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 403) {
        setUploadStatus('error');
        setErrorMessage('Maximum attempts exceeded for this character.');
        return;
      }

      if (!response.ok) {
        setUploadStatus('error');
        setErrorMessage(data.error || 'Upload failed. Please try again.');
        return;
      }

      setUploadStatus('success');
      setSuccessMessage(`Recording ${data.attemptNumber}/2 uploaded successfully!`);
      setAttemptsUsed(data.attemptNumber);
      setAudioBlob(null);

      await fetchAttempts();

      if (data.attemptNumber === 2) {
        setTimeout(() => {
          handleNext();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentIndex < ALPHABETS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAudioBlob(null);
      setUploadStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAudioBlob(null);
      setUploadStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  if (!user || !selectedStudent) return null;

  const canRecord = attemptsUsed < 2;

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-300 to-purple-300 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/reading?type=english-alphabets">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              ← Back
            </button>
          </Link>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">Audio Data Recording - Alphabets</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg mb-2">Current Letter</p>
            <p className="text-9xl font-bold text-pink-600 mb-4">{currentLetter}</p>
            <p className="text-2xl font-semibold text-gray-700">
              Attempt {attemptsUsed} / 2
            </p>
          </div>

          {!canRecord && (
            <div className="bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg text-center mb-6">
              <p className="font-semibold">✓ Character completed (2/2 recordings)</p>
            </div>
          )}

          <div className="flex justify-center items-center gap-4 mb-6">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              ← Previous
            </button>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!canRecord}
              className={`px-10 py-6 rounded-xl font-bold text-2xl transition-all shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-[#F44336] text-white animate-pulse hover:bg-[#C62828]'
                  : 'bg-[#4CAF50] text-white hover:bg-[#45a049]'
              }`}
            >
              <span className="text-4xl">🎤</span>
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>

            <button
              onClick={submitRecording}
              disabled={!audioBlob || uploadStatus === 'uploading'}
              className="px-10 py-6 bg-[#2196F3] text-white rounded-xl font-bold text-2xl hover:bg-[#1976D2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Submit'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === ALPHABETS.length - 1}
              className="px-6 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              Next →
            </button>
          </div>

          {audioBlob && (
            <div className="text-center mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-semibold">✓ Recording ready to submit</p>
            </div>
          )}

          {successMessage && (
            <div className="text-center p-4 rounded-lg mb-6 bg-green-100 text-green-800 border border-green-300">
              <p className="text-xl font-semibold">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="text-center p-4 rounded-lg mb-6 bg-red-100 text-red-800 border border-red-300">
              <p className="text-xl font-semibold">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
