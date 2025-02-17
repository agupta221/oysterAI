import { NextResponse } from "next/server";
import { generateSyllabus } from "@/lib/openai";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt in request body" },
        { status: 400 }
      );
    }

    const response = await generateSyllabus(prompt);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating syllabus:", error);
    return NextResponse.json(
      { error: "Failed to generate syllabus" },
      { status: 500 }
    );
  }
} 
