// app/api/auth/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

interface ConfirmRequest {
  email: string;
  code: string;
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
    const body: ConfirmRequest = await request.json();

    // Extract and validate fields
    const rawEmail = body.email ?? "";
    const code = body.code ?? "";

    // Normalize email
    const email = rawEmail.trim().toLowerCase();

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, message: "Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

    // Confirm signup with Cognito
    try {
      const confirmCommand = new ConfirmSignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      });

      await cognitoClient.send(confirmCommand);

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (cognitoError: any) {
      console.error("Cognito confirm error:", cognitoError);

      // Handle Cognito-specific errors
      if (cognitoError.name === "CodeMismatchException") {
        return NextResponse.json(
          { success: false, message: "Invalid verification code. Please check and try again." },
          { status: 400 }
        );
      }

      if (cognitoError.name === "ExpiredCodeException") {
        return NextResponse.json(
          { success: false, message: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (cognitoError.name === "NotAuthorizedException") {
        return NextResponse.json(
          { success: false, message: "User is already confirmed or invalid request" },
          { status: 400 }
        );
      }

      if (cognitoError.name === "UserNotFoundException") {
        return NextResponse.json(
          { success: false, message: "User not found. Please sign up first." },
          { status: 404 }
        );
      }

      if (cognitoError.name === "TooManyRequestsException") {
        return NextResponse.json(
          { success: false, message: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }

      if (cognitoError.name === "LimitExceededException") {
        return NextResponse.json(
          { success: false, message: "Attempt limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      // Generic error
      throw cognitoError;
    }
  } catch (err) {
    console.error("Error in confirm:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
