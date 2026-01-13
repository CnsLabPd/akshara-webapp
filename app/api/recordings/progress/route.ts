// app/api/recordings/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

interface UserProgress {
  [character: string]: number;
}

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'studentId is required' },
        { status: 400 }
      );
    }

    const practiceType = searchParams.get('type') || 'english-alphabets';

    const queryParams = {
      TableName: process.env.STUDENT_PROGRESS_TABLE || 'studentProgress',
      KeyConditionExpression: 'studentId = :sid',
      ExpressionAttributeValues: {
        ':sid': { S: studentId },
      },
    };

    const queryResult = await dynamoClient.send(new QueryCommand(queryParams));

    const progress: UserProgress = {};

    if (queryResult.Items) {
      queryResult.Items.forEach((item) => {
        const character = item.character?.S || '';
        const attempts = item.attempts?.N ? parseInt(item.attempts.N, 10) : 0;

        if (character) {
          progress[character.toLowerCase()] = attempts;
        }
      });
    }

    const allCharacters = getAllCharacters(practiceType);
    let completed = 0;
    let partial = 0;
    let notStarted = 0;

    allCharacters.forEach((char) => {
      const count = progress[char.toLowerCase()] || 0;
      if (count >= 2) {
        completed++;
      } else if (count === 1) {
        partial++;
      } else {
        notStarted++;
      }
    });

    const totalCharacters = allCharacters.length;
    const totalRecordings = completed * 2 + partial;
    const totalRequired = totalCharacters * 2;
    const completionPercentage = Math.round((totalRecordings / totalRequired) * 100);

    return NextResponse.json({
      success: true,
      progress,
      summary: {
        completed,
        partial,
        notStarted,
        totalCharacters,
        completionPercentage,
      },
    });
  } catch (error) {
    console.error('Error getting recordings progress:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

function getAllCharacters(practiceType: string): string[] {
  switch (practiceType) {
    case 'english-alphabets':
      return 'abcdefghijklmnopqrstuvwxyz'.split('');
    case 'english-numbers':
      return '0123456789'.split('');
    default:
      return [];
  }
}
