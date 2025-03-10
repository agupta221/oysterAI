import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient, protos } from '@google-cloud/speech';
import { ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Text-to-Speech client
let textToSpeechClient: TextToSpeechClient | null = null;

// Initialize Google Speech-to-Text client
let speechToTextClient: SpeechClient | null = null;

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
    speechToTextClient = new SpeechClient({ credentials });
    console.log('Google TTS and STT clients initialized with environment variables');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Fall back to credentials file if available
    textToSpeechClient = new TextToSpeechClient();
    speechToTextClient = new SpeechClient();
    console.log('Google TTS and STT clients initialized with credentials file');
  } else {
    console.error('No Google Cloud credentials found in environment variables or credentials file');
  }
} catch (error) {
  console.error('Error initializing Google clients:', error);
}

// Interface for word with timestamp
interface WordWithTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

// Interface for timestamped explanation
interface TimestampedExplanation {
  fullText: string;
  words: WordWithTimestamp[];
}

// Function to generate a storage path for explanation audio
const getExplanationAudioPath = (userId: string, courseId: string, topicId: string, learningMode: string, questionId?: string) => {
  // If questionId is provided, include it in the path
  if (questionId) {
    return `public-explanations/${userId}/${courseId}/${topicId}/questions/${questionId}/${learningMode.replace(/\s+/g, '-').toLowerCase()}.mp3`;
  }
  // Otherwise, use the original path for topic-level explanations
  return `public-explanations/${userId}/${courseId}/${topicId}/${learningMode.replace(/\s+/g, '-').toLowerCase()}.mp3`;
};

// Upload audio buffer to Firebase Storage with timestamped explanation in metadata
const uploadExplanationAudio = async (
  audioBuffer: Uint8Array, 
  timestampedExplanation: TimestampedExplanation,
  userId: string, 
  courseId: string, 
  topicId: string, 
  learningMode: string, 
  questionId?: string
): Promise<string> => {
  const audioPath = getExplanationAudioPath(userId, courseId, topicId, learningMode, questionId);
  const storageRef = ref(storage, audioPath);

  try {
    console.log(`Attempting to upload audio to path: ${audioPath}`);
    
    // Create custom metadata with the timestamped explanation
    const metadata = {
      contentType: 'audio/mp3',
      customMetadata: {
        timestampedExplanation: JSON.stringify(timestampedExplanation)
      }
    };
    
    await uploadBytes(storageRef, audioBuffer, metadata);
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

// Get download URL and metadata for audio file
const getExplanationAudioUrl = async (audioPath: string): Promise<{ url: string, timestampedExplanation: TimestampedExplanation }> => {
  console.log('Getting audio URL for path:', audioPath);
  try {
    const storageRef = ref(storage, audioPath);
    console.log('Storage reference created:', storageRef.fullPath);
    
    // Get the download URL
    const url = await getDownloadURL(storageRef);
    console.log('Successfully retrieved download URL');
    
    // Get the metadata to retrieve the timestamped explanation
    const metadata = await getMetadata(storageRef);
    const timestampedExplanationJson = metadata.customMetadata?.timestampedExplanation;
    
    if (!timestampedExplanationJson) {
      throw new Error('No timestamped explanation found in metadata');
    }
    
    const timestampedExplanation = JSON.parse(timestampedExplanationJson) as TimestampedExplanation;
    console.log('Retrieved timestamped explanation from metadata with', timestampedExplanation.words.length, 'words');
    
    return { url, timestampedExplanation };
  } catch (error) {
    console.error('Error getting audio URL or metadata:', error);
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

// Get word-level timestamps from audio using Google Speech-to-Text
const getWordTimestamps = async (audioBuffer: Uint8Array, fullText: string): Promise<TimestampedExplanation> => {
  if (!speechToTextClient) {
    throw new Error('Google Speech-to-Text client not initialized');
  }
  
  console.log('Getting word timestamps from audio...');
  
  try {
    // Convert audio buffer to base64
    const audioContent = Buffer.from(audioBuffer).toString('base64');
    
    // Configure the request
    const request = {
      audio: {
        content: audioContent,
      },
      config: {
        encoding: 'MP3' as any,
        sampleRateHertz: 24000,
        languageCode: 'en-US',
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
      },
    };
    
    // Perform the speech recognition
    try {
      const [response] = await speechToTextClient.recognize(request as any);
      
      if (!response.results || response.results.length === 0) {
        throw new Error('No speech recognition results returned');
      }
      
      // Extract word timestamps
      const words: WordWithTimestamp[] = [];
      
      response.results.forEach((result: any) => {
        if (result.alternatives && result.alternatives.length > 0) {
          const alternative = result.alternatives[0];
          
          if (alternative.words) {
            alternative.words.forEach((wordInfo: any) => {
              // Handle different possible formats of timestamps
              let startTime = 0;
              let endTime = 0;
              
              if (typeof wordInfo.startTime === 'number') {
                startTime = wordInfo.startTime;
              } else if (typeof wordInfo.startTime === 'string') {
                // Parse string timestamp like "1.500s"
                startTime = parseFloat(wordInfo.startTime.replace('s', ''));
              } else if (wordInfo.startTime && typeof wordInfo.startTime.seconds === 'number') {
                startTime = wordInfo.startTime.seconds + (wordInfo.startTime.nanos || 0) / 1e9;
              }
              
              if (typeof wordInfo.endTime === 'number') {
                endTime = wordInfo.endTime;
              } else if (typeof wordInfo.endTime === 'string') {
                // Parse string timestamp like "1.500s"
                endTime = parseFloat(wordInfo.endTime.replace('s', ''));
              } else if (wordInfo.endTime && typeof wordInfo.endTime.seconds === 'number') {
                endTime = wordInfo.endTime.seconds + (wordInfo.endTime.nanos || 0) / 1e9;
              }
              
              // Add a small delay to each word's start time to slow down text appearance
              // This helps with synchronization between audio and text
              startTime += 0.2;
              
              words.push({
                word: wordInfo.word || '',
                startTime,
                endTime
              });
            });
          }
        }
      });
      
      console.log(`Extracted ${words.length} word timestamps`);
      
      // If we have very few words, it might be an error in speech recognition
      // In this case, generate synthetic timestamps based on the full text
      if (words.length < 10 && fullText.length > 100) {
        console.log('Too few words detected, generating synthetic timestamps');
        return generateSyntheticTimestamps(fullText, 24); // Assume 24 seconds for full text
      }
      
      return {
        fullText,
        words
      };
    } catch (recognizeError) {
      console.error('Error in speech recognition:', recognizeError);
      throw recognizeError;
    }
  } catch (error) {
    console.error('Error getting word timestamps:', error);
    
    // If speech recognition fails, return synthetic timestamps
    console.log('Using synthetic timestamps as fallback');
    return generateSyntheticTimestamps(fullText, 24); // Assume 24 seconds for full text
  }
};

// Generate synthetic timestamps for words when speech recognition fails
const generateSyntheticTimestamps = (text: string, totalDuration: number): TimestampedExplanation => {
  // Split text into words
  const wordTexts = text.split(/\s+/);
  
  // Calculate average time per word
  const timePerWord = totalDuration / wordTexts.length;
  
  // Generate timestamps for each word
  const words: WordWithTimestamp[] = [];
  let currentTime = 0;
  
  wordTexts.forEach(wordText => {
    if (wordText.trim()) {
      // Add a small random variation to make it sound more natural
      const wordDuration = timePerWord * (0.8 + Math.random() * 0.4);
      
      words.push({
        word: wordText,
        startTime: currentTime,
        endTime: currentTime + wordDuration
      });
      
      currentTime += wordDuration;
    }
  });
  
  console.log(`Generated ${words.length} synthetic timestamps`);
  
  return {
    fullText: text,
    words
  };
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
      learningModeDescription,
      questionContext
    } = await req.json();

    console.log('Received request with:', {
      userId,
      courseId,
      topicId,
      learningMode,
      learningModeDescription,
      hasQuestionContext: !!questionContext,
      hasUserQuery: !!userQuery,
      hasSyllabus: !!syllabus,
      hasCurrentTopic: !!currentTopic
    });

    // Validate required fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!courseId) missingFields.push('courseId');
    if (!topicId) missingFields.push('topicId');
    if (!currentTopic) missingFields.push('currentTopic');
    if (!learningMode) missingFields.push('learningMode');
    if (!learningModeDescription) missingFields.push('learningModeDescription');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate a questionId if we have question context
    let questionId: string | undefined;
    if (questionContext && questionContext.question) {
      // Create a stable ID based on the question text
      questionId = Buffer.from(questionContext.question.substring(0, 50))
        .toString('base64')
        .replace(/[+/=]/g, '')  // Remove characters that might cause issues in file paths
        .substring(0, 20);  // Keep it reasonably short
      
      console.log('Generated questionId:', questionId);
    }

    // Define the storage path for this specific explanation
    const audioPath = getExplanationAudioPath(userId, courseId, topicId, learningMode, questionId);
    console.log('Audio path:', audioPath);
    
    let audioUrl;
    let timestampedExplanation: TimestampedExplanation;
    
    try {
      // Try to get the download URL (will throw an error if file doesn't exist)
      const result = await getExplanationAudioUrl(audioPath);
      console.log('Audio file already exists, retrieving from storage');
      
      audioUrl = result.url;
      timestampedExplanation = result.timestampedExplanation;
    } catch (error) {
      // File doesn't exist, generate a new one
      console.log('Generating new audio explanation');
      
      // Generate explanation using OpenAI
      const explanationText = await generateExplanation(
        userQuery || (questionContext ? questionContext.question : ''),
        syllabus,
        currentTopic,
        learningMode,
        learningModeDescription,
        questionContext
      );

      try {
        // Convert explanation to speech
        console.log('Converting explanation to speech');
        const audioBuffer = await convertToSpeech(explanationText);
        
        // Get word-level timestamps
        console.log('Getting word-level timestamps');
        timestampedExplanation = await getWordTimestamps(audioBuffer, explanationText);
        
        // Upload to Firebase Storage
        console.log('Uploading audio to Firebase Storage');
        await uploadExplanationAudio(audioBuffer, timestampedExplanation, userId, courseId, topicId, learningMode, questionId);
        
        // Get the download URL
        console.log('Getting download URL');
        const result = await getExplanationAudioUrl(audioPath);
        audioUrl = result.url;
        timestampedExplanation = result.timestampedExplanation;
      } catch (storageError) {
        // Handle storage errors gracefully
        console.error('Storage error:', storageError);
        
        // If it's a permission error, provide a helpful message
        const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
        if (errorMessage.includes('storage/unauthorized')) {
          console.error('Firebase Storage permission error. Check your storage rules.');
          
          // Return the explanation without audio
          return NextResponse.json({ 
            timestampedExplanation: {
              fullText: explanationText,
              words: []
            },
            audioUrl: null,
            error: 'Audio storage unavailable. Please check Firebase Storage rules.'
          });
        }
        
        // For other errors, rethrow
        throw storageError;
      }
    }

    console.log('Returning response with timestamped explanation and audio URL');
    return NextResponse.json({ 
      timestampedExplanation, 
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
  learningModeDescription: string,
  questionContext?: any
) {
  // If we have question context, use that to create a more focused explanation
  const questionPrompt = questionContext ? `
  You are specifically explaining the answer to this question:
  Question: "${questionContext.question}"
  Standard Answer: "${questionContext.answer}"
  
  Your explanation should directly address this question, but in the style of the learning mode.
  ` : '';

  // Add specific instructions for different learning modes
  let modeSpecificInstructions = '';
  
  if (learningMode === 'Impress your friends') {
    modeSpecificInstructions = `
    For the "Impressive" learning mode:
    - Focus on providing a concise explanation with exactly 6-7 essential facts
    - Be direct and impactful with each point
    - Prioritize the most important information that would impress someone
    - Keep the overall explanation short and concise and limit it to 6-7 key statements.
    - Make each point memorable and easy to recall
    - Use powerful, precise language
    - Skip any preamble or introduction and go straight into the key statements.
    - Don't include any asterisks or anything that a voice to text engine would have trouble reading
    - Don't include any demarkations to the structure of the explanation like "body" or "introduction" etc.
    `;
  } else if (learningMode === 'How it works IRL' || learningMode === 'Real-world') {
    modeSpecificInstructions = `
    For the "Real-world" learning mode:
    - Create a response that is approximately 5 minutes when read aloud (about 750-850 words)
    - Structure your explanation around one or two concrete, relevant real-world examples
    - Use the example(s) as a framework to explain the concept step by step
    - Show how the concept is applied in practical situations
    - Connect abstract ideas to tangible outcomes or scenarios
    - Include specific details that make the example authentic and relatable
    - Explain how understanding this concept provides practical value
    - Don't include any asterisks or anything that a voice to text engine would have trouble reading
    - Don't include any demarkations to the structure of the explanation like "body" or "introduction" etc.
    `;
  } else if (learningMode === 'ELI5') {
    modeSpecificInstructions = `
    For the "ELI5" learning mode:
    - Create a response that is approximately 5 minutes when read aloud (about 750-850 words)
    - Structure your explanation leveraging simple examples and analogies like you would to an absolute beginner
    - Include specific details that make the answer authentic and relatable
    - Explain how understanding this concept provides practical value
    - Don't include any asterisks or anything that a voice to text engine would have trouble reading
    - Don't include any demarkations to the structure of the explanation like "body" or "introduction" etc.
    `;
  } else if (learningMode === 'The Nitty Gritty' || learningMode === 'Detailed') {
    modeSpecificInstructions = `
    For the "The Nitty Gritty" learning mode:
    - Create a response that is approximately 5 minutes when read aloud (about 750-850 words)
    - Structure your explanation around really specific details, information and statistics
    - Go into specific terminology and jargon and really break down the details
    - Use the example(s) as a framework to explain the concept step by step
    - Be as technical and detailed as possible
    - Don't include any asterisks or anything that a voice to text engine would have trouble reading
    - Don't include any demarkations to the structure of the explanation like "body" or "introduction" etc.
    `;
  }

  const prompt = `
You are an expert educator tasked with explaining the topic "${currentTopic.title}" in the "${learningMode}" learning mode.

Learning Mode Description: ${learningModeDescription}

${modeSpecificInstructions}

Context:


${questionPrompt}

Your task:
Create a detailed, engaging explanation of this topic that aligns with the "${learningMode}" learning mode. The explanation should:
1. Be conversational and friendly in tone
2. Be informative and educational
4. Follow the style indicated by the learning mode description and any mode-specific instructions provided
5. Include relevant examples, analogies, or stories that help illustrate the concepts
6. Be structured with a clear introduction, body, and conclusion
7. Use natural speech patterns suitable for text-to-speech conversion


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