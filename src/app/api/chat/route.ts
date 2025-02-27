import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

const CHAT_SYSTEM_PROMPT = `You are a friendly and knowledgeable professor helping students learn. Your goal is to:
1. Explain concepts clearly and concisely
2. Use analogies and examples to make complex topics easier to understand
3. Encourage students and maintain a supportive tone
4. Break down complex topics into simpler parts
5. Relate concepts to real-world applications
6. Ask guiding questions to help students reach understanding themselves
7. Acknowledge and praise student effort and progress
8. Keep responses concise and to the point

Remember to:
- Keep responses friendly and conversational
- Use markdown formatting for code examples and important points
- Provide step-by-step explanations when needed
- Encourage further questions and exploration
- Stay focused on the current topic and learning context`;

export async function POST(req: Request) {
  const { messages, currentTopic } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Add current topic context to the system prompt
  const contextualizedSystemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nCurrent topic being discussed: ${currentTopic.title}\nTopic description: ${currentTopic.description}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      { role: "system", content: contextualizedSystemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    stream: true,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
} 