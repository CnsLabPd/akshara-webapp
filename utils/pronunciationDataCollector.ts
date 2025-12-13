interface PronunciationData {
  character: string; // The letter/number being practiced
  expectedPronunciation: string; // Expected pronunciation
  userAudio: string; // Base64 encoded audio data
  transcript: string; // What the user said (from speech recognition)
  timestamp: string; // When the recording was made
  sessionId: string; // Session identifier
  attemptNumber: number; // 1 or 2 (since each character is collected twice)
  practiceType: 'english-alphabets' | 'english-numbers' | 'tamil-alphabets' | 'tamil-consonants';
}

interface CollectionSession {
  sessionId: string;
  startTime: string;
  practiceType: 'english-alphabets' | 'english-numbers' | 'tamil-alphabets' | 'tamil-consonants';
  targetCount: number; // Total number of recordings needed
  completed: PronunciationData[];
  currentCharacterCounts: { [key: string]: number }; // Track how many times each character has been recorded
}

class PronunciationDataCollector {
  private currentSession: CollectionSession | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  /**
   * Initialize a new data collection session
   */
  initSession(practiceType: 'english-alphabets' | 'english-numbers' | 'tamil-alphabets' | 'tamil-consonants'): string {
    const sessionId = this.generateSessionId();
    const targetCount = practiceType === 'english-alphabets' ? 52 : 
                       practiceType === 'english-numbers' ? 20 : 
                       practiceType === 'tamil-alphabets' ? 24 :
                       36; // 26 English letters × 2, 10 numbers × 2, 12 Tamil vowels × 2, or 18 Tamil consonants × 2
    
    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      practiceType,
      targetCount,
      completed: [],
      currentCharacterCounts: {}
    };

    console.log(`Started ${practiceType} data collection session:`, sessionId);
    return sessionId;
  }

  /**
   * Check if we need to collect data for a specific character
   */
  needsCollection(character: string): boolean {
    if (!this.currentSession) return false;
    
    const count = this.currentSession.currentCharacterCounts[character] || 0;
    return count < 2; // Collect each character 2 times
  }

  /**
   * Get current attempt number for a character (1 or 2)
   */
  getCurrentAttemptNumber(character: string): number {
    if (!this.currentSession) return 1;
    
    const count = this.currentSession.currentCharacterCounts[character] || 0;
    return count + 1;
  }

  /**
   * Start recording audio for a character
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start audio recording');
    }
  }

  /**
   * Stop recording and return the audio data
   */
  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          resolve(base64Audio);
        };
        reader.onerror = () => reject(new Error('Failed to convert audio to base64'));
        reader.readAsDataURL(audioBlob);

        // Clean up
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      };

      this.mediaRecorder.stop();
      console.log('Recording stopped...');
    });
  }

  /**
   * Store pronunciation data for a character
   */
  async storePronunciationData(
    character: string,
    expectedPronunciation: string,
    transcript: string,
    audioData: string
  ): Promise<boolean> {
    if (!this.currentSession) {
      console.error('No active session for data collection');
      return false;
    }

    if (!this.needsCollection(character)) {
      console.log(`Character ${character} already collected 2 times`);
      return false;
    }

    const attemptNumber = this.getCurrentAttemptNumber(character);
    
    const pronunciationData: PronunciationData = {
      character,
      expectedPronunciation,
      userAudio: audioData,
      transcript,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.sessionId,
      attemptNumber,
      practiceType: this.currentSession.practiceType
    };

    // Add to completed list
    this.currentSession.completed.push(pronunciationData);
    
    // Update character count
    this.currentSession.currentCharacterCounts[character] = 
      (this.currentSession.currentCharacterCounts[character] || 0) + 1;

    // Store to localStorage and file system
    await this.saveToStorage(pronunciationData);

    console.log(`Stored pronunciation data for ${character} (attempt ${attemptNumber})`);
    console.log(`Session progress: ${this.currentSession.completed.length}/${this.currentSession.targetCount}`);

    return true;
  }

  /**
   * Save data to localStorage and create downloadable file
   */
  private async saveToStorage(data: PronunciationData): Promise<void> {
    try {
      // Store in localStorage
      const storageKey = `pronunciation_${data.practiceType}_${data.character}_${data.attemptNumber}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(data));

      // Maintain a list of all collected data
      const existingList = JSON.parse(localStorage.getItem('pronunciation_data_list') || '[]');
      existingList.push({
        key: storageKey,
        character: data.character,
        practiceType: data.practiceType,
        timestamp: data.timestamp,
        attemptNumber: data.attemptNumber,
        transcript: data.transcript
      });
      localStorage.setItem('pronunciation_data_list', JSON.stringify(existingList));

      // Create downloadable file
      this.createDownloadableFile(data);
      
    } catch (error) {
      console.error('Error saving pronunciation data:', error);
    }
  }

  /**
   * Create a downloadable JSON file for the pronunciation data
   */
  private createDownloadableFile(data: PronunciationData): void {
    const filename = `${data.practiceType}_${data.character}_attempt${data.attemptNumber}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    // Store the file data for batch download later
    const fileKey = `pronunciation_file_${Date.now()}`;
    const fileData = {
      filename,
      data: JSON.stringify(data, null, 2),
      timestamp: data.timestamp
    };
    localStorage.setItem(fileKey, JSON.stringify(fileData));
  }

  /**
   * Get session statistics
   */
  getSessionStats(): any {
    if (!this.currentSession) {
      return { active: false };
    }

    const characterCounts = this.currentSession.currentCharacterCounts;
    const completedCharacters = Object.keys(characterCounts).filter(char => characterCounts[char] >= 2);
    
    return {
      active: true,
      sessionId: this.currentSession.sessionId,
      practiceType: this.currentSession.practiceType,
      totalCollected: this.currentSession.completed.length,
      targetCount: this.currentSession.targetCount,
      completedCharacters: completedCharacters.length,
      pendingCharacters: this.getPendingCharacters(),
      progress: Math.round((this.currentSession.completed.length / this.currentSession.targetCount) * 100)
    };
  }

  /**
   * Get list of characters that still need collection
   */
  private getPendingCharacters(): string[] {
    if (!this.currentSession) return [];
    
    const allCharacters = this.currentSession.practiceType === 'english-alphabets' 
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      : this.currentSession.practiceType === 'english-numbers'
      ? '0123456789'.split('')
      : this.currentSession.practiceType === 'tamil-alphabets'
      ? ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'] // Tamil vowels
      : ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன']; // Tamil consonants
    
    return allCharacters.filter(char => {
      const count = this.currentSession!.currentCharacterCounts[char] || 0;
      return count < 2;
    });
  }

  /**
   * Export all collected pronunciation data
   */
  exportAllData(): void {
    try {
      const dataList = JSON.parse(localStorage.getItem('pronunciation_data_list') || '[]');
      
      if (dataList.length === 0) {
        console.log('No pronunciation data to export');
        return;
      }

      // Group by practice type
      const groupedData: { [key: string]: any[] } = {
        'english-alphabets': [],
        'english-numbers': [],
        'tamil-alphabets': [],
        'tamil-consonants': []
      };

      dataList.forEach((entry: any) => {
        const fullData = JSON.parse(localStorage.getItem(entry.key) || '{}');
        if (fullData.practiceType) {
          groupedData[fullData.practiceType].push(fullData);
        }
      });

      // Create downloadable files
      Object.entries(groupedData).forEach(([practiceType, data]) => {
        if (data.length > 0) {
          const filename = `pronunciation_data_${practiceType}_${Date.now()}.json`;
          this.downloadAsJson(data, filename);
        }
      });

      console.log('Pronunciation data export completed');
    } catch (error) {
      console.error('Error exporting pronunciation data:', error);
    }
  }

  /**
   * Download data as JSON file
   */
  private downloadAsJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all pronunciation data
   */
  clearAllData(): void {
    try {
      const dataList = JSON.parse(localStorage.getItem('pronunciation_data_list') || '[]');
      
      dataList.forEach((entry: any) => {
        localStorage.removeItem(entry.key);
      });
      
      localStorage.removeItem('pronunciation_data_list');
      
      // Clear file data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pronunciation_file_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('All pronunciation data cleared');
    } catch (error) {
      console.error('Error clearing pronunciation data:', error);
    }
  }

  /**
   * End current session
   */
  endSession(): void {
    if (this.currentSession) {
      console.log(`Ended pronunciation data collection session: ${this.currentSession.sessionId}`);
      this.currentSession = null;
    }
  }

  private generateSessionId(): string {
    return `pronunciation_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const pronunciationDataCollector = new PronunciationDataCollector();

// Export types
export type { PronunciationData, CollectionSession };