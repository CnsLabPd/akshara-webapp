// app/api/students/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/ddb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherUserId = searchParams.get("teacherUserId");

    if (!teacherUserId) {
      return NextResponse.json(
        { success: false, message: "teacherUserId is required" },
        { status: 400 }
      );
    }

    const result = await ddb.send(
      new QueryCommand({
        TableName: process.env.STUDENT_PROFILES_TABLE || "studentProfiles",
        KeyConditionExpression: "teacherUserId = :tid",
        ExpressionAttributeValues: {
          ":tid": teacherUserId,
        },
      })
    );

    return NextResponse.json({
      success: true,
      students: result.Items || [],
    });
  } catch (err: any) {
    console.error("Error listing students:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to list students" },
      { status: 500 }
    );
  }
}
