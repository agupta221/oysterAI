import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Text-to-Speech client
let textToSpeechClient: TextToSpeechClient | null = null;

try {
  // Check if we have individual credential environment variables
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID) {
    // Initialize with credentials from environment variables
    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix escaped newlines
      project_id: process.env.GOOGLE_PROJECT_ID
    };
    
    textToSpeechClient = new TextToSpeechClient({ credentials });
    console.log('Google TTS client initialized with environment variables');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Fall back to credentials file if available
    textToSpeechClient = new TextToSpeechClient();
    console.log('Google TTS client initialized with credentials file');
  } else {
    console.error('No Google Cloud credentials found in environment variables or credentials file');
  }
} catch (error) {
  console.error('Error initializing Google TTS client:', error);
}

// Function to generate a storage path for explanation audio
const getExplanationAudioPath = (userId: string, courseId: string, topicId: string, learningMode: string) => {
  // Store in a public folder that doesn't require authentication
  return `public-explanations/${userId}/${courseId}/${topicId}/${learningMode.replace(/\s+/g, '-').toLowerCase()}.mp3`;
};

// Upload audio buffer to Firebase Storage
const uploadExplanationAudio = async (audioBuffer: Uint8Array, userId: string, courseId: string, topicId: string, learningMode: string): Promise<string> => {
  const audioPath = getExplanationAudioPath(userId, courseId, topicId, learningMode);
  const storageRef = ref(storage, audioPath);

  try {
    console.log(`Attempting to upload audio to path: ${audioPath}`);
    await uploadBytes(storageRef, audioBuffer, {
      contentType: 'audio/mp3',
    });
    console.log(`Successfully uploaded audio to path: ${audioPath}`);
    return audioPath; // Return the storage path
  } catch (error) {
    console.error('Error uploading audio:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`Failed to upload explanation audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get download URL for audio file
const getExplanationAudioUrl = async (audioPath: string): Promise<string> => {
  console.log('Getting audio URL for path:', audioPath);
  try {
    const storageRef = ref(storage, audioPath);
    console.log('Storage reference created:', storageRef.fullPath);
    const url = await getDownloadURL(storageRef);
    console.log('Successfully retrieved download URL');
    return url;
  } catch (error) {
    console.error('Error getting audio URL:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`Failed to get explanation audio URL: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export async function POST(req: Request) {
  try {
    // Check if Google TTS client is initialized
    if (!textToSpeechClient) {
      return NextResponse.json(
        { error: 'Google Text-to-Speech service not initialized. Check your credentials.' },
        { status: 500 }
      );
    }
    
    const { 
      userId,
      courseId,
      topicId,
      userQuery, 
      syllabus, 
      currentTopic, 
      learningMode, 
      learningModeDescription 
    } = await req.json();

    // Validate required fields
    if (!currentTopic || !learningMode || !learningModeDescription || !userId || !courseId || !topicId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Define the storage path for this specific explanation
    const audioPath = getExplanationAudioPath(userId, courseId, topicId, learningMode);
    
    let audioUrl;
    let explanation;
    
    try {
      // Try to get the download URL (will throw an error if file doesn't exist)
      audioUrl = await getExplanationAudioUrl(audioPath);
      console.log('Audio file already exists, retrieving from storage');
      
      // We don't have the original explanation text, but we could store it separately
      // For now, we'll just return a placeholder
      explanation = "Audio explanation retrieved from cache";
    } catch (error) {
      // File doesn't exist, generate a new one
      console.log('Generating new audio explanation');
      
      // Generate explanation using OpenAI
      explanation = await generateExplanation(
        userQuery,
        syllabus,
        currentTopic,
        learningMode,
        learningModeDescription
      );

      // Convert explanation to speech
      const audioBuffer = await convertToSpeech(explanation);
      
      // Upload to Firebase Storage
      await uploadExplanationAudio(audioBuffer, userId, courseId, topicId, learningMode);
      
      // Get the download URL
      audioUrl = await getExplanationAudioUrl(audioPath);
    }

    return NextResponse.json({ 
      explanation, 
      audioUrl 
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

async function generateExplanation(
  userQuery: string,
  syllabus: any,
  currentTopic: any,
  learningMode: string,
  learningModeDescription: string
) {
  const prompt = `
You are an expert educator tasked with explaining the topic "${currentTopic.title}" in the "${learningMode}" learning mode.

Learning Mode Description: ${learningModeDescription}

Context:
- User's original query: "${userQuery || 'Learning about this subject'}"
- Current topic: ${JSON.stringify(currentTopic)}
- This topic is part of a larger syllabus: ${JSON.stringify(syllabus)}

Your task:
Create a detailed, engaging explanation of this topic that aligns with the "${learningMode}" learning mode. The explanation should:
1. Be conversational and friendly in tone
2. Be informative and educational
3. Be approximately 5 minutes when read aloud (about 750-850 words)
4. Follow the style indicated by the learning mode description
5. Include relevant examples, analogies, or stories that help illustrate the concepts
6. Be structured with a clear introduction, body, and conclusion
7. Use natural speech patterns suitable for text-to-speech conversion
8. Don't include any asterisks or anything that a voice to text engine would have trouble reading. 
9. Don't include any demarkations to the structure of the explanation like "body" or "introduction" etc. 

Your explanation will be converted to audio, so avoid references to visual elements or things like "as you can see" or "shown here".
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: 'You are an expert educator who creates engaging, informative explanations tailored to specific learning styles.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || '';
}

async function convertToSpeech(text: string): Promise<Uint8Array> {
  if (!textToSpeechClient) {
    throw new Error("Google Text-to-Speech client not initialized. Make sure Google Cloud credentials are configured.");
  }
  
  // Configure the request
  const request = {
    input: { text },
    voice: {
        languageCode: 'en-US', 
        ssmlGender: 'FEMALE' as const,
        name: 'en-US-Chirp-HD-O' // Using a high-quality neural voice
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 0,
      speakingRate: 1.0,
    },
  };

  // Perform the text-to-speech request
  const [response] = await textToSpeechClient.synthesizeSpeech(request as any);
  
  if (!response.audioContent) {
    throw new Error('No audio content received from Google TTS');
  }
  
  return response.audioContent as Uint8Array;
} 