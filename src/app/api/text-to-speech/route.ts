import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
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