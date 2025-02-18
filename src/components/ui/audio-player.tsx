import { useState, useRef, useEffect } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioUrl);
    
    // Set up event listeners
    const audio = audioRef.current;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [audioUrl]);

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

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-primary" />
        ) : (
          <Play className="h-5 w-5 text-primary" />
        )}
      </Button>

      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-2">
          Listen to course overview
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative h-1.5">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="absolute inset-0 bg-primary/20 rounded-full" />
            <div 
              className="absolute inset-0 bg-primary rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <span className="text-sm text-muted-foreground min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
} 
