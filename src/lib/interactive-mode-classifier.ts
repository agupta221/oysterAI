import OpenAI from 'openai'

const openai = new OpenAI()

export type InteractiveModeType = 'scenario-based' | 'timeline' | 'case-study'

const CLASSIFICATION_PROMPT = `You are a learning mode classifier. Your job is to analyze a question and determine which interactive learning mode would be most effective for helping students understand and engage with the content.

Available modes:
1. Timeline: Best for historical events, sequential developments, or understanding how things evolve over time
2. Scenario-based: Best for situations where the users needs to learn about how things work in a practical way or learn about processes and technical topics and techniques
3. Case-study: Best for real-world examples that demonstrate concepts in action, with stakeholders, challenges, and outcomes.

Respond only with "timeline", "scenario-based", or "case-study". Choose based on which would create a more engaging and effective learning experience.`

export async function classifyInteractiveMode(question: string): Promise<InteractiveModeType> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CLASSIFICATION_PROMPT },
        { role: "user", content: question }
      ],
      temperature: 0, // Low temperature for more consistent classification
      max_tokens: 10, // We only need a single word response
    })

    const classification = response.choices[0].message.content?.toLowerCase().trim()

    if (classification === 'scenario-based' || classification === 'timeline' || classification === 'case-study') {
      return classification
    }

    // Default to scenario-based if response is unexpected
    return 'scenario-based'
  } catch (error) {
    console.error('Error classifying interactive mode:', error)
    // Default to scenario-based on error
    return 'scenario-based'
  }
} 