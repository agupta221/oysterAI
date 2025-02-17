import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export interface Topic {
  title: string;
  description?: string;
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
              description: z.string().optional(),
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
Ensure each section and subsection has clear, actionable learning outcomes.
Keep descriptions concise but informative.
Include 5-6 main sections, each with 2-3 subsections, and 4-5 specific topics per subsection.

Along with the syllabus, provide a 2-3 line description explaining what you created and how it addresses the user's needs.`;

const MODIFICATION_PROMPT = `You are an expert course creator tasked with modifying an existing course syllabus based on user feedback.
Your task is to analyze the current syllabus and the user's modification request, then generate an updated syllabus that:
1. Maintains the same structured format
2. Incorporates the user's requested changes
3. Preserves relevant parts of the original syllabus
4. Ensures logical flow and progression
5. Keeps the same level of detail and professionalism

Along with the modified syllabus, provide a 2-3 line description explaining what changes you made and how they address the user's requests.

The syllabus output should be a complete syllabus that can stand on its own, not just the modifications.`;

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
