'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  studentId: string;
  studentName: string;
  class?: string;
  section?: string;
  rollNo?: string;
  createdAt: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [teacherUserId, setTeacherUserId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('aksharaUser');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.userSub || user.userId;
    if (!userId) {
      router.push('/login');
      return;
    }

    setTeacherUserId(userId);
    fetchStudents(userId);
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter((student) =>
        student.studentName.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const fetchStudents = async (userId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/students/list?teacherUserId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      setStudents(data.students || []);
      setFilteredStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    setError('');
    setIsCreating(true);

    try {
      // Auto-generate student name as "Student N" where N is the next number
      const nextStudentNumber = students.length + 1;
      const studentName = `Student ${nextStudentNumber}`;

      const response = await fetch('/api/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherUserId,
          studentName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create student');
      }

      setStudents([data.student, ...students]);
      setFilteredStudents([data.student, ...filteredStudents]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aksharaUser');
    localStorage.removeItem('selectedStudent');
    router.push('/login');
  };

  const handleSelectStudent = (student: Student) => {
    localStorage.setItem('selectedStudent', JSON.stringify({
      studentId: student.studentId,
      studentName: student.studentName,
    }));
    router.push('/reading/dashboard');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center">
        <div className="text-white text-xl">Loading students...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header with Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Students</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Instructions
              </button>
              <button
                onClick={handleCreateStudent}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all disabled:opacity-50"
              >
                {isCreating ? 'Adding...' : 'Add Student'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Instructions Modal */}
          {showInstructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-blue-900">Instructions</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-xl"
                >
                  ×
                </button>
              </div>
              <div className="text-blue-800 space-y-2">
                <p>1. Click "Add Student" to create a new student profile automatically</p>
                <p>2. Students will be named as "Student 1", "Student 2", etc.</p>
                <p>3. Click on any student card to select them and start the reading activity</p>
                <p>4. Use the search bar to quickly find specific students</p>
                <p>5. Click "Logout" to sign out of your account</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 font-semibold"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'No students found matching your search.' : 'No students added yet. Click "Add Student" to create one.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.studentId}
                    onClick={() => handleSelectStudent(student)}
                    className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-purple-400"
                  >
                    <div className="font-bold text-gray-800 text-xl text-center">
                      {student.studentName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
