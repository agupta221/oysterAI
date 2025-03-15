import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { VideoResource } from "./serpapi"

export interface Topic {
  id: string;
  title: string;
  description?: string;
  searchQuery: string;
  isCompleted?: boolean;
  resources?: VideoResource[];
  questions?: TopicQuestion[];
}

export interface TopicQuestion {
  question: string;
  answer: string;
  searchQuery: string;
}

export interface Subsection {
  title: string;
  description: string;
  topics: Topic[];
}

export interface Section {
  title: string;
  description: string;
  subsections: Subsection[];
}

export interface SyllabusBase {
  sections: Section[];
}

// Define the schema for our syllabus structure
export const SyllabusSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      subsections: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          topics: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              searchQuery: z.string(),
            })
          ),
        })
      ),
    })
  ),
});

export type Syllabus = z.infer<typeof SyllabusSchema>;

export const SyllabusResponseSchema = z.object({
  syllabus: SyllabusSchema,
  description: z.string(),
});

export type SyllabusResponse = z.infer<typeof SyllabusResponseSchema>;

const SYSTEM_PROMPT = `You are an expert course creator. Your task is to create detailed, well-structured course syllabi based on user requirements.
Each syllabus should be comprehensive yet focused, with clear learning objectives and a logical progression of topics.

For each topic, you must include:
1. A clear, descriptive title
2. A concise description of what will be learned
3. A specific 7-8 word search query that will be used to find relevant educational videos
   - The search query should be highly specific and include technical terms
   - Include words like "tutorial", "guide", or "explained" to find educational content
   - Focus on the exact concept being taught, not general topics
   - Example: "React Redux State Management Tutorial for Beginners"

Structure requirements:
- Include 5-6 main sections
- Each section should have 2-3 subsections
- Each subsection should have 2-3 specific topics
- Ensure each section and subsection has clear, actionable learning outcomes
- Keep descriptions concise but informative

Along with the syllabus, provide a 2-3 line description explaining what you created and how it addresses the user's needs.`;

const MODIFICATION_PROMPT = `You are an expert course creator tasked with modifying an existing course syllabus based on user feedback.
Your task is to analyze the current syllabus and the user's modification request, then generate an updated syllabus that:
1. Maintains the same structured format
2. Incorporates the user's requested changes
3. Preserves relevant parts of the original syllabus
4. Ensures logical flow and progression
5. Keeps the same level of detail and professionalism

For each topic, you must maintain or create:
1. A clear, descriptive title
2. A concise description of what will be learned
3. A specific 7-8 word search query that will be used to find relevant educational videos
   - The search query should be highly specific and include technical terms
   - Include words like "tutorial", "guide", or "explained" to find educational content
   - Focus on the exact concept being taught, not general topics
   - Example: "React Redux State Management Tutorial for Beginners"

Along with the modified syllabus, provide a 2-3 line description explaining what changes you made and how they address the user's requests.

The syllabus output should be a complete syllabus that can stand on its own, not just the modifications.`;

const SUMMARY_PROMPT = `You are an enthusiastic and engaging course creator. 
Your task is to create an exciting and comprehensive overview of a course based on its syllabus. The summary should be 5-6 sentences and should start with a greeting. 
The text should read like a story, with a beginning, middle, and end. It should be engaging and interesting. Don't include any other text than the summary. Don't include any asterisks or anything that a voice to text engine would have trouble reading.


Your summary should:
1. Be upbeat and motivating
2. Highlight the key learning outcomes
3. Showcase the progression of learning through the sections at a very high level
4. Emphasize the practical skills and knowledge students will gain
5. Use friendly, conversational language
6. Get students excited about their learning journey
7. Do not exceed more than 6 sentences

Focus on making the student feel empowered and eager to begin their learning adventure!`;

const CAPSTONE_PROMPT = `You are an expert course creator tasked with designing a comprehensive capstone project that tests and reinforces all the key learnings from a course.

Your task is to create a detailed, multi-section capstone project that:
1. Integrates concepts from across the entire course syllabus
2. Provides practical, hands-on application of learned skills
3. Builds progressively through multiple sections
4. Has clear, actionable instructions and expected outputs
5. Challenges students while remaining achievable

For each section:
1. Provide a clear title that indicates the focus area
2. Write a brief description of what will be accomplished
3. Include step-by-step instructions (3-5 detailed steps)
4. Specify the expected output/deliverable

The capstone should:
- Be substantial enough to demonstrate mastery
- Build on previous sections
- Include both technical and conceptual elements
- Result in a meaningful final project
- Be clearly scoped and achievable

Format the response as a JSON object with the following structure:
{
  "title": "Project title",
  "description": "Overall project description",
  "sections": [
    {
      "title": "Section title",
      "description": "Section description",
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "expectedOutput": "Description of expected output"
    }
  ]
}`;

export const CapstoneProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      instructions: z.array(z.string()),
      expectedOutput: z.string(),
    })
  ),
});

export type CapstoneProject = z.infer<typeof CapstoneProjectSchema>;

export const TopicQuestionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      searchQuery: z.string(),
    })
  ),
});

export type TopicQuestions = z.infer<typeof TopicQuestionSchema>;

const TOPIC_QUESTIONS_PROMPT = `You are an expert educator tasked with generating the 5 most likely questions a student would ask when learning about a specific topic in a course.

For each question:
1. Create a clear, concise question that addresses a key aspect of the topic
2. Provide a detailed 6-7 line answer that thoroughly explains the concept
3. Generate a specific YouTube search query (7-8 words) that would find a video to supplement the answer
   - The search query should be highly specific and include technical terms
   - Include words like "tutorial", "guide", or "explained" to find educational content
   - Focus on the exact concept being asked about
   - Example: "React Redux State Management Tutorial for Beginners"

Your response should include 5 questions that:
- Cover different aspects of the topic
- Progress from fundamental to more advanced concepts
- Address common points of confusion
- Help reinforce the key learning objectives

Format the response as a JSON object with the following structure:
{
  "questions": [
    {
      "question": "Question text?",
      "answer": "Detailed 6-7 line answer",
      "searchQuery": "Specific YouTube search query"
    }
  ]
}`;

export async function generateSyllabus(userInput: string): Promise<SyllabusResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userInput },
    ],
    response_format: zodResponseFormat(SyllabusResponseSchema, "response"),
    temperature: 0.7,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new Error("Failed to parse OpenAI response");
  }

  return parsed;
}

export async function modifySyllabus(
  currentSyllabus: Syllabus,
  userModifications: string
): Promise<SyllabusResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: MODIFICATION_PROMPT },
      { 
        role: "user", 
        content: `Current Syllabus: ${JSON.stringify(currentSyllabus, null, 2)}\n\nRequested Modifications: ${userModifications}`
      },
    ],
    response_format: zodResponseFormat(SyllabusResponseSchema, "response"),
    temperature: 0.7,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new Error("Failed to parse OpenAI response");
  }

  return parsed;
}

export async function generateCourseSummary(syllabus: Syllabus): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      { role: "system", content: SUMMARY_PROMPT },
      { 
        role: "user", 
        content: `Please create an exciting course overview based on this syllabus: ${JSON.stringify(syllabus, null, 2)}`
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content || "Failed to generate course summary";
}

export async function generateCapstoneProject(
  syllabus: Syllabus,
  userRequest: string
): Promise<CapstoneProject> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: CAPSTONE_PROMPT },
      { 
        role: "user", 
        content: `Original Course Request: ${userRequest}\n\nCourse Syllabus: ${JSON.stringify(syllabus, null, 2)}\n\nPlease generate a comprehensive capstone project that allows students to demonstrate their mastery of the course material.`
      },
    ],
    response_format: zodResponseFormat(CapstoneProjectSchema, "response"),
    temperature: 0.7,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new Error("Failed to parse OpenAI response");
  }

  return parsed;
}

export async function generateTopicQuestions(
  topic: Topic,
  syllabus: Syllabus,
  userRequest: string
): Promise<TopicQuestions> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  console.log(`Generating questions for topic: ${topic.title}`);

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      { role: "system", content: TOPIC_QUESTIONS_PROMPT },
      { 
        role: "user", 
        content: `Original Course Request: ${userRequest}\n\nCourse Syllabus Context: ${JSON.stringify(syllabus, null, 2)}\n\nCurrent Topic: ${JSON.stringify(topic, null, 2)}\n\nPlease generate 5 questions, detailed answers, and search queries for this specific topic.`
      },
    ],
    response_format: zodResponseFormat(TopicQuestionSchema, "response"),
    temperature: 0.7,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new Error("Failed to parse OpenAI response for topic questions");
  }

  console.log(`Successfully generated ${parsed.questions.length} questions for topic: ${topic.title}`);
  return parsed;
} 
