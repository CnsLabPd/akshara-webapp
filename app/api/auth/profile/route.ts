// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/ddb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userSub = searchParams.get('userSub');

    if (!userSub) {
      return NextResponse.json(
        { success: false, message: "userSub is required" },
        { status: 400 }
      );
    }

    const PROFILE_TABLE_NAME = process.env.PROFILE_TABLE_NAME || "AksharaUserProfiles";

    // Fetch profile from DynamoDB
    const result = await ddb.send(
      new GetCommand({
        TableName: PROFILE_TABLE_NAME,
        Key: { usersub: userSub },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      userSub: result.Item.usersub,
      email: result.Item.email,
      fullName: result.Item.fullName,
      state: result.Item.state,
      district: result.Item.district,
      age: result.Item.age,
      school: result.Item.school,
      createdAt: result.Item.createdAt,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
