import { NextResponse } from 'next/server'
import { classifyInteractiveMode } from '@/lib/interactive-mode-classifier'
import { generateInteractiveContent } from '@/lib/interactive-mode-generator'

export async function POST(request: Request) {
  try {
    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Generate new content
    console.log('Generating interactive mode content for question:', question)
    
    try {
      const mode = await classifyInteractiveMode(question)
      
      // Log when case study mode is selected
      if (mode === 'case-study') {
        console.log('Case study mode selected for question:', question)
      }
      
      const content = await generateInteractiveContent(question, mode)

      return NextResponse.json({
        mode,
        content,
      })
    } catch (contentError) {
      console.error('Error generating interactive content:', contentError)
      
      // Return a more specific error message
      return NextResponse.json(
        { 
          error: 'Failed to generate interactive content',
          details: contentError instanceof Error ? contentError.message : 'Unknown error',
          fallbackMode: 'scenario-based',
          fallbackContent: {
            scenario: {
              context: "We encountered an issue generating interactive content for your question.",
              steps: [
                {
                  situation: "Our AI had trouble processing this specific question.",
                  question: "What would you like to do now?",
                  options: ["Try a different question", "Use a different learning mode", "Continue with regular learning"],
                  correctOption: 2,
                  explanation: "While interactive modes enhance learning, the standard content is still valuable and comprehensive."
                }
              ],
              conclusion: "We apologize for the inconvenience. Our team has been notified of this issue."
            }
          }
        },
        { status: 200 } // Return 200 with fallback content instead of 500
      )
    }
  } catch (error) {
    console.error('Error in interactive mode API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process interactive mode request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 