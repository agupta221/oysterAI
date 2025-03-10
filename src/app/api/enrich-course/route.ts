import { NextResponse } from "next/server";
import { generateCourseSummary, generateCapstoneProject, generateTopicQuestions } from "@/lib/openai";
import { generateSpeech } from "@/lib/google-tts";
import type { VideoResource } from "@/lib/serpapi";
import type { Syllabus, Section, Subsection, Topic, TopicQuestion } from "@/lib/openai";
import { headers } from "next/headers";

interface TopicWithResources extends Topic {
  resources: VideoResource[];
  questions?: TopicQuestion[];
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
                // Create an array to hold all parallel promises
                const promises = [];
                
                // Promise for fetching video resources
                let resourcesPromise = Promise.resolve([]);
                if (hasSerpApiKey) {
                  resourcesPromise = (async () => {
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
                        return [];
                      }

                      const { resources } = await response.json();
                      return resources;
                    } catch (error) {
                      console.error(`Error fetching resources for topic: ${topic.title}`, error);
                      return [];
                    }
                  })();
                }
                promises.push(resourcesPromise);
                
                // Promise for generating questions
                const questionsPromise = (async () => {
                  try {
                    console.log(`Starting question generation for topic: ${topic.title}`);
                    const result = await generateTopicQuestions(topic, syllabus, userRequest);
                    console.log(`Completed question generation for topic: ${topic.title} with ${result.questions.length} questions`);
                    return result.questions;
                  } catch (error) {
                    console.error(`Error generating questions for topic: ${topic.title}`, error);
                    return [];
                  }
                })();
                promises.push(questionsPromise);
                
                // Wait for all promises to resolve
                const [resources, questions] = await Promise.all(promises);
                
                // Log the structure of the enriched topic
                console.log(`Enriched topic: ${topic.title}`);
                console.log(`- Resources: ${resources.length}`);
                console.log(`- Questions: ${questions.length}`);
                
                if (questions.length > 0) {
                  console.log('- Sample question structure:');
                  console.log(`  - Question: ${questions[0].question}`);
                  console.log(`  - Answer: ${questions[0].answer.substring(0, 50)}...`);
                  console.log(`  - Search Query: ${questions[0].searchQuery}`);
                }
                
                // Return the enriched topic
                return { 
                  ...topic, 
                  resources,
                  questions 
                };
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

    // Log the structure of the enriched syllabus
    console.log('Enriched syllabus structure:');
    console.log(`- Sections: ${enrichedSyllabus.sections.length}`);
    
    let totalSubsections = 0;
    let totalTopics = 0;
    let totalQuestions = 0;
    let totalResources = 0;
    
    enrichedSyllabus.sections.forEach(section => {
      totalSubsections += section.subsections.length;
      
      section.subsections.forEach(subsection => {
        totalTopics += subsection.topics.length;
        
        subsection.topics.forEach(topic => {
          totalResources += topic.resources.length;
          totalQuestions += topic.questions?.length || 0;
        });
      });
    });
    
    console.log(`- Total subsections: ${totalSubsections}`);
    console.log(`- Total topics: ${totalTopics}`);
    console.log(`- Total resources: ${totalResources}`);
    console.log(`- Total questions: ${totalQuestions}`);

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