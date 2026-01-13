// app/api/auth/resend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";

interface ResendRequest {
  email: string;
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
    const body: ResendRequest = await request.json();

    // Extract and validate field
    const rawEmail = body.email ?? "";

    // Normalize email
    const email = rawEmail.trim().toLowerCase();

    // Validate required field
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
''
    const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

    // Resend confirmation code via Cognito
    try {
      const resendCommand = new ResendConfirmationCodeCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
      });

      await cognitoClient.send(resendCommand);

      return NextResponse.json({
        success: true,
        message: "Verification code resent successfully",
      });
    } catch (cognitoError: any) {
      console.error("Cognito resend error:", cognitoError);

      // Handle Cognito-specific errors
      if (cognitoError.name === "UserNotFoundException") {
        return NextResponse.json(
          { success: false, message: "User not found. Please sign up first." },
          { status: 404 }
        );
      }

      if (cognitoError.name === "InvalidParameterException") {
        return NextResponse.json(
          { success: false, message: "User is already confirmed or invalid request" },
          { status: 400 }
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
    console.error("Error in resend:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
