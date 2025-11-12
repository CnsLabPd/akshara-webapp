interface HandwritingData {
  outputAlphabet: string;
  expectedAlphabet: string;
  grayscaleMatrix: number[][];
  recognitionConfidence: number;
  timestamp: string;
  sessionId: string;
}

interface CollectionMetadata {
  practiceType: 'capital-alphabets' | 'small-alphabets' | 'numbers';
  timestamp: string;
  userAgent: string;
  sessionId: string;
}

class HandwritingDataCollector {
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert canvas to grayscale matrix (28x28) matching the model input
   */
  private canvasToGrayscaleMatrix(canvas: HTMLCanvasElement): number[][] {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Create a temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('Cannot create temporary canvas context');
    }

    // Draw the original canvas scaled to 28x28
    tempCtx.fillStyle = 'black';
    tempCtx.fillRect(0, 0, 28, 28);
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, 28, 28);
    const data = imageData.data;
    
    // Convert to grayscale matrix (28x28)
    const matrix: number[][] = [];
    for (let y = 0; y < 28; y++) {
      const row: number[] = [];
      for (let x = 0; x < 28; x++) {
        const i = (y * 28 + x) * 4;
        // Convert RGB to grayscale and normalize to 0-1
        const grayscale = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
        row.push(Math.round(grayscale * 1000) / 1000); // Round to 3 decimal places
      }
      matrix.push(row);
    }
    
    return matrix;
  }

  /**
   * Collect handwriting data from practice session
   */
  async collectData(
    canvas: HTMLCanvasElement,
    outputAlphabet: string,
    expectedAlphabet: string,
    recognitionConfidence: number,
    practiceType: 'capital-alphabets' | 'small-alphabets' | 'numbers'
  ): Promise<void> {
    try {
      // Convert canvas to grayscale matrix
      const grayscaleMatrix = this.canvasToGrayscaleMatrix(canvas);
      
      // Create data object
      const handwritingData: HandwritingData = {
        outputAlphabet,
        expectedAlphabet,
        grayscaleMatrix,
        recognitionConfidence: Math.round(recognitionConfidence * 1000) / 1000, // Round to 3 decimal places
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };

      // Create metadata
      const metadata: CollectionMetadata = {
        practiceType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId
      };

      // Store data locally (in browser's localStorage for now)
      await this.storeDataLocally(handwritingData, metadata);
      
      // Log for debugging
      console.log('Handwriting data collected:', {
        practiceType,
        outputAlphabet,
        expectedAlphabet,
        confidence: recognitionConfidence,
        matrixSize: `${grayscaleMatrix.length}x${grayscaleMatrix[0]?.length || 0}`
      });

    } catch (error) {
      console.error('Error collecting handwriting data:', error);
    }
  }

  /**
   * Store data to file system via API
   */
  private async storeDataLocally(data: HandwritingData, metadata: CollectionMetadata): Promise<void> {
    try {
      // Combine data and metadata for API submission
      const completeData = {
        ...data,
        practiceType: metadata.practiceType
      };

      // Send data to API endpoint
      const response = await fetch('/api/handwriting-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Handwriting data saved to file: ${result.filepath}`);
        
        // Also maintain a backup in localStorage for export functionality
        const storageKey = `handwriting_data_${metadata.practiceType}_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(completeData, null, 2));
        
        // Maintain list for statistics
        const existingList = JSON.parse(localStorage.getItem('handwriting_data_list') || '[]');
        existingList.push({
          key: storageKey,
          practiceType: metadata.practiceType,
          expectedAlphabet: data.expectedAlphabet,
          outputAlphabet: data.outputAlphabet,
          timestamp: data.timestamp,
          confidence: data.recognitionConfidence,
          savedToFile: true,
          filepath: result.filepath
        });
        localStorage.setItem('handwriting_data_list', JSON.stringify(existingList));
      } else {
        throw new Error(result.error || 'Unknown API error');
      }

    } catch (error) {
      console.error('Error storing handwriting data:', error);
      
      // Fallback to localStorage only if API fails
      try {
        const filename = `${metadata.practiceType}_${data.expectedAlphabet}_${Date.now()}.json`;
        const storageKey = `handwriting_data_${metadata.practiceType}_${filename}`;
        const completeData = { ...data, metadata };
        localStorage.setItem(storageKey, JSON.stringify(completeData, null, 2));
        console.log('Data saved to localStorage as fallback');
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
      }
    }
  }

  /**
   * Export all collected data as downloadable JSON files
   */
  exportAllData(): void {
    try {
      const dataList = JSON.parse(localStorage.getItem('handwriting_data_list') || '[]');
      
      // Group by practice type
      const groupedData: { [key: string]: any[] } = {
        'capital-alphabets': [],
        'small-alphabets': [],
        'numbers': []
      };

      dataList.forEach((entry: any) => {
        const fullData = JSON.parse(localStorage.getItem(entry.key) || '{}');
        if (fullData.metadata) {
          groupedData[fullData.metadata.practiceType].push(fullData);
        }
      });

      // Create downloadable files for each practice type
      Object.entries(groupedData).forEach(([practiceType, data]) => {
        if (data.length > 0) {
          this.downloadAsJson(data, `handwriting_data_${practiceType}_${Date.now()}.json`);
        }
      });

      console.log('Data export completed. Check your downloads folder.');
    } catch (error) {
      console.error('Error exporting data:', error);
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
   * Get statistics about collected data
   */
  getCollectionStats(): any {
    try {
      const dataList = JSON.parse(localStorage.getItem('handwriting_data_list') || '[]');
      
      const stats = {
        total: dataList.length,
        byPracticeType: {
          'capital-alphabets': 0,
          'small-alphabets': 0,
          'numbers': 0
        },
        sessionId: this.sessionId,
        lastCollected: dataList.length > 0 ? dataList[dataList.length - 1].timestamp : null
      };

      dataList.forEach((entry: any) => {
        if (stats.byPracticeType.hasOwnProperty(entry.practiceType)) {
          const practiceType = entry.practiceType as keyof typeof stats.byPracticeType;
          stats.byPracticeType[practiceType]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return { total: 0, byPracticeType: {}, sessionId: this.sessionId };
    }
  }

  /**
   * Clear all collected data
   */
  clearAllData(): void {
    try {
      const dataList = JSON.parse(localStorage.getItem('handwriting_data_list') || '[]');
      
      // Remove all data entries
      dataList.forEach((entry: any) => {
        localStorage.removeItem(entry.key);
      });
      
      // Clear the list
      localStorage.removeItem('handwriting_data_list');
      
      console.log('All handwriting data cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

// Create a singleton instance
export const handwritingDataCollector = new HandwritingDataCollector();

// Export the interface for type checking
export type { HandwritingData, CollectionMetadata };