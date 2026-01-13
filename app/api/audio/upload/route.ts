// app/api/audio/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { sanitizeNameForS3 } from '@/lib/s3-utils';

const REGION = process.env.AWS_REGION || 'ap-south-1';

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const teacherUserId = formData.get('teacherUserId') as string;
    let teacherName = formData.get('teacherName') as string;
    const studentId = formData.get('studentId') as string;
    const studentName = formData.get('studentName') as string;
    const character = formData.get('character') as string;
    const audioFile = formData.get('audio') as File;

    if (!teacherUserId || !studentId || !studentName || !character || !audioFile) {
      return NextResponse.json(
        { error: 'Missing required fields: teacherUserId, studentId, studentName, character, audio' },
        { status: 400 }
      );
    }

    const STUDENT_PROFILES_TABLE = process.env.STUDENT_PROFILES_TABLE || 'studentProfiles';
    const STUDENT_PROGRESS_TABLE = process.env.STUDENT_PROGRESS_TABLE || 'studentProgress';
    const PROFILE_TABLE_NAME = process.env.PROFILE_TABLE_NAME || 'AksharaUserProfiles';
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'akshara-audio-collection-dev';

    const validateParams = {
      TableName: STUDENT_PROFILES_TABLE,
      Key: {
        teacherUserId: { S: teacherUserId },
        studentId: { S: studentId },
      },
    };

    const validateResult = await dynamoClient.send(new GetItemCommand(validateParams));

    if (!validateResult.Item) {
      return NextResponse.json(
        { error: 'Student does not belong to this teacher' },
        { status: 403 }
      );
    }

    // Fetch teacher name from DynamoDB if not provided
    if (!teacherName) {
      const teacherProfileParams = {
        TableName: PROFILE_TABLE_NAME,
        Key: {
          usersub: { S: teacherUserId },
        },
      };

      const teacherProfileResult = await dynamoClient.send(new GetItemCommand(teacherProfileParams));

      if (teacherProfileResult.Item?.fullName?.S) {
        teacherName = teacherProfileResult.Item.fullName.S;
      } else {
        teacherName = 'teacher';
      }
    }

    const getProgressParams = {
      TableName: STUDENT_PROGRESS_TABLE,
      Key: {
        studentId: { S: studentId },
        character: { S: character },
      },
    };

    const getProgressResult = await dynamoClient.send(new GetItemCommand(getProgressParams));

    const currentAttempts = getProgressResult.Item?.attempts?.N
      ? parseInt(getProgressResult.Item.attempts.N, 10)
      : 0;

    if (currentAttempts >= 2) {
      return NextResponse.json(
        {
          error: 'Maximum attempts exceeded',
          message: `Student has already uploaded audio for character "${character}" 2 times.`,
          attempts: currentAttempts,
        },
        { status: 403 }
      );
    }

    const newAttemptNumber = currentAttempts + 1;

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use sanitized teacher and student names for S3 key
    const sanitizedTeacherName = sanitizeNameForS3(teacherName);
    const sanitizedStudentName = sanitizeNameForS3(studentName);
    const s3Key = `audio/${sanitizedTeacherName}/${sanitizedStudentName}/${character}/attempt${newAttemptNumber}.webm`;

    const putObjectParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: audioFile.type || 'audio/webm',
    };

    await s3Client.send(new PutObjectCommand(putObjectParams));

    const updateParams = {
      TableName: STUDENT_PROGRESS_TABLE,
      Key: {
        studentId: { S: studentId },
        character: { S: character },
      },
      UpdateExpression: 'SET attempts = :attempts, updatedAt = :updatedAt, studentName = :studentName',
      ExpressionAttributeValues: {
        ':attempts': { N: newAttemptNumber.toString() },
        ':updatedAt': { S: new Date().toISOString() },
        ':studentName': { S: studentName },
      },
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));

    return NextResponse.json({
      success: true,
      character,
      attemptNumber: newAttemptNumber,
      s3Key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
