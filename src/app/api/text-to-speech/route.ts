import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/google-tts";

export async function POST(request: Request) {
  // Check for Google Cloud credentials
  const hasEnvCredentials = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID;
  const hasFileCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!hasEnvCredentials && !hasFileCredentials) {
    return NextResponse.json(
      { error: "Google Cloud credentials not configured. Set either GOOGLE_APPLICATION_CREDENTIALS or individual credential environment variables." },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Missing text in request body" },
        { status: 400 }
      );
    }

    const audioData = await generateSpeech(text);
    
    // Convert ArrayBuffer to Base64
    const buffer = Buffer.from(audioData);
    const base64Audio = buffer.toString('base64');

    return NextResponse.json({ audioData: base64Audio });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
} 