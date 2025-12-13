import * as tf from '@tensorflow/tfjs';

// Model configuration
const MODEL_PATH = '/js_model/model.json';
const CLASS_LABELS_PATH = '/js_model/class_labels.json';
const TARGET_IMG_WIDTH = 28;
const TARGET_IMG_HEIGHT = 28;

// Alphabet mapping will be loaded from class_labels.json
let ALPHABET_MAP: string[] = [];

export interface PredictionResult {
  letter: string;
  confidence: number;
  probabilities?: number[];
  preprocessedImageUrl?: string;
}

export class TensorFlowCharacterRecognizer {
  private model: tf.GraphModel | null = null;
  private isLoading = false;
  private isLoaded = false;

  /**
   * Load class labels from JSON file
   */
  private async loadClassLabels(): Promise<void> {
    try {
      const response = await fetch(CLASS_LABELS_PATH);
      if (!response.ok) {
        throw new Error(`Failed to load class labels: ${response.statusText}`);
      }
      ALPHABET_MAP = await response.json();
      console.log('Class labels loaded:', ALPHABET_MAP);
    } catch (error) {
      console.error('Error loading class labels:', error);
      // Fallback to default mapping
      ALPHABET_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
      console.log('Using fallback alphabet mapping');
    }
  }

  /**
   * Initialize and load the TensorFlow.js model
   */
  async loadModel(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    
    try {
      console.log('Loading TensorFlow.js model and class labels...');
      
      // Load both model and class labels in parallel
      await Promise.all([
        tf.loadGraphModel(MODEL_PATH).then(model => { this.model = model; }),
        this.loadClassLabels()
      ]);
      
      this.isLoaded = true;
      console.log('TensorFlow.js model and class labels loaded successfully');
      console.log('Model input shape:', this.model!.inputs[0].shape);
      console.log('Model output shape:', this.model!.outputs[0].shape);
    } catch (error) {
      console.error('Error loading TensorFlow.js model:', error);
      throw new Error('Failed to load character recognition model');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if model is ready for predictions
   */
  isModelReady(): boolean {
    return this.isLoaded && this.model !== null;
  }

  /**
   * Preprocess canvas image to match EMNIST dataset format
   * This includes cropping, centering, resizing, and applying EMNIST transformations
   */
  private preprocessCanvasImage(canvas: HTMLCanvasElement): { tensor: tf.Tensor; preprocessedCanvas: HTMLCanvasElement } {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Find bounding box of drawn content (white pixels on black background)
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i]; // Red channel
        
        // Look for white pixels (drawing) on black background
        if (r > 128) { // Found a bright pixel (our white drawing)
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Handle empty canvas
    if (maxX === -1) {
      const emptyCanvas = document.createElement('canvas');
      emptyCanvas.width = TARGET_IMG_WIDTH;
      emptyCanvas.height = TARGET_IMG_HEIGHT;
      const emptyCtx = emptyCanvas.getContext('2d');
      if (emptyCtx) {
        emptyCtx.fillStyle = "black";
        emptyCtx.fillRect(0, 0, TARGET_IMG_WIDTH, TARGET_IMG_HEIGHT);
      }
      return {
        tensor: tf.zeros([1, TARGET_IMG_WIDTH, TARGET_IMG_HEIGHT, 1]),
        preprocessedCanvas: emptyCanvas
      };
    }

    // Calculate bounding box with padding
    const drawingWidth = maxX - minX;
    const drawingHeight = maxY - minY;
    let side = Math.max(drawingWidth, drawingHeight);
    const padding = side * 0.2; // 20% padding
    side += padding * 2;
    
    const centerX = minX + drawingWidth / 2;
    const centerY = minY + drawingHeight / 2;
    
    const newMinX = centerX - side / 2;
    const newMinY = centerY - side / 2;

    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = TARGET_IMG_WIDTH;
    tempCanvas.height = TARGET_IMG_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('Cannot create temporary canvas context');
    }
    
    // Fill with black background (EMNIST format)
    tempCtx.fillStyle = "black";
    tempCtx.fillRect(0, 0, TARGET_IMG_WIDTH, TARGET_IMG_HEIGHT);
    
    // === APPLY EMNIST TRANSFORMATIONS ===
    // The EMNIST dataset is rotated -90 degrees and flipped horizontally.
    // We must apply these transformations to match the training data.
    
    // 1. Translate to center of canvas
    tempCtx.translate(TARGET_IMG_WIDTH / 2, TARGET_IMG_HEIGHT / 2);
    // 2. Rotate -90 degrees (clockwise)
    tempCtx.rotate(-Math.PI / 2);
    // 3. Flip horizontally
    tempCtx.scale(-1, 1);
    // 4. Translate back from center
    tempCtx.translate(-TARGET_IMG_WIDTH / 2, -TARGET_IMG_HEIGHT / 2);
    
    // Draw the cropped and centered image with transformations
    tempCtx.drawImage(
      canvas,
      newMinX, newMinY, side, side, // Source rectangle
      0, 0, TARGET_IMG_WIDTH, TARGET_IMG_HEIGHT // Destination rectangle
    );

    // Convert to tensor and return both tensor and canvas
    const tensor = tf.tidy(() => {
      const tensor = tf.browser.fromPixels(tempCanvas)
        .slice([0, 0, 0], [-1, -1, 1]) // Convert to grayscale (take red channel)
        .div(255.0) // Normalize to [0, 1]
        .expandDims(0); // Add batch dimension
      return tensor;
    });

    return {
      tensor,
      preprocessedCanvas: tempCanvas
    };
  }

  /**
   * Recognize character from canvas drawing
   */
  async recognizeCharacter(canvas: HTMLCanvasElement): Promise<PredictionResult> {
    if (!this.isModelReady()) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    if (ALPHABET_MAP.length === 0) {
      throw new Error('Class labels not loaded');
    }

    // Preprocess the image
    const { tensor: inputTensor, preprocessedCanvas } = this.preprocessCanvasImage(canvas);
    
    try {
      // Run prediction
      const prediction = this.model!.predict(inputTensor) as tf.Tensor;
      
      // Get probabilities
      const probabilities = await prediction.data();
      const probabilitiesArray = Array.from(probabilities);
      
      // Find the class with highest probability
      const maxProbIndex = tf.argMax(prediction, 1).dataSync()[0];
      
      // Ensure the index is within bounds
      if (maxProbIndex >= ALPHABET_MAP.length) {
        console.error(`Prediction index ${maxProbIndex} out of bounds for alphabet map of length ${ALPHABET_MAP.length}`);
        throw new Error('Invalid prediction index');
      }
      
      const predictedChar = ALPHABET_MAP[maxProbIndex];
      const confidence = probabilities[maxProbIndex];
      
      // Log detailed prediction info for debugging
      console.log('Prediction details:', {
        predictedChar,
        confidence,
        maxProbIndex,
        alphabetMapLength: ALPHABET_MAP.length,
        topPredictions: probabilitiesArray
          .map((prob, idx) => ({ char: ALPHABET_MAP[idx], prob, idx }))
          .sort((a, b) => b.prob - a.prob)
          .slice(0, 5)
      });
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        letter: predictedChar,
        confidence: confidence,
        probabilities: probabilitiesArray,
        preprocessedImageUrl: preprocessedCanvas.toDataURL('image/png')
      };
      
    } catch (error) {
      // Clean up on error
      inputTensor.dispose();
      console.error('Error during character recognition:', error);
      throw new Error('Character recognition failed');
    }
  }

  /**
   * Get confidence threshold for accepting predictions
   * Characters with confidence below this should be considered uncertain
   */
  getConfidenceThreshold(character?: string): number {
    // Lower threshold for letters that have recognition challenges
    const challengingLetters = ['m', 'y', 'M', 'Y'];
    if (character && challengingLetters.includes(character)) {
      return 0.3; // 30% confidence threshold for challenging letters
    }
    return 0.5; // 50% confidence threshold for other letters
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
    }
  }
}

// Create singleton instance
export const characterRecognizer = new TensorFlowCharacterRecognizer();

/**
 * Utility function to convert canvas to base64 image for debugging
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Utility function to check if a recognized character matches the expected letter
 * Handles both uppercase and lowercase matching
 */
export function isCharacterMatch(recognized: string, expected: string): boolean {
  return recognized.toUpperCase() === expected.toUpperCase();
}

/**
 * Enhanced character matching with detailed feedback
 * Returns match result with additional context for different practice modes
 */
export function isCharacterMatchDetailed(recognized: string, expected: string, practiceMode: 'capital' | 'small' | 'any' = 'any'): {
  isMatch: boolean;
  isExactMatch: boolean;
  isCaseMatch: boolean;
  feedback: string;
} {
  const recognizedUpper = recognized.toUpperCase();
  const expectedUpper = expected.toUpperCase();
  const isLetterMatch = recognizedUpper === expectedUpper;
  const isExactCase = recognized === expected;
  
  if (!isLetterMatch) {
    return {
      isMatch: false,
      isExactMatch: false,
      isCaseMatch: false,
      feedback: `Try again! Expected ${expected}, but recognized ${recognized}`
    };
  }
  
  // Letter matches, check case appropriateness
  if (practiceMode === 'capital') {
    if (isExactCase) {
      return {
        isMatch: true,
        isExactMatch: true,
        isCaseMatch: true,
        feedback: `Perfect! Correctly wrote capital ${expected}`
      };
    } else {
      return {
        isMatch: true,
        isExactMatch: false,
        isCaseMatch: false,
        feedback: `Good! Recognized as ${recognized}, but try writing capital ${expected}`
      };
    }
  } else if (practiceMode === 'small') {
    if (isExactCase) {
      return {
        isMatch: true,
        isExactMatch: true,
        isCaseMatch: true,
        feedback: `Perfect! Correctly wrote lowercase ${expected}`
      };
    } else {
      return {
        isMatch: true,
        isExactMatch: false,
        isCaseMatch: false,
        feedback: `Good! Recognized as ${recognized}, but try writing lowercase ${expected}`
      };
    }
  } else {
    return {
      isMatch: true,
      isExactMatch: isExactCase,
      isCaseMatch: isExactCase,
      feedback: isExactCase ? `Perfect! Correctly wrote ${expected}` : `Good! Recognized ${recognized} for ${expected}`
    };
  }
}

/**
 * Number matching for digits 0-9
 * Maps letters that look like numbers to their numeric equivalents
 */
export function isNumberMatch(recognized: string, expected: string): {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
} {
  // Letter-to-number mapping for common confusions
  const letterToNumber: { [key: string]: string[] } = {
    'O': ['0'], 'o': ['0'],  // O looks like 0
    'I': ['1'], 'i': ['1'], 'l': ['1'],  // I, i, l look like 1
    'Z': ['2'], 'z': ['2'],  // Z can look like 2
    'B': ['3', '8'],  // B looks like both 3 and 8 (custom mappings)
    'A': ['4'], 't': ['4', '7'],  // A looks like 4, t looks like both 4 and 7 (custom mappings)
    'S': ['5'], 's': ['5'],  // S can look like 5
    'b': ['6'], 'G': ['6'], 'g': ['6'],  // b looks like 6 (custom), G can look like 6
    'q': ['9'],  // q can look like 9
  };

  // Direct match
  if (recognized === expected) {
    return {
      isCorrect: true,
      confidence: 1.0,
      feedback: `Perfect! Correctly wrote ${expected}!`
    };
  }

  // Check if recognized letter maps to expected number
  const possibleNumbers = letterToNumber[recognized];
  if (possibleNumbers && possibleNumbers.includes(expected)) {
    return {
      isCorrect: true,
      confidence: 0.8,
      feedback: `Good! Recognized as ${recognized}, which looks like ${expected}!`
    };
  }

  // Check if recognized is another number
  if ('0123456789'.includes(recognized)) {
    return {
      isCorrect: false,
      confidence: 0.6,
      feedback: `Try again! You wrote ${recognized}, but expected ${expected}`
    };
  }

  // Unrecognized or letter
  return {
    isCorrect: false,
    confidence: 0.3,
    feedback: `Try again! Draw the number ${expected}. AI saw: ${recognized}`
  };
}

/**
 * Strict educational character matching for learning apps
 * Only accepts exact case matches for proper learning
 * Special exception: For visually similar letters in small practice mode
 */
export function isCharacterMatchStrict(recognized: string, expected: string, practiceMode: 'capital' | 'small'): {
  isCorrect: boolean;
  isExactMatch: boolean;
  isWrongCase: boolean;
  feedback: string;
  allowAdvance: boolean;
} {
  const recognizedUpper = recognized.toUpperCase();
  const expectedUpper = expected.toUpperCase();
  const isLetterMatch = recognizedUpper === expectedUpper;
  const isExactCase = recognized === expected;
  
  // Letters that look very similar in capital and lowercase forms
  // For these letters in small practice mode, accept both cases as correct
  const visuallySimilarLetters = ['c', 'f', 'k', 'm', 'o', 'p', 's', 'u', 'v', 'w', 'x', 'y', 'z'];
  const isVisuallySimilar = practiceMode === 'small' && visuallySimilarLetters.includes(expected.toLowerCase());
  
  // Not the right letter at all
  if (!isLetterMatch) {
    return {
      isCorrect: false,
      isExactMatch: false,
      isWrongCase: false,
      feedback: `Oops! Try writing ${expected} again. You can do it! 😊`,
      allowAdvance: false
    };
  }
  
  // Right letter, exact case match - PERFECT!
  if (isExactCase) {
    return {
      isCorrect: true,
      isExactMatch: true,
      isWrongCase: false,
      feedback: `Amazing! Perfect ${expected}! 🌟`,
      allowAdvance: true
    };
  }
  
  // Special case: Visually similar letters in small practice mode
  if (isVisuallySimilar && isLetterMatch) {
    return {
      isCorrect: true,
      isExactMatch: false,
      isWrongCase: false,
      feedback: `Wonderful! Great ${expected}! 🎉`,
      allowAdvance: true
    };
  }
  
  // Right letter, wrong case - EDUCATIONAL MOMENT
  if (practiceMode === 'capital') {
    return {
      isCorrect: false,
      isExactMatch: false,
      isWrongCase: true,
      feedback: `Great job! But make it BIG like this: ${expected}`,
      allowAdvance: false
    };
  } else {
    return {
      isCorrect: false,
      isExactMatch: false,
      isWrongCase: true,
      feedback: `Nice! But make it small like this: ${expected}`,
      allowAdvance: false
    };
  }
}