import { NextResponse } from "next/server";
import { generateCourseSummary } from "@/lib/openai";
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
  // Check for required API keys and credentials
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasEnvCredentials = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID;
  const hasFileCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasSerpApiKey = !!process.env.SERPAPI_API_KEY;
  
  if (!hasOpenAIKey || (!hasEnvCredentials && !hasFileCredentials) || !hasSerpApiKey) {
    return NextResponse.json(
      { error: "Missing required API keys or credentials" },
      { status: 500 }
    );
  }

  try {
    const { syllabus, userRequest } = await request.json();
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Process all tasks in parallel
    const [enrichedSections, summary, audioData] = await Promise.all([
      // Process sections and fetch resources
      Promise.all(
        syllabus.sections.map(async (section: Section) => {
          const enrichedSubsections = await Promise.all(
            section.subsections.map(async (subsection: Subsection) => {
              const enrichedTopics = await Promise.all(
                subsection.topics.map(async (topic: Topic) => {
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
                      throw new Error('Failed to fetch video resources');
                    }

                    const { resources } = await response.json();
                    return {
                      ...topic,
                      resources,
                    };
                  } catch (error) {
                    return {
                      ...topic,
                      resources: [],
                    };
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
      ),
      // Generate course summary
      generateCourseSummary(syllabus),
      // Generate audio for the summary
      generateCourseSummary(syllabus).then(summaryText => 
        generateSpeech(summaryText)
      ),
    ]);

    const enrichedSyllabus: SyllabusWithResources = {
      ...syllabus,
      sections: enrichedSections,
    };

    // Convert audio data to base64
    const audioBuffer = Buffer.from(audioData);
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      syllabus: enrichedSyllabus,
      summary,
      audioData: base64Audio,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to enrich course" },
      { status: 500 }
    );
  }
}