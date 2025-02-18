import { NextResponse } from "next/server";
import { fetchResourcesForTopic } from "@/lib/perplexity";

// Add OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    // Check API key
    if (!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: "Perplexity API key not configured" },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// Add GET method for health check
export async function GET() {
  return NextResponse.json(
    { status: "Perplexity API endpoint is running" },
    { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
} 