import { z } from "zod";

const VideoResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string(),
});

export type VideoResource = z.infer<typeof VideoResourceSchema>;

export async function fetchVideoResources(searchQuery: string): Promise<VideoResource[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SERPAPI_API_KEY environment variable");
  }

  try {
    const response = await fetch(`https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(searchQuery)}&api_key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`SERPAPI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const videoResults = data.video_results || [];
    
    // Take only the first 5 results
    return videoResults.slice(0, 5).map((video: any) => ({
      title: video.title,
      url: video.link,
      description: video.description || "No description available"
    }));
  } catch (error) {
    console.error("Error fetching video resources:", error);
    throw error;
  }
} 