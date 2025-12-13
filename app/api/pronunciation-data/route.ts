import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.character || !data.practiceType || !data.userAudio || !data.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create pronunciation-data directory if it doesn't exist
    const baseDir = path.join(process.cwd(), 'Pronunciation-data');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    // Create subdirectory for practice type
    const practiceTypeDir = path.join(baseDir, data.practiceType);
    if (!fs.existsSync(practiceTypeDir)) {
      fs.mkdirSync(practiceTypeDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${data.practiceType}_${data.character}_attempt${data.attemptNumber}_${timestamp}.json`;
    const filepath = path.join(practiceTypeDir, filename);

    // Prepare data for storage
    const storageData = {
      character: data.character,
      expectedPronunciation: data.expectedPronunciation,
      transcript: data.transcript,
      timestamp: data.timestamp,
      sessionId: data.sessionId,
      attemptNumber: data.attemptNumber,
      practiceType: data.practiceType,
      userAudio: data.userAudio, // Base64 encoded audio
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.ip || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(storageData, null, 2));

    // Also create a separate audio file if needed
    if (data.userAudio && data.userAudio.startsWith('data:audio')) {
      const audioFileName = `${data.practiceType}_${data.character}_attempt${data.attemptNumber}_${timestamp}.webm`;
      const audioFilePath = path.join(practiceTypeDir, audioFileName);
      
      // Extract base64 data and save as file
      const base64Data = data.userAudio.split(',')[1];
      fs.writeFileSync(audioFilePath, base64Data, 'base64');
      
      // Update JSON with audio file reference
      storageData.metadata = {
        ...storageData.metadata,
        audioFile: audioFileName
      };
      fs.writeFileSync(filepath, JSON.stringify(storageData, null, 2));
    }

    console.log(`Pronunciation data saved: ${filename}`);

    return NextResponse.json({
      success: true,
      filepath: filepath,
      filename: filename,
      message: 'Pronunciation data saved successfully'
    });

  } catch (error) {
    console.error('Error saving pronunciation data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'Pronunciation-data');
    
    if (!fs.existsSync(baseDir)) {
      return NextResponse.json({
        success: true,
        data: {
          'english-alphabets': 0,
          'english-numbers': 0,
          'tamil-alphabets': 0,
          'tamil-consonants': 0,
          total: 0
        }
      });
    }

    const stats = {
      'english-alphabets': 0,
      'english-numbers': 0,
      'tamil-alphabets': 0,
      'tamil-consonants': 0,
      total: 0
    };

    // Count files in each directory
    const practiceTypes = ['english-alphabets', 'english-numbers', 'tamil-alphabets', 'tamil-consonants'];
    
    practiceTypes.forEach(practiceType => {
      const dir = path.join(baseDir, practiceType);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
        stats[practiceType as keyof typeof stats] = files.length;
        stats.total += files.length;
      }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting pronunciation data stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}