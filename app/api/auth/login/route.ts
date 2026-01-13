// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

interface LoginRequest {
  email: string;
  password: string;
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
    if (!COGNITO_CLIENT_ID) {
      return NextResponse.json(
        { success: false, message: "COGNITO_CLIENT_ID is missing in .env.local" },
        { status: 500 }
      );
    }

    // 1) Login (Auth)
    const authResponse = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    const result = authResponse.AuthenticationResult;

    if (!result?.AccessToken || !result?.IdToken) {
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }

    // 2) Get "sub" (userSub) using access token
    const userResp = await cognitoClient.send(
      new GetUserCommand({ AccessToken: result.AccessToken })
    );

    const sub = userResp.UserAttributes?.find((a) => a.Name === "sub")?.Value;

    if (!sub) {
      return NextResponse.json(
        { success: false, message: "Login succeeded but could not fetch userSub (sub)" },
        { status: 500 }
      );
    }

    // ✅ Return tokens + userSub
    return NextResponse.json({
      success: true,
      userSub: sub,
      email,
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn,
    });
  } catch (err: any) {
    console.error("Cognito login error FULL:", err);

    // Important: map common Cognito errors to correct status
    const name = err?.name;

    if (name === "NotAuthorizedException") {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    if (name === "UserNotFoundException") {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    if (name === "UserNotConfirmedException") {
      return NextResponse.json(
        { success: false, message: "Please verify your email before logging in" },
        { status: 401 }
      );
    }

    if (name === "PasswordResetRequiredException") {
      return NextResponse.json(
        { success: false, message: "Password reset required. Use Forgot Password." },
        { status: 401 }
      );
    }

    if (name === "InvalidParameterException") {
      return NextResponse.json(
        { success: false, message: err?.message || "Invalid parameters / auth flow not enabled" },
        { status: 400 }
      );
    }

    if (name === "TooManyRequestsException") {
      return NextResponse.json(
        { success: false, message: "Too many login attempts. Please try later." },
        { status: 429 }
      );
    }

    // Fallback
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
