import { NextResponse } from "next/server";
import { fetchResourcesForTopic } from "@/lib/perplexity";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Perplexity API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { topicTitle, subsectionTitle, userRequest } = await request.json();

    if (!topicTitle || !subsectionTitle || !userRequest) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resources = await fetchResourcesForTopic(
      topicTitle,
      subsectionTitle,
      userRequest
    );

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
} 