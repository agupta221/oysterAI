import { z } from "zod";

const ResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(["video", "article", "paper"]),
  description: z.string(),
});

export type Resource = z.infer<typeof ResourceSchema>;

const ResourceResponseSchema = z.object({
  resources: z.array(ResourceSchema),
});

export async function fetchResourcesForTopic(
  topic: string,
  subsectionTitle: string,
  userRequest: string
): Promise<Resource[]> {
  const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_PERPLEXITY_API_KEY environment variable");
  }

  console.log("\n=== Perplexity API Call ===");
  console.log("Topic:", topic);
  console.log("Subsection:", subsectionTitle);
  console.log("User Request:", userRequest);

  const systemPrompt = `You are an expert at finding high-quality learning resources. Your task is to find 3-5 relevant resources for learning about a specific topic. At least 2 of these should be YouTube videos. The remaining resources can be articles, academic papers, or other educational content.

Your response must be a valid JSON array containing resource objects. Each resource object must have these exact fields:
{
  "title": "string - The title of the resource",
  "url": "string - The URL to access it",
  "type": "string - Either 'video', 'article', or 'paper'",
  "description": "string - Brief description of what the learner will gain"
}

Example response format:
[
  {
    "title": "Introduction to Topic",
    "url": "https://youtube.com/watch?v=example1",
    "type": "video",
    "description": "A comprehensive overview of the topic"
  },
  {
    "title": "Deep Dive Article",
    "url": "https://example.com/article",
    "type": "article",
    "description": "Detailed exploration of key concepts"
  }
]

Requirements:
1. Response MUST be a valid JSON array
2. At least 2 resources must be YouTube videos
3. Resources should be diverse in approach and difficulty
4. All URLs must be valid and accessible
5. Each resource must have all required fields`;

  const userPrompt = `User's learning goal: ${userRequest}
Section being studied: ${subsectionTitle}
Specific topic: ${topic}

Provide 3-5 high-quality learning resources for this topic as a JSON array. Remember to include at least 2 YouTube videos and ensure your response is valid JSON.`;

  try {
    console.log("Making Perplexity API request...");
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API Error:", response.status, response.statusText);
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Perplexity API Response:", data);
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    console.log("Parsing response content:", content);
    let parsedContent;
    try {
      // Try to extract JSON if it's wrapped in text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      throw new Error("Invalid JSON response from Perplexity API");
    }

    const validated = ResourceResponseSchema.parse({ resources: parsedContent });
    
    console.log(`Successfully found ${validated.resources.length} resources for topic "${topic}"`);
    console.log("Resources:", JSON.stringify(validated.resources, null, 2));
    console.log("=== End Perplexity API Call ===\n");
    
    return validated.resources;
  } catch (error) {
    console.error("Error in Perplexity API call:", error);
    console.error("=== End Perplexity API Call (with error) ===\n");
    throw error;
  }
} 
