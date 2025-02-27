import { NextResponse } from "next/server";
import { fetchVideoResources } from "@/lib/serpapi";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('searchQuery');

    // If no parameters provided, return health check
    if (!searchQuery) {
      return NextResponse.json(
        { status: "SERPAPI endpoint is running" },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Check API key
    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json(
        { error: "SERPAPI API key not configured" },
        { status: 500 }
      );
    }

    const resources = await fetchVideoResources(searchQuery);

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        { error: "No video resources found", details: "The API call was successful but returned no resources" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { resources },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Failed to fetch video resources", 
        details: error.message || "Unknown error",
        apiKeyPresent: !!process.env.SERPAPI_API_KEY
      },
      { status: 500 }
    );
  }
} 