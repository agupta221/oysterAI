import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Topic, Syllabus } from '@/lib/openai'
import type { QuizCustomizationOptions } from '@/components/ui/quiz-customization-modal'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Using server-side environment variable
})

export async function POST(request: Request) {
  try {
    const { topic, syllabus, options } = await request.json()
    
    // Default options if not provided
    const quizOptions: QuizCustomizationOptions = options || {
      numQuestions: 4,
      difficulty: 'mixed',
      format: 'multiple-choice',
      additionalRequirements: ''
    }
    
    // Determine the distribution of questions by difficulty
    let easyCount = 0
    let mediumCount = 0
    let hardCount = 0
    
    if (quizOptions.difficulty === 'mixed') {
      // For mixed difficulty, distribute questions evenly
      const totalQuestions = quizOptions.numQuestions
      easyCount = Math.ceil(totalQuestions / 3)
      mediumCount = Math.ceil(totalQuestions / 3)
      hardCount = totalQuestions - easyCount - mediumCount
    } else {
      // For specific difficulty, all questions are that difficulty
      if (quizOptions.difficulty === 'easy') easyCount = quizOptions.numQuestions
      if (quizOptions.difficulty === 'medium') mediumCount = quizOptions.numQuestions
      if (quizOptions.difficulty === 'hard') hardCount = quizOptions.numQuestions
    }

    // Determine the format instructions
    let formatInstructions = ''
    if (quizOptions.format === 'multiple-choice') {
      formatInstructions = `
- All questions should be multiple choice with exactly 4 options
- Provide the correct answer index (0-3) for each question
- Format each question as:
  {
    "text": "question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 0-3,
    "explanation": "explanation text",
    "difficulty": "easy|medium|hard"
  }`
    } else if (quizOptions.format === 'free-text') {
      formatInstructions = `
- All questions should be free text (open-ended) questions
- Provide a model answer for each question
- Format each question as:
  {
    "text": "question text",
    "options": [],
    "correctAnswer": -1,
    "explanation": "model answer that would be considered correct",
    "difficulty": "easy|medium|hard"
  }`
    } else if (quizOptions.format === 'mixed') {
      formatInstructions = `
- Mix of multiple choice and free text questions
- For multiple choice questions:
  - Provide exactly 4 options
  - Provide the correct answer index (0-3)
- For free text questions:
  - Provide an empty options array
  - Set correctAnswer to -1
  - Provide a model answer in the explanation field
- Format each question as:
  {
    "text": "question text",
    "options": ["option1", "option2", "option3", "option4"] or [],
    "correctAnswer": 0-3 or -1,
    "explanation": "explanation or model answer",
    "difficulty": "easy|medium|hard"
  }`
    }

    // Add any additional requirements
    const additionalRequirementsText = quizOptions.additionalRequirements 
      ? `\nAdditional Requirements:\n${quizOptions.additionalRequirements}`
      : '';

    const prompt = `Generate ${quizOptions.numQuestions} questions for the following topic: "${topic.title}"
  
Topic Description: ${topic.description}

Course Context:
${JSON.stringify(syllabus, null, 2)}

Requirements:
1. Generate exactly ${quizOptions.numQuestions} questions with the following distribution:
   - ${easyCount} easy question${easyCount !== 1 ? 's' : ''}
   - ${mediumCount} medium question${mediumCount !== 1 ? 's' : ''}
   - ${hardCount} hard question${hardCount !== 1 ? 's' : ''}
2. Questions should test understanding, not just memorization
3. Format:${formatInstructions}
4. Return the response as a JSON array of question objects${additionalRequirementsText}

Return only valid JSON, no other text.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a quiz generator that creates high-quality questions. You always return valid JSON."
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