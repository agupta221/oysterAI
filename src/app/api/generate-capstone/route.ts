import { NextResponse } from "next/server";
import { generateCapstoneProject } from "@/lib/openai";
import type { Syllabus } from "@/lib/openai";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { syllabus, userRequest } = await request.json();

    if (!syllabus || !userRequest) {
      return NextResponse.json(
        { error: "Missing syllabus or userRequest in request body" },
        { status: 400 }
      );
    }

    const capstone = await generateCapstoneProject(syllabus, userRequest);
    return NextResponse.json(capstone);
  } catch (error) {
    console.error("Error generating capstone:", error);
    return NextResponse.json(
      { error: "Failed to generate capstone project" },
      { status: 500 }
    );
  }
} 