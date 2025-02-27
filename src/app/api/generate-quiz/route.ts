import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Topic, Syllabus } from '@/lib/openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Using server-side environment variable
})

export async function POST(request: Request) {
  try {
    const { topic, syllabus } = await request.json()

    const prompt = `Generate 4 multiple choice questions for the following topic: "${topic.title}"
  
Topic Description: ${topic.description}

Course Context:
${JSON.stringify(syllabus, null, 2)}

Requirements:
1. Generate exactly 4 questions:
   - 1 easy question
   - 1 medium question
   - 2 hard questions
2. Each question should have exactly 4 options
3. Provide the correct answer index (0-3) and explanation for each question
4. Questions should test understanding, not just memorization
5. Format the response as a JSON array of objects with the following structure:
   {
     "text": "question text",
     "options": ["option1", "option2", "option3", "option4"],
     "correctAnswer": 0-3,
     "explanation": "explanation text",
     "difficulty": "easy|medium|hard"
   }

Return only valid JSON, no other text.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a quiz generator that creates high-quality multiple choice questions. You always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("Failed to generate quiz questions")
    }

    const result = JSON.parse(content)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    )
  }
} 