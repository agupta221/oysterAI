import { OpenAI } from "openai";

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
  try {
    const { messages, currentTopic } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Add current topic context to the system prompt
    const contextualizedSystemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nCurrent topic being discussed: ${currentTopic?.title || 'Unknown Topic'}\nTopic description: ${currentTopic?.description || 'No description available'}`;

    // Create a streaming response using the OpenAI SDK directly
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: contextualizedSystemPrompt },
        ...(messages || []),
      ],
      temperature: 0.7,
      stream: true,
    });

    // Create a ReadableStream that will be used for the response
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Process each chunk from the OpenAI stream
          for await (const chunk of stream) {
            // Extract the content from the chunk
            const content = chunk.choices[0]?.delta?.content || '';
            
            // If there's content, encode it and enqueue it to the stream
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          // Close the controller when done
          controller.close();
        } catch (error) {
          console.error('Error processing stream:', error);
          controller.error(error);
        }
      },
    });

    // Return a streaming response with appropriate headers
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 