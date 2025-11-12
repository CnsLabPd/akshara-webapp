# AksharA - AI-Powered Alphabet Learning Platform

## Project Overview

**AksharA** is an interactive, AI-powered web application designed to help children learn alphabets through innovative **handwriting recognition** and **voice recognition** technologies. The platform makes learning fun and engaging with real-time feedback, celebration animations, and gamified progress tracking.

---

## Tech Stack

### Frontend Framework
- **Next.js 15.5.6** (React Framework)
  - Server-side rendering (SSR)
  - App Router architecture
  - Turbopack for faster development
  - TypeScript for type safety

### UI/Styling
- **Tailwind CSS**
  - Utility-first CSS framework
  - Responsive design
  - Custom gradients and animations
  - Modern, kid-friendly interface

### AI/ML Technologies

#### 1. Handwriting Recognition
- **Tesseract.js**
  - Client-side OCR (Optical Character Recognition)
  - Processes hand-drawn letters on canvas
  - No server required - runs in browser
  - English language model (expandable)

#### 2. Voice Recognition
- **Web Speech API**
  - Browser-native speech recognition
  - Real-time audio processing
  - Supports Chrome, Edge browsers
  - Phonetic matching algorithm

### Drawing Canvas
- **HTML5 Canvas API**
  - Custom drawing component
  - Touch and mouse support
  - Clear/erase functionality
  - Image data export for OCR

### State Management
- **React Hooks**
  - useState for component state
  - useEffect for lifecycle management
  - useRef for persistent references
  - No external state library needed

---

## Project Structure

```
akshara/
├── app/
│   ├── page.tsx                    # Home page (language & section selection)
│   ├── practice/
│   │   └── page.tsx                # Writing practice mode
│   ├── test/
│   │   └── page.tsx                # Writing test mode
│   ├── reading/
│   │   ├── practice/
│   │   │   └── page.tsx            # Reading practice mode
│   │   └── test/
│   │       └── page.tsx            # Reading test mode
│   ├── corrected-test/
│   │   └── page.tsx                # Retake test for wrong answers
│   ├── results/
│   │   └── page.tsx                # Test results page
│   └── layout.tsx                  # Root layout
├── components/
│   └── DrawingCanvas.tsx           # Reusable canvas component
├── public/                         # Static assets
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
└── package.json                    # Dependencies
```

---

## Application Flow

### 1. Home Page (Language & Section Selection)

**Location:** `app/page.tsx`

**User Journey:**
```
Language Selection → Section Selection → Mode Selection → Activity
```

**Logic:**
1. User selects **English** (expandable to more languages)
2. User chooses between:
   - **Writing** ✍️ (Handwriting recognition)
   - **Reading** 🎤 (Voice recognition)
3. User picks mode:
   - **Practice** (unlimited attempts, no pressure)
   - **Test** (single attempt, scored)

**State Management:**
- `selectedLanguage`: Tracks chosen language
- `selectedSection`: Tracks writing/reading choice
- Conditional rendering based on state

---

## Section-by-Section Explanation

### 2. Writing Practice Section

**Location:** `app/practice/page.tsx`

**Purpose:** Let kids practice writing alphabets with unlimited attempts and instant feedback.

**Tech Stack Used:**
- React for UI
- Tesseract.js for OCR
- HTML5 Canvas for drawing
- Tailwind CSS for styling

**Logic Flow:**

```javascript
1. Initialize Tesseract Worker
   ↓
2. User draws letter on canvas
   ↓
3. User clicks "Submit"
   ↓
4. Canvas converts drawing to image data
   ↓
5. Tesseract OCR processes image
   ↓
6. Compare recognized text with expected letter
   ↓
7. If correct → Show celebration animation
   ↓
8. Auto-advance to next letter (2.5 seconds)
   ↓
9. If incorrect → Show "Try again" message
   ↓
10. User can click "Retry" to try same letter again
```

**Key Features:**
- ✅ 26 alphabets (A-Z)
- ✅ Drawing canvas with clear functionality
- ✅ Submit button for controlled checking
- ✅ Retry button for unlimited attempts
- ✅ Celebration animation with green tick mark
- ✅ Confetti effects for correct answers
- ✅ Progress tracking (current letter, score)
- ✅ Previous/Next navigation

**Code Highlights:**

```typescript
// OCR Initialization
const worker = await createWorker('eng', 1);
await worker.setParameters({
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
});

// Recognition Logic
const { data: { text } } = await worker.recognize(imageData);
const recognizedText = text.trim().toUpperCase();

if (recognizedText.includes(currentLetter)) {
  // Correct! Show celebration
  setShowCelebration(true);
  setScore(score + 1);
}
```

---

### 3. Writing Test Section

**Location:** `app/test/page.tsx`

**Purpose:** Assess learning with single-attempt testing and score tracking.

**Differences from Practice:**
- ❌ No retry button
- ✅ Single attempt per letter
- ✅ Tracks wrong answers
- ✅ Final score calculation
- ✅ Redirects to results page
- ✅ Wrong answers saved for corrected test

**Logic Flow:**

```javascript
1. User draws each letter (A-Z)
   ↓
2. Submit once per letter (no retry)
   ↓
3. If correct → Score +1, celebration
   ↓
4. If incorrect → Add to wrongAnswers array
   ↓
5. Move to next letter automatically
   ↓
6. After letter Z:
   - Save results to localStorage
   - Navigate to results page
   ↓
7. Results show:
   - Total score
   - Wrong answers
   - Option for corrected test
```

**Code Highlights:**

```typescript
// Track wrong answers
if (!isCorrect) {
  setWrongAnswers([...wrongAnswers, currentLetter]);
}

// Save results after last letter
const results = {
  score: score,
  total: ALPHABETS.length,
  wrongAnswers: wrongAnswers,
};
localStorage.setItem('testResults', JSON.stringify(results));
router.push('/results');
```

---

### 4. Reading Practice Section

**Location:** `app/reading/practice/page.tsx`

**Purpose:** Practice alphabet pronunciation with voice recognition.

**Tech Stack Used:**
- Web Speech API (browser-native)
- Speech Recognition interface
- Text-to-Speech synthesis
- Real-time audio processing

**Logic Flow:**

```javascript
1. Initialize Speech Recognition
   ↓
2. User clicks "Listen" 🔊
   → Browser speaks the letter (Text-to-Speech)
   ↓
3. User clicks "Start Recording" 🎤
   → Microphone activates
   ↓
4. User says the letter
   ↓
5. Speech Recognition captures audio
   ↓
6. Convert speech to text (transcript)
   ↓
7. Display what user said on screen
   ↓
8. User clicks "Submit"
   ↓
9. Match transcript with expected pronunciation
   ↓
10. If match → Celebration + move to next
    ↓
11. If no match → "Try again" message
    ↓
12. User can "Retry" to record again
```

**Speech Recognition Setup:**

```typescript
const SpeechRecognition = window.SpeechRecognition ||
                          window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 3;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
                          .toUpperCase().trim();
  setCurrentTranscript(transcript);
  setHasRecorded(true);
};
```

**Phonetic Matching Logic:**

```typescript
const pronunciationVariants = {
  'A': ['AY', 'A'],
  'B': ['BEE', 'B'],
  'C': ['SEE', 'C', 'CEE'],
  'D': ['DEE', 'D'],
  // ... all 26 letters
};

// Check exact pronunciation match
const isCorrect = validPronunciations.some(pronunciation => {
  return cleanTranscript === pronunciation ||
         cleanTranscript.startsWith(pronunciation);
});
```

**Key Features:**
- ✅ Text-to-Speech (hear correct pronunciation)
- ✅ Real-time transcript display
- ✅ Phonetic matching (e.g., "BEE" for "B")
- ✅ Exact pronunciation validation
- ✅ Visual feedback (what you said vs expected)
- ✅ Retry button for unlimited attempts
- ✅ Celebration animations

---

### 5. Reading Test Section

**Location:** `app/reading/test/page.tsx`

**Purpose:** Test pronunciation skills with single-attempt assessment.

**Logic:** Same as Reading Practice, but:
- ❌ No retry button
- ✅ Single attempt per letter
- ✅ Score tracking
- ✅ Wrong answers saved
- ✅ Results page navigation

---

### 6. Results Page

**Location:** `app/results/page.tsx`

**Purpose:** Display test performance and offer corrected test.

**Logic Flow:**

```javascript
1. Load results from localStorage
   ↓
2. Display:
   - Score (e.g., 20/26)
   - Percentage (77%)
   - Wrong letters (e.g., G, Q, W)
   ↓
3. Options:
   - "Try Again" → Restart full test
   - "Corrected Test" → Test only wrong letters
   - "Home" → Return to home page
```

---

### 7. Corrected Test Section

**Location:** `app/corrected-test/page.tsx`

**Purpose:** Let users retake test for only the letters they got wrong.

**Logic:**
- Loads wrong letters from results
- Same test flow but only for those letters
- Helps improve on mistakes
- Track improvement

---

## Key Components

### DrawingCanvas Component

**Location:** `components/DrawingCanvas.tsx`

**Purpose:** Reusable canvas for letter drawing.

**Features:**
- Mouse and touch support
- Line drawing with stroke
- Clear canvas button
- Export image data
- Real-time drawing feedback

**Props:**
- `onDrawingComplete`: Callback with image data
- `isEnabled`: Enable/disable drawing

**Logic:**

```typescript
// Drawing Logic
const handleMouseDown = (e) => {
  setIsDrawing(true);
  const { offsetX, offsetY } = e.nativeEvent;
  // Start new path
};

const handleMouseMove = (e) => {
  if (!isDrawing) return;
  const { offsetX, offsetY } = e.nativeEvent;
  // Draw line from last point to current point
};

const handleMouseUp = () => {
  setIsDrawing(false);
  // Export canvas as image data
  const imageData = canvas.toDataURL('image/png');
  onDrawingComplete(imageData);
};
```

---

## Celebration Animation System

**Used in:** Practice & Test sections (both Writing & Speaking)

**Visual Elements:**

1. **Green Tick Mark** ✅
   - Animated SVG checkmark
   - Stroke-dasharray animation (draws from 0 to 100%)
   - Bounce effect
   - White circular background

2. **Confetti Effect** 🎊
   - 20 colorful particles
   - Random positions
   - Staggered animations
   - 6 vibrant colors

3. **Success Messages**
   - "Excellent! 🎉" / "Amazing! 🌟"
   - Pulse animation
   - Large text with shadow

**Animation Code:**

```typescript
// Celebration Overlay
{showCelebration && (
  <div className="fixed inset-0 z-50 backdrop-blur-sm">
    {/* Confetti */}
    {[...Array(20)].map((_, i) => (
      <div
        className="absolute animate-ping"
        style={{
          backgroundColor: colors[i % 6],
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}

    {/* Green Tick */}
    <svg className="animate-bounce">
      <path d="M5 13l4 4L19 7" />
    </svg>

    {/* Success Text */}
    <h2 className="animate-pulse">Excellent! 🎉</h2>
  </div>
)}
```

**Timing:**
- Shows immediately on correct answer
- Displays for 2.5 seconds
- Auto-closes and moves to next letter

---

## Data Flow & State Management

### Practice Mode Flow:

```
User Input → State Update → AI Processing → Result → UI Update
```

**States:**
- `currentIndex`: Current letter position (0-25)
- `score`: Number of correct attempts
- `hasDrawn/hasRecorded`: Whether user completed input
- `currentDrawing/currentTranscript`: User's input
- `isProcessing`: Loading state
- `showCelebration`: Celebration visibility
- `feedback`: User feedback message

### Test Mode Flow:

```
User Input → Single Attempt → Score Tracking →
Wrong Answers → Results Storage → Navigation
```

**Additional States:**
- `wrongAnswers`: Array of incorrect letters
- Results stored in localStorage

---

## Browser Compatibility

### Writing Sections:
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile and desktop
- ✅ Touch and mouse support

### Speaking Sections:
- ✅ Chrome (recommended)
- ✅ Microsoft Edge
- ⚠️ Safari (limited support)
- ❌ Firefox (no Web Speech API support)

---

## Performance Optimizations

1. **Client-side Processing**
   - No server calls for OCR/Speech
   - Faster response times
   - Works offline (after initial load)

2. **Worker Initialization**
   - Tesseract worker loaded once
   - Reused for all letters
   - Cleanup on unmount

3. **State Management**
   - Minimal re-renders
   - Efficient state updates
   - useRef for persistent data

4. **Image Optimization**
   - Canvas exports optimized PNG
   - Small file sizes for OCR

---

## Key Algorithms

### 1. OCR Letter Matching
```typescript
const recognizedText = text.trim().toUpperCase();
const isCorrect = recognizedText.includes(currentLetter);
```

### 2. Phonetic Pronunciation Matching
```typescript
const checkLetterMatch = (transcript, expectedLetter) => {
  const validPronunciations = pronunciationMap[expectedLetter];
  return validPronunciations.some(pronunciation =>
    transcript === pronunciation ||
    transcript.startsWith(pronunciation)
  );
};
```

### 3. Progress Calculation
```typescript
const progress = `${currentIndex + 1} / ${ALPHABETS.length}`;
const percentage = Math.round((score / total) * 100);
```

---

## Future Enhancements

1. **More Languages**
   - Hindi (Devanagari script)
   - Spanish
   - French

2. **Advanced Features**
   - Word formation (combine letters)
   - Phonics lessons
   - Multiplayer mode
   - Parent dashboard

3. **AI Improvements**
   - Better handwriting recognition
   - Adaptive difficulty
   - Personalized learning paths

---

## Demo Script

### Opening (30 seconds)
"AksharA is an AI-powered learning platform that helps children learn alphabets through innovative handwriting and voice recognition technologies."

### Navigation Demo (1 minute)
1. Show home page
2. Select English → Writing → Practice
3. Demonstrate drawing "A"
4. Show celebration animation
5. Show retry functionality

### Writing Section (1.5 minutes)
1. Practice mode features
2. Draw a few letters
3. Show correct/incorrect feedback
4. Demonstrate test mode
5. Show results page

### Speaking Section (1.5 minutes)
1. Navigate to Speaking Practice
2. Click "Listen" to hear letter
3. Record pronunciation
4. Show transcript display
5. Submit and show celebration
6. Demonstrate retry

### Technical Highlights (1 minute)
- "Uses Tesseract.js for client-side OCR"
- "Web Speech API for voice recognition"
- "Built with Next.js and React"
- "No backend required - everything runs in browser"

### Closing (30 seconds)
"AksharA makes learning fun with gamification, instant feedback, and AI-powered recognition. It's accessible, engaging, and effective for young learners."

---

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

---

## Dependencies

```json
{
  "next": "15.5.6",
  "react": "^19.0.0",
  "tesseract.js": "^5.1.1",
  "tailwindcss": "^3.4.1",
  "typescript": "^5"
}
```

---

## Conclusion

AksharA combines cutting-edge AI technologies with intuitive design to create an engaging, effective learning platform for children. The modular architecture, client-side processing, and gamified experience make it a modern solution for alphabet education.

**Total Lines of Code:** ~2500+
**Total Components:** 7 pages + 1 reusable component
**AI Technologies:** 2 (OCR + Speech Recognition)
**Completion Time:** Fully functional prototype

---

**Prepared for Demo Session**
**Project:** AksharA - AI Alphabet Learning Platform
**Developer:** [Your Name]
**Date:** 2025
