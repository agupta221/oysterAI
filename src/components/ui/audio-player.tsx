import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import { getCourseAudioUrl } from "@/lib/firebase/courseUtils";

interface AudioPlayerProps {
  audioPath: string; // Firebase Storage path for the audio file
}

export function AudioPlayer({ audioPath }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch the audio URL when the component mounts
  useEffect(() => {
    console.log('AudioPlayer mounted/updated with path:', audioPath);
    
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching audio URL for path:', audioPath);
        const url = await getCourseAudioUrl(audioPath);
        console.log('Successfully retrieved audio URL');
        setAudioUrl(url);
      } catch (error) {
        console.error('Error loading audio:', error);
        setError(error instanceof Error ? error.message : 'Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    };

    if (audioPath) {
      loadAudio();
    } else {
      console.warn('No audio path provided');
      setError('No audio file available');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioPath]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading audio...</div>;
  }

  if (error) {
    return <div className="text-center text-muted-foreground">Error: {error}</div>;
  }

  if (!audioUrl) {
    return <div className="text-center text-muted-foreground">No audio available</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border bg-background">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="hover:bg-primary/10"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleSliderChange}
          />
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
        <span className="text-sm text-muted-foreground w-20 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
} 
