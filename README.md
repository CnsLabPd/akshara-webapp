# AksharA - Learn English Alphabet Writing

An interactive web application designed to help children learn to write English alphabets (A-Z) using AI-powered handwriting recognition with comprehensive learning modes.

## Features

### Core Features
- **Interactive Drawing Canvas**: Draw letters directly on a responsive canvas using mouse or touch
- **AI-Powered Recognition**: Uses Tesseract.js OCR to recognize handwritten letters
- **Multi-Mode Learning**: Practice and Test modes for different learning approaches
- **Smart Corrected Tests**: Automatic retest system for incorrect answers until mastery
- **Language Selection**: Choose your preferred language (currently English)
- **Score Tracking**: Comprehensive scoring system with grades
- **Child-Friendly UI**: Colorful, engaging interface designed for children
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

### Learning Modes

#### 1. Practice Mode
- Learn at your own pace
- Instant feedback on drawings
- Navigate freely between letters
- Unlimited attempts per letter
- No pressure testing

#### 2. Test Mode
- Single attempt per letter
- Submit button for controlled progression
- Tracks wrong answers
- Generates corrected tests automatically
- Complete scoring system

#### 3. Corrected Test Cycle
- Automatically tests on wrong answers only
- Repeats until all letters are mastered
- Progressive learning approach
- Prevents moving forward until mastery

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Tesseract.js** - OCR engine for handwriting recognition
- **HTML5 Canvas** - Drawing functionality
- **Local Storage** - Test results and progress persistence

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd akshara
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Flow

### First Time User
1. **Home Page**: "Let's Learn Alphabets!"
2. **Language Selection**: Choose English (expandable to more languages)
3. **Mode Selection**: Choose between Practice or Test mode

### Practice Mode Flow
1. View current letter to practice
2. Draw the letter on canvas
3. Get instant feedback
4. Navigate freely using Previous/Next buttons
5. Repeat as many times as needed

### Test Mode Flow
1. View current letter
2. Draw the letter carefully
3. Click "Submit Answer" (single attempt)
4. Move to next letter automatically
5. After all 26 letters, view results
6. Options:
   - **Home**: Return to home page
   - **Corrected Test**: Retake only wrong letters
   - **Retake Full Test**: Start over with all 26 letters

### Corrected Test Cycle
1. Presented with only the letters you got wrong
2. Submit each answer (single attempt)
3. If you make mistakes again:
   - Those letters go to another corrected test
4. Continue until you master all letters
5. Receive congratulations when all letters are mastered!

## Project Structure

```
akshara/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page with language/mode selection
│   ├── practice/
│   │   └── page.tsx            # Practice mode
│   ├── test/
│   │   └── page.tsx            # Test mode
│   ├── results/
│   │   └── page.tsx            # Results page with corrected test option
│   ├── corrected-test/
│   │   └── page.tsx            # Corrected test for wrong answers
│   └── globals.css             # Global styles
├── components/
│   └── DrawingCanvas.tsx       # Reusable drawing canvas component
├── public/                     # Static assets
└── package.json                # Dependencies and scripts
```

## Key Components

### DrawingCanvas Component
- Handles mouse and touch events for drawing
- Exports canvas data as image for OCR processing
- Includes clear functionality
- Disabled state during processing

### Home Page
- Language selection interface
- Mode selection (Practice/Test)
- Information about the app

### Practice Mode
- Free navigation between letters
- Instant OCR feedback
- Score tracking for motivation
- No pressure environment

### Test Mode
- Linear progression through alphabets
- Submit button for controlled testing
- Single attempt policy
- Wrong answer tracking

### Results Page
- Grade display (A+ to D)
- Score breakdown
- List of wrong answers
- Navigation options
- Conditional rendering for corrected test availability

### Corrected Test
- Dynamic letter list based on wrong answers
- Same test format as main test
- Recursive correction system
- Mastery celebration when complete

## Scoring System

- **Grade A+**: 90-100% (Outstanding!)
- **Grade A**: 80-89% (Excellent!)
- **Grade B**: 70-79% (Good Job!)
- **Grade C**: 60-69% (Keep Practicing!)
- **Grade D**: Below 60% (Need More Practice)

## Build for Production

```bash
npm run build
npm start
```

## Future Enhancements

- Add lowercase alphabet practice (a-z)
- Include number writing (0-9)
- Add multiple languages (Hindi, Spanish, French, etc.)
- Implement sound effects and animations
- Add difficulty levels (beginner, intermediate, advanced)
- Store user progress with authentication
- Add timed tests
- Include handwriting improvement tips
- Parent dashboard to track child progress
- Certificate generation on completion

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please open an issue on GitHub.
