import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface HandwritingData {
  outputAlphabet: string;
  expectedAlphabet: string;
  grayscaleMatrix: number[][];
  recognitionConfidence: number;
  timestamp: string;
  sessionId: string;
  practiceType: 'capital-alphabets' | 'small-alphabets' | 'numbers';
}

export async function POST(request: NextRequest) {
  try {
    const data: HandwritingData = await request.json();
    
    // Create the base directory path
    const baseDir = path.join(process.cwd(), 'Handwriting-validation');
    const practiceDir = path.join(baseDir, data.practiceType);
    
    // Ensure directories exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    if (!fs.existsSync(practiceDir)) {
      fs.mkdirSync(practiceDir, { recursive: true });
    }
    
    // Create filename with timestamp and expected alphabet
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${data.practiceType}_${data.expectedAlphabet}_${timestamp}.json`;
    const filepath = path.join(practiceDir, filename);
    
    // Prepare the complete data object
    const completeData = {
      outputAlphabet: data.outputAlphabet,
      expectedAlphabet: data.expectedAlphabet,
      grayscaleMatrix: data.grayscaleMatrix,
      recognitionConfidence: data.recognitionConfidence,
      timestamp: data.timestamp,
      sessionId: data.sessionId,
      practiceType: data.practiceType,
      userAgent: request.headers.get('user-agent') || 'unknown',
      savedAt: new Date().toISOString()
    };
    
    // Write the file
    fs.writeFileSync(filepath, JSON.stringify(completeData, null, 2));
    
    console.log(`Handwriting data saved to: ${filepath}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data saved successfully',
      filepath: filename
    });
    
  } catch (error) {
    console.error('Error saving handwriting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save data' },
      { status: 500 }
    );
  }
}