'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Lightbulb, Briefcase, Microscope, Sparkles, Loader2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface LearningModesProps {
  onModeSelect: (mode: string) => void;
  currentTopic: any;
  syllabus: any;
  userQuery?: string;
  courseId: string;
}

interface ModeState {
  isLoading: boolean;
  isFlipped: boolean;
  explanation: string | null;
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const LearningModes: React.FC<LearningModesProps> = ({ 
  onModeSelect, 
  currentTopic, 
  syllabus, 
  userQuery = '',
  courseId
}) => {
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>({});
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  const loadingPhrases = [
    "Diving deep into the ocean of knowledge...",
    "Crafting your personalized learning journey...",
    "Polishing each pearl of wisdom...",
    "Discovering hidden learning treasures...",
    "Creating your perfect learning path..."
  ];

  // Rotate loading phrases every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Check if any mode is in loading state
    const isAnyModeLoading = Object.values(modeStates).some(state => state.isLoading);
    
    if (isAnyModeLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modeStates, loadingPhrases.length]);

  // Get the current user ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    
    return () => unsubscribe();
  }, []);

  const modes = [
    { 
      id: 'ELI5', 
      label: 'ELI5', 
      description: 'Explanations remove the jargon and keep it simple',
      color: 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 border-amber-200',
      icon: <Lightbulb className="h-5 w-5" />
    },
    { 
      id: 'How it works IRL', 
      label: 'How it works IRL', 
      description: 'Explanations focus on real-world applications',
      color: 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-200',
      icon: <Briefcase className="h-5 w-5" />
    },
    { 
      id: 'The Nitty Gritty', 
      label: 'The Nitty Gritty', 
      description: 'Explanations dive into the details and explain the "why" behind the "what"',
      color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-200',
      icon: <Microscope className="h-5 w-5" />
    },
    { 
      id: 'Impress your friends', 
      label: 'Impress your friends', 
      description: 'Explanations focus on the essentials, no fluff',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-orange-200',
      icon: <Sparkles className="h-5 w-5" />
    },
  ];

  const handleModeClick = async (mode: typeof modes[0]) => {
    // Call the parent's onModeSelect callback
    onModeSelect(mode.id);
    
    // If already flipped, just toggle back
    if (modeStates[mode.id]?.isFlipped) {
      setModeStates(prev => ({
        ...prev,
        [mode.id]: {
          ...prev[mode.id],
          isFlipped: false
        }
      }));
      return;
    }
    
    // Ensure we have a user ID
    if (!userId) {
      alert('You must be logged in to use this feature');
      return;
    }
    
    // Set loading state and flip the tile
    setModeStates(prev => ({
      ...prev,
      [mode.id]: {
        isLoading: true,
        isFlipped: true,
        explanation: null,
        audioUrl: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      }
    }));
    
    try {
      // Call the API to generate explanation and audio
      const response = await fetch('/api/generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          courseId,
          topicId: currentTopic.id || `topic-${currentTopic.title.replace(/\s+/g, '-').toLowerCase()}`,
          userQuery,
          syllabus,
          currentTopic,
          learningMode: mode.id,
          learningModeDescription: mode.description
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }
      
      const data = await response.json();
      
      // Create audio element
      const audio = new Audio(data.audioUrl);
      
      // Add event listeners for time updates and duration
      audio.addEventListener('timeupdate', () => {
        setModeStates(prev => ({
          ...prev,
          [mode.id]: {
            ...prev[mode.id],
            currentTime: audio.currentTime
          }
        }));
      });
      
      audio.addEventListener('loadedmetadata', () => {
        setModeStates(prev => ({
          ...prev,
          [mode.id]: {
            ...prev[mode.id],
            duration: audio.duration
          }
        }));
      });
      
      // Store audio element for later control
      setAudioElements(prev => ({
        ...prev,
        [mode.id]: audio
      }));
      
      // Update state with results
      setModeStates(prev => ({
        ...prev,
        [mode.id]: {
          isLoading: false,
          isFlipped: true,
          explanation: data.explanation,
          audioUrl: data.audioUrl,
          isPlaying: false,
          currentTime: 0,
          duration: 0
        }
      }));
    } catch (error) {
      console.error('Error generating explanation:', error);
      // Reset on error
      setModeStates(prev => ({
        ...prev,
        [mode.id]: {
          isLoading: false,
          isFlipped: false,
          explanation: null,
          audioUrl: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0
        }
      }));
      alert('Failed to generate explanation. Please try again.');
    }
  };
  
  // Stop all audio playback
  const stopAllAudio = () => {
    Object.entries(audioElements).forEach(([modeId, audio]) => {
      if (audio && modeStates[modeId]?.isPlaying) {
        audio.pause();
        setModeStates(prev => ({
          ...prev,
          [modeId]: {
            ...prev[modeId],
            isPlaying: false
          }
        }));
      }
    });
  };

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      // Stop all audio when component unmounts
      Object.values(audioElements).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, [audioElements]);

  const toggleAudio = (modeId: string) => {
    const audio = audioElements[modeId];
    if (!audio) return;
    
    if (modeStates[modeId]?.isPlaying) {
      audio.pause();
      setModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isPlaying: false
        }
      }));
    } else {
      // Pause any other playing audio
      Object.entries(audioElements).forEach(([id, audioEl]) => {
        if (id !== modeId && modeStates[id]?.isPlaying) {
          audioEl.pause();
          setModeStates(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              isPlaying: false
            }
          }));
        }
      });
      
      // Play the selected audio
      audio.play();
      setModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isPlaying: true
        }
      }));
      
      // Add ended event listener
      audio.onended = () => {
        setModeStates(prev => ({
          ...prev,
          [modeId]: {
            ...prev[modeId],
            isPlaying: false
          }
        }));
      };
    }
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full py-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Learning that works for you</h2>
        <p className="text-muted-foreground mt-2">Click on a tile to get started</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((mode) => {
          const state = modeStates[mode.id] || { 
            isLoading: false, 
            isFlipped: false, 
            explanation: null, 
            audioUrl: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0
          };
          
          // Calculate progress percentage
          const progress = state.duration > 0 ? (state.currentTime / state.duration) : 0;
          
          // Extract color for progress bar
          const colorMatch = mode.color.match(/text-(\w+)-\d+/);
          const progressColor = colorMatch ? colorMatch[1] : 'blue';
          
          return (
            <div 
              key={mode.id}
              className="perspective-1000 h-[250px]"
            >
              <div 
                className={cn(
                  "relative w-full h-full transition-all duration-500 transform-style-3d",
                  state.isFlipped ? "rotate-y-180" : ""
                )}
              >
                {/* Front of card */}
                <Button
                  onClick={() => handleModeClick(mode)}
                  variant="outline"
                  className={cn(
                    `${mode.color} h-full w-full py-6 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all hover:scale-105 shadow-sm text-left backface-hidden`,
                    state.isFlipped ? "invisible" : "visible"
                  )}
                >
                  <div className="flex flex-col items-center text-center w-full px-4">
                    {mode.icon}
                    <span className="font-medium text-lg mt-2">{mode.label}</span>
                    <p className="text-sm mt-2 text-muted-foreground">{mode.description}</p>
                  </div>
                </Button>
                
                {/* Back of card */}
                <div 
                  className={cn(
                    `${mode.color} absolute inset-0 h-full w-full py-6 flex flex-col items-center justify-center gap-2 rounded-xl border shadow-sm rotate-y-180 backface-hidden`,
                    state.isFlipped ? "visible" : "invisible"
                  )}
                >
                  {state.isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full w-full px-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p className="text-sm font-medium">{loadingPhrases[loadingPhraseIndex]}</p>
                    </div>
                  ) : state.audioUrl ? (
                    <div className="flex flex-col items-center justify-center h-full w-full px-4">
                      {/* Audio player with play/pause button */}
                      <div className="relative mb-3">
                        {/* Play/Pause button */}
                        <div 
                          className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudio(mode.id);
                          }}
                        >
                          {state.isPlaying ? (
                            <Pause className="h-8 w-8" />
                          ) : (
                            <Play className="h-8 w-8 ml-1" />
                          )}
                        </div>
                      </div>
                      
                      {/* Horizontal audio slider */}
                      <div className="w-full max-w-[200px] mb-2">
                        <div className="relative h-8 flex items-center">
                          {/* Track background */}
                          <div 
                            className="absolute w-full h-2 bg-white/30 rounded-full"
                          ></div>
                          
                          {/* Progress fill */}
                          <div 
                            className="absolute h-2 rounded-full"
                            style={{ 
                              width: `${(state.currentTime / state.duration) * 100}%`,
                              background: `var(--${progressColor}-600)`,
                              transition: 'width 0.1s linear'
                            }}
                          ></div>
                          
                          {/* Thumb/handle */}
                          <div 
                            className="absolute h-4 w-4 rounded-full bg-white border-2 cursor-pointer transform -translate-y-0 hover:scale-110 transition-transform"
                            style={{ 
                              left: `calc(${(state.currentTime / state.duration) * 100}% - 8px)`,
                              borderColor: `var(--${progressColor}-600)`,
                              transition: 'left 0.1s linear'
                            }}
                          ></div>
                          
                          {/* Invisible click area for better interaction */}
                          <div 
                            className="absolute w-full h-8 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const percentage = clickX / rect.width;
                              
                              // Ensure percentage is between 0 and 1
                              const clampedPercentage = Math.max(0, Math.min(1, percentage));
                              
                              // Set the audio current time based on percentage
                              const audio = audioElements[mode.id];
                              if (audio) {
                                const newTime = clampedPercentage * audio.duration;
                                audio.currentTime = newTime;
                                
                                // Update state
                                setModeStates(prev => ({
                                  ...prev,
                                  [mode.id]: {
                                    ...prev[mode.id],
                                    currentTime: newTime
                                  }
                                }));
                                
                                // If audio was paused, start playing from the new position
                                if (!modeStates[mode.id]?.isPlaying) {
                                  toggleAudio(mode.id);
                                }
                              }
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Time display */}
                      <div className="flex justify-between w-full max-w-[200px] mb-2 text-xs text-muted-foreground">
                        <span>{formatTime(state.currentTime)}</span>
                        <span>{formatTime(state.duration)}</span>
                      </div>
                      
                      <p className="text-sm font-medium">
                        {state.isPlaying ? 'Playing...' : 'Click to play'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Stop audio if playing
                          if (state.isPlaying && audioElements[mode.id]) {
                            audioElements[mode.id].pause();
                          }
                          setModeStates(prev => ({
                            ...prev,
                            [mode.id]: {
                              ...prev[mode.id],
                              isFlipped: false,
                              isPlaying: false
                            }
                          }));
                        }}
                      >
                        Back to modes
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-sm font-medium">Something went wrong</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleModeClick(mode)}
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningModes; 