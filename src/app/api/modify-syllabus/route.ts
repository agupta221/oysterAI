import { NextResponse } from "next/server";
import { modifySyllabus } from "@/lib/openai";
import type { Syllabus } from "@/lib/openai";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { currentSyllabus, modifications } = await request.json();

    if (!currentSyllabus || !modifications) {
      return NextResponse.json(
        { error: "Missing currentSyllabus or modifications in request body" },
        { status: 400 }
      );
    }

    const response = await modifySyllabus(currentSyllabus, modifications);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error modifying syllabus:", error);
    return NextResponse.json(
      { error: "Failed to modify syllabus" },
      { status: 500 }
    );
  }
} 