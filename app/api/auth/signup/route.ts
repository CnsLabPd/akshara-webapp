// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/ddb";

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  state: string;
  district: string;
  age?: number;
  school?: string;
}

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    // Extract and validate required fields
    const rawEmail = body.email ?? "";
    const password = body.password ?? "";
    const fullName = body.fullName ?? "";
    const state = body.state ?? "";
    const district = body.district ?? "";
    const age = body.age;
    const school = body.school;

    // Normalize email
    const email = rawEmail.trim().toLowerCase();

    // Validate required fields
    if (!email || !password || !fullName || !state || !district) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, full name, state, and district are required"
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password strength validation (basic)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
    const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
    const PROFILE_TABLE_NAME = process.env.PROFILE_TABLE_NAME || "AksharaUserProfiles";

    // Sign up user in Cognito
    try {
      const signUpCommand = new SignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
        ],
      });

      const signUpResponse = await cognitoClient.send(signUpCommand);
      const userSub = signUpResponse.UserSub!;

      // Store profile in DynamoDB
      const createdAt = new Date().toISOString();

      const profileItem: Record<string, any> = {
        usersub: userSub,
        email,
        fullName,
        state,
        district,
        createdAt,
      };

      // Add optional fields if provided
      if (age !== undefined && age !== null) {
        profileItem.age = age;
      }
      if (school) {
        profileItem.school = school;
      }

      await ddb.send(
        new PutCommand({
          TableName: PROFILE_TABLE_NAME,
          Item: profileItem,
        })
      );

      return NextResponse.json({
        success: true,
        userSub,
        email,
        fullName,
      });
    } catch (cognitoError: any) {
      console.error("Cognito signup error:", cognitoError);

      // Handle Cognito-specific errors
      if (cognitoError.name === "UsernameExistsException") {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists" },
          { status: 409 }
        );
      }

      if (cognitoError.name === "InvalidPasswordException") {
        return NextResponse.json(
          { success: false, message: "Password does not meet requirements" },
          { status: 400 }
        );
      }

      if (cognitoError.name === "InvalidParameterException") {
        return NextResponse.json(
          { success: false, message: cognitoError.message || "Invalid parameters provided" },
          { status: 400 }
        );
      }

      // Generic error
      throw cognitoError;
    }
  } catch (err) {
    console.error("Error in signup:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
