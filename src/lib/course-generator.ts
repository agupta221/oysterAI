import type { Syllabus, Section, Subsection, Topic } from "./openai";
import { fetchResourcesForTopic, type Resource } from "./perplexity";
import { generateCourseSummary } from "./openai";

interface TopicWithResources extends Topic {
  resources: Resource[];
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

export async function enrichSyllabusWithResources(
  syllabus: Syllabus,
  userRequest: string
): Promise<{ syllabus: Syllabus; summary: string; audioUrl: string }> {
  try {
    const response = await fetch('/api/enrich-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ syllabus, userRequest }),
    });

    if (!response.ok) {
      throw new Error('Failed to enrich course');
    }

    const { syllabus: enrichedSyllabus, summary, audioData } = await response.json();

    // Create a Blob URL for the audio
    const audioBlob = new Blob(
      [Buffer.from(audioData, 'base64')],
      { type: 'audio/mpeg' }
    );
    const audioUrl = URL.createObjectURL(audioBlob);

    return { syllabus: enrichedSyllabus, summary, audioUrl };
  } catch (error) {
    throw error;
  }
} 