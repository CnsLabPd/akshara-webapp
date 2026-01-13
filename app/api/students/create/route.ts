// app/api/students/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/ddb";
import { randomUUID } from "crypto";

interface CreateStudentRequest {
  teacherUserId: string;
  studentName: string;
  class?: string;
  section?: string;
  rollNo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStudentRequest = await request.json();

    const { teacherUserId, studentName, class: studentClass, section, rollNo } = body;

    if (!teacherUserId || !studentName) {
      return NextResponse.json(
        { success: false, message: "teacherUserId and studentName are required" },
        { status: 400 }
      );
    }

    const studentId = randomUUID();
    const createdAt = new Date().toISOString();

    const studentItem: Record<string, any> = {
      teacherUserId,
      studentId,
      studentName,
      createdAt,
    };

    if (studentClass) studentItem.class = studentClass;
    if (section) studentItem.section = section;
    if (rollNo) studentItem.rollNo = rollNo;

    await ddb.send(
      new PutCommand({
        TableName: process.env.STUDENT_PROFILES_TABLE || "studentProfiles",
        Item: studentItem,
      })
    );

    return NextResponse.json({
      success: true,
      student: studentItem,
    });
  } catch (err: any) {
    console.error("Error creating student:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to create student" },
      { status: 500 }
    );
  }
}
