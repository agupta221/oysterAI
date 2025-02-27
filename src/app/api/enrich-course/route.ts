import { NextResponse } from "next/server";
import { generateCourseSummary, generateCapstoneProject } from "@/lib/openai";
import { generateSpeech } from "@/lib/google-tts";
import type { VideoResource } from "@/lib/serpapi";
import type { Syllabus, Section, Subsection, Topic } from "@/lib/openai";
import { headers } from "next/headers";

interface TopicWithResources extends Topic {
  resources: VideoResource[];
}

interface SubsectionWithResources extends Subsection {
  topics: TopicWithResources[];
}

interface SectionWithResources extends Section {
  subsections: SubsectionWithResources[];
}

interface SyllabusWithResources extends Syllabus {
  sections: SectionWithResources[];
}

export async function POST(request: Request) {
  try {
    const { syllabus, userRequest } = await request.json();
    
    if (!syllabus || !userRequest) {
      return NextResponse.json(
        { error: "Missing required syllabus or userRequest" },
        { status: 400 }
      );
    }

    // Check for required API keys and credentials
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasEnvCredentials = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID;
    const hasFileCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasSerpApiKey = !!process.env.SERPAPI_API_KEY;
    
    if (!hasOpenAIKey) {
      throw new Error("OpenAI API key not configured");
    }

    const headersList = headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Process sections and fetch resources
    const enrichedSections = await Promise.all(
      syllabus.sections.map(async (section: Section) => {
        const enrichedSubsections = await Promise.all(
          section.subsections.map(async (subsection: Subsection) => {
            const enrichedTopics = await Promise.all(
              subsection.topics.map(async (topic: Topic) => {
                if (!hasSerpApiKey) {
                  return { ...topic, resources: [] };
                }

                try {
                  const queryParams = new URLSearchParams({
                    searchQuery: topic.searchQuery,
                  }).toString();

                  const response = await fetch(`${baseUrl}/api/serpapi?${queryParams}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  if (!response.ok) {
                    console.error(`Failed to fetch resources for topic: ${topic.title}`);
                    return { ...topic, resources: [] };
                  }

                  const { resources } = await response.json();
                  return { ...topic, resources };
                } catch (error) {
                  console.error(`Error fetching resources for topic: ${topic.title}`, error);
                  return { ...topic, resources: [] };
                }
              })
            );

            return {
              ...subsection,
              topics: enrichedTopics,
            };
          })
        );

        return {
          ...section,
          subsections: enrichedSubsections,
        };
      })
    );

    // Create enriched syllabus
    const enrichedSyllabus: SyllabusWithResources = {
      ...syllabus,
      sections: enrichedSections,
    };

    // Generate course summary
    let summary: string;
    try {
      summary = await generateCourseSummary(syllabus);
    } catch (error) {
      console.error('Error generating course summary:', error);
      summary = "Course summary generation failed. Please try again later.";
    }

    // Generate audio for the summary
    let audioData: ArrayBuffer | null = null;
    if (hasEnvCredentials || hasFileCredentials) {
      try {
        audioData = await generateSpeech(summary);
      } catch (error) {
        console.error('Error generating speech:', error);
      }
    }

    // Generate capstone project
    let capstone = null;
    try {
      capstone = await generateCapstoneProject(syllabus, userRequest);
    } catch (error) {
      console.error('Error generating capstone project:', error);
    }

    // Convert audio data to base64 if available
    const base64Audio = audioData ? Buffer.from(audioData).toString('base64') : null;

    return NextResponse.json({
      syllabus: enrichedSyllabus,
      summary,
      audioData: base64Audio,
      capstone,
    });
  } catch (error) {
    console.error('Error in enrich-course:', error);
    return NextResponse.json(
      { 
        error: "Failed to enrich course",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}