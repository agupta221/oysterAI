import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { v4 as uuidv4 } from 'uuid';

// Initialize the client with Google Cloud credentials
let client: TextToSpeechClient;

try {
  // Check if we have individual credential environment variables
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID) {
    // Check if the private key is properly formatted
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // If the key doesn't contain the PEM header/footer, assume it needs to be formatted
    const formattedKey = privateKey.includes('-----BEGIN PRIVATE KEY-----')
      ? privateKey.replace(/\\n/g, '\n')
      : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    
    // Initialize with credentials from environment variables
    client = new TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formattedKey,
        project_id: process.env.GOOGLE_PROJECT_ID
      }
    });
    console.log('Google TTS client initialized with environment variables');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Fall back to credentials file if available
    client = new TextToSpeechClient();
    console.log('Google TTS client initialized with credentials file');
  } else {
    console.error('No Google Cloud credentials found in environment variables or credentials file');
  }
} catch (error) {
  console.error('Error initializing Google Text-to-Speech client:', error);
  // Log more details about the credentials (without revealing the full private key)
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PROJECT_ID) {
    console.error('Project ID:', process.env.GOOGLE_PROJECT_ID);
    console.error('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
    console.error('Private Key format check:', {
      length: process.env.GOOGLE_PRIVATE_KEY.length,
      containsHeader: process.env.GOOGLE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'),
      containsFooter: process.env.GOOGLE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'),
      containsNewlines: process.env.GOOGLE_PRIVATE_KEY.includes('\n'),
    });
  }
}

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  if (!client) {
    throw new Error("Google Text-to-Speech client not initialized. Make sure Google Cloud credentials are configured correctly.");
  }

  try {
    // Configure the request
    const request = {
      input: { text },
      voice: { 
        languageCode: 'en-US', 
        ssmlGender: 'FEMALE' as const,
        name: 'en-US-Neural2-F' // Using a standard neural voice that's widely available
      },
      audioConfig: { 
        audioEncoding: 'MP3' as const,
        pitch: 0,
        speakingRate: 1.0
      },
    };

    // Call the API
    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Convert the audio content to ArrayBuffer
    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    
    // Create a new ArrayBuffer to ensure the correct type is returned
    const arrayBuffer = new ArrayBuffer(audioBuffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioBuffer.length; i++) {
      view[i] = audioBuffer[i];
    }
    
    return arrayBuffer;
  } catch (error) {
    console.error('Error generating speech with Google TTS:', error);
    throw error;
  }
} 