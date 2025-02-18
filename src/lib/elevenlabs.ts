export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY environment variable");
  }

  // Using a default voice ID - you can change this to any voice from ElevenLabs
  const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
} 