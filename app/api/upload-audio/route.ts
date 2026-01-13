import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { sanitizeNameForS3 } from "@/lib/s3-utils";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("audio") as File;
  const letter = formData.get("letter") as string;
  const userId = formData.get("userId") as string;
  const userName = formData.get("userName") as string;

  if (!file || !letter || !userId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Use sanitized user name if provided, otherwise use userId
  const sanitizedName = userName ? sanitizeNameForS3(userName) : sanitizeNameForS3(userId);
  const key = `english/alphabets/${letter}/${sanitizedName}_${Date.now()}.wav`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "audio/wav"
    })
  );

  return NextResponse.json({ success: true, key });
}
