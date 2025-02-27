import type { Topic } from '@/lib/openai'
import type { Syllabus } from '@/lib/openai'

interface Question {
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function generateQuizQuestions(topic: Topic, syllabus: Syllabus): Promise<Question[]> {
  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, syllabus }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate quiz questions')
    }

    const data = await response.json()
    return data.questions
  } catch (error) {
    console.error('Error generating quiz:', error)
    throw error
  }
} 