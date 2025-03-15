import OpenAI from 'openai'
import type { InteractiveModeType } from './interactive-mode-classifier'

const openai = new OpenAI()

const PROMPT_TEMPLATES = {
  'scenario-based': `Create an interactive scenario-based learning experience for the following question. 
The response should be in JSON format with the following structure:
{
  "scenario": {
    "context": "Initial situation or problem statement",
    "steps": [
      {
        "situation": "Description of the current state",
        "question": "Specific question about what to do in this situation",
        "options": ["Choice 1", "Choice 2", "Choice 3"],
        "correctOption": 0,
        "explanation": "Why this is the correct approach"
      }
    ],
    "conclusion": "Final learning outcome or takeaway"
  }
}

Important guidelines:
1. For each step, randomly select which option is correct by setting the correctOption index to a random position (0, 1, or 2). Do NOT always make the first option (index 0) the correct one. Vary the position of the correct answer across different steps.
2. Create plausible and challenging options that represent realistic choices a learner might consider.
3. Make sure incorrect options are not obviously wrong - they should be reasonable alternatives that require careful consideration.
4. Provide detailed explanations that not only explain why the correct option is right but also why the other options are not optimal.
5. Include a specific, contextual question for each step that prompts the user to make a decision. This should be more specific than "What would you do?" and directly relate to the situation described.

Make the scenario engaging, realistic, and relevant to the question. Include 3-5 steps with meaningful choices.`,

  'timeline': `Create an interactive timeline-based learning experience for the following question.
The response should be in JSON format with the following structure:
{
  "timeline": {
    "title": "Main concept or process",
    "description": "Overview of what will be learned",
    "events": [
      {
        "title": "Event or phase name",
        "date": "Timestamp or period",
        "description": "Detailed description of What happens at this point and why it is significant",
        "interactionPrompt": "Question or task for user engagement"
      }
    ],
    "conclusion": "Key learning takeaway"
  }
}

Make the timeline informative and interactive, with clear progression and engaging interaction points.
The timeline should also be extremely detailed and should include specific events that are relevant to the question.`,

  'case-study': `Create a detailed case study learning experience for the following question.
The response should be in JSON format with the following structure:
{
  "caseStudy": {
    "title": "Case study title",
    "introduction": "Brief overview of the case and why it's relevant",
    "background": "Detailed context and background information",
    "stakeholders": [
      {
        "name": "Stakeholder name or group",
        "role": "Their role in the case",
        "interests": "What they wanted or needed"
      }
    ],
    "challenge": "The core problem or challenge faced",
    "approach": "How the challenge was addressed - this can be either a string describing the approach OR an object with numbered steps like {step1: 'First action taken', step2: 'Second action taken', etc.}",
    "outcomes": {
      "positive": ["List of positive outcomes"],
      "negative": ["List of negative outcomes or challenges"]
    },
    "keyTakeaways": ["List of important lessons learned"],
    "reflectionPrompt": "A thought-provoking question for the learner"
  }
}

Important guidelines:
1. Select a real-world example that is directly relevant to the question.
2. Include specific stakeholders with clear roles and interests.
3. Describe the challenge and approach in detail.
4. Ensure all text is properly escaped for JSON - avoid using quotes within strings unless escaped.
5. Keep responses concise and focused.

Make the case study realistic, detailed, and educational.`
}

export interface ScenarioContent {
  scenario: {
    context: string
    steps: Array<{
      situation: string
      question: string
      options: string[]
      correctOption: number
      explanation: string
    }>
    conclusion: string
  }
}

export interface TimelineContent {
  timeline: {
    title: string
    description: string
    events: Array<{
      title: string
      date: string
      description: string
      interactionPrompt: string
    }>
    conclusion: string
  }
}

export interface CaseStudyContent {
  caseStudy: {
    title: string
    introduction: string
    background: string
    stakeholders: Array<{
      name: string
      role: string
      interests: string
    }>
    challenge: string
    approach: string | Record<string, string>
    outcomes: {
      positive: string[]
      negative: string[]
    }
    keyTakeaways: string[]
    reflectionPrompt: string
  }
}

export type InteractiveModeContent = ScenarioContent | TimelineContent | CaseStudyContent

export async function generateInteractiveContent(
  question: string,
  mode: InteractiveModeType
): Promise<InteractiveModeContent> {
  try {
    const prompt = PROMPT_TEMPLATES[mode]
    
    // Ensure we're explicitly requesting JSON format
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: prompt 
        },
        { 
          role: "user", 
          content: question 
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

    const rawContent = response.choices[0].message.content || '{}'
    
    // Log the raw response for debugging
    console.log('Raw response from OpenAI:', rawContent.substring(0, 200) + '...')
    
    try {
      // Parse the JSON response
      const content = JSON.parse(rawContent)
      return content as InteractiveModeContent
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError)
      console.error('Raw response that caused the error:', rawContent)
      
      // Create a fallback response based on the mode
      if (mode === 'scenario-based') {
        return {
          scenario: {
            context: "We couldn't generate a proper scenario for this question.",
            steps: [
              {
                situation: "There was an error generating the interactive content.",
                question: "How would you like to proceed?",
                options: ["Continue with regular learning", "Try again later", "Contact support"],
                correctOption: 0,
                explanation: "Sometimes our AI has trouble generating certain content. Regular learning is still effective."
              }
            ],
            conclusion: "We apologize for the inconvenience. Please try a different question or mode."
          }
        }
      } else if (mode === 'timeline') {
        return {
          timeline: {
            title: "Error Timeline",
            description: "We couldn't generate a proper timeline for this question.",
            events: [
              {
                title: "Error Occurred",
                date: "Just now",
                description: "There was an error generating the interactive content.",
                interactionPrompt: "Would you like to try a different question or mode?"
              }
            ],
            conclusion: "We apologize for the inconvenience. Please try a different question or mode."
          }
        }
      } else {
        return {
          caseStudy: {
            title: "Error Case Study",
            introduction: "We couldn't generate a proper case study for this question.",
            background: "There was an error processing your request.",
            stakeholders: [
              {
                name: "User",
                role: "Learner",
                interests: "Getting valuable educational content"
              }
            ],
            challenge: "Our AI had trouble generating content for this specific question.",
            approach: "We recommend trying a different question or interactive mode.",
            outcomes: {
              positive: ["You now know that not all questions work well with all interactive modes"],
              negative: ["You didn't get the case study you were looking for"]
            },
            keyTakeaways: ["Some complex topics may work better with different interactive modes"],
            reflectionPrompt: "Would a different interactive mode be more suitable for this question?"
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating interactive content:', error)
    throw error
  }
} 