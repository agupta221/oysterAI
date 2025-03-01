"use client"

import React, { useState, useRef, useEffect } from "react"
import { ActiveSection } from "./sidebar"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, MessageSquare, Wand2, Send, User, X, ArrowLeft, Play, FileText, BookOpen, Pause, Volume2, CheckCircle, ChevronRight, Brain } from "lucide-react"
import { Syllabus } from "@/components/ui/syllabus"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { cn } from "@/lib/utils"
import type { Syllabus as SyllabusType } from "@/lib/openai"
import { CoursesView } from "@/components/courses-view"
import { v4 as uuidv4 } from "uuid"
import type { Course } from "@/components/ui/course-tile"
import { enrichSyllabusWithResources } from "@/lib/course-generator"
import type { VideoResource } from "@/lib/serpapi"
import type { Topic } from "@/lib/openai"
import { AudioPlayer } from "@/components/ui/audio-player"
import { addCourse, getUserCourses, uploadCourseAudio, getCourseAudioUrl } from "@/lib/firebase/courseUtils"
import { auth } from "@/lib/firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ChatBot } from "@/components/ui/chat-bot"
import { QuizModal } from "@/components/ui/quiz-modal"
import { generateQuizQuestions } from "@/lib/quiz-generator"
import { CapstoneDisplay } from "@/components/ui/capstone-display"
import type { CapstoneProject } from "@/components/ui/course-tile"
import Sidebar from "@/components/sidebar"
import LearningModes from "./LearningModes"
import CourseCanvas from "./course-canvas"

const courseSuggestions = [
  {
    title: "Web Development Mastery",
    description: "I want to learn modern web development, focusing on React, Next.js, and full-stack development. I have basic HTML/CSS knowledge but want to build professional web applications with best practices, state management, and API integration."
  },
  {
    title: "Data Science Fundamentals",
    description: "I'm interested in learning data science from scratch. I want to understand Python, data analysis with pandas, visualization with matplotlib, and basic machine learning concepts. I have some programming experience but am new to data science."
  },
  {
    title: "Digital Marketing Strategy",
    description: "I want to learn comprehensive digital marketing, including SEO, social media marketing, content strategy, and analytics. I'm a beginner looking to promote my own business and potentially start a career in digital marketing."
  },
  {
    title: "UI/UX Design Principles",
    description: "I want to learn UI/UX design principles, including user research, wireframing, prototyping, and design systems. I have some graphic design experience but want to transition into product design."
  }
]

interface Message {
  type: 'user' | 'ai'
  content: string
  syllabus?: SyllabusType
}

interface TopicWithResources extends Topic {
  resources?: VideoResource[];
}

interface MainContentProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  selectedTopic: Topic | null;
  setSelectedTopic: (topic: Topic | null) => void;
  selectedCapstone: CapstoneProject | null;
  setSelectedCapstone: (capstone: CapstoneProject | null) => void;
}

// Custom audio component for the welcome section
const WelcomeAudio: React.FC<{ audioPath: string }> = ({ audioPath }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        setIsLoading(true);
        const url = await getCourseAudioUrl(audioPath);
        setAudioUrl(url);
      } catch (error) {
        console.error('Error fetching audio URL:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAudioUrl();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioPath]);

  const togglePlayPause = () => {
    if (!audioRef.current || isLoading) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress(current / total * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-12 inline-block relative">
      <div 
        className={`flex items-center justify-center w-32 h-32 mx-auto rounded-full bg-primary/10 cursor-pointer transition-all duration-300 hover:bg-primary/20 relative ${isLoading ? 'opacity-70' : ''} ${isPlaying ? 'ring-4 ring-primary/30' : ''}`}
        onClick={togglePlayPause}
      >
        {/* Progress circle */}
        {!isLoading && duration > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              stroke="rgba(0,0,0,0.05)" 
              strokeWidth="2"
            />
            <circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              stroke="rgba(var(--primary-rgb), 0.3)" 
              strokeWidth="2"
              strokeDasharray="301.59"
              strokeDashoffset={301.59 - (301.59 * progress / 100)}
              strokeLinecap="round"
            />
          </svg>
        )}
        
        <div className={`w-16 h-16 rounded-full bg-primary/80 ring-8 ring-primary/20 transition-all duration-300 ${isPlaying ? 'scale-[0.95] ring-primary/30' : ''}`} />
        {isPlaying && (
          <div className="absolute inset-0 rounded-full animate-ping-slow bg-primary/10 z-[-1]"></div>
        )}
        
        {/* Play/Pause button - always visible */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLoading ? (
            <div className="w-10 h-10 text-white animate-spin rounded-full border-3 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          ) : (
            <div className="w-10 h-10 text-white">
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Audio instruction text - always visible */}
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {isLoading ? 'Loading audio...' : isPlaying ? `${formatTime(audioRef.current?.currentTime || 0)} / ${formatTime(duration)}` : 'Click to hear course overview'}
      </div>
      
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </div>
  );
};

export default function MainContent({ 
  activeSection, 
  setActiveSection, 
  selectedCourse, 
  setSelectedCourse,
  selectedTopic,
  setSelectedTopic,
  selectedCapstone,
  setSelectedCapstone
}: MainContentProps) {
  const [searchText, setSearchText] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [showChatInput, setShowChatInput] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const [activeVideo, setActiveVideo] = useState<VideoResource | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [isCourseCanvasOpen, setIsCourseCanvasOpen] = useState(false)
  const [topicSearchQuery, setTopicSearchQuery] = useState("")
  const [isTopicSearchLoading, setIsTopicSearchLoading] = useState(false)
  const [topicQuestions, setTopicQuestions] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    isStreaming: boolean;
    isExpanded: boolean;
  }>>([])

  // Handle authentication state
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.uid);
      setIsAuthenticated(!!user);
      
      // Only load courses if user is authenticated
      if (user) {
        loadCourses();
      } else {
        setCourses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Separate function to load courses
  const loadCourses = async () => {
    console.log('Loading courses...');
    try {
      const userCourses = await getUserCourses();
      console.log('Courses loaded:', userCourses.length);
      setCourses(userCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Function to extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Add effect to scroll to latest message when messages change
  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  // Add debug logging for course selection
  useEffect(() => {
    if (selectedCourse) {
      console.log('Selected course:', {
        id: selectedCourse.id,
        title: selectedCourse.title,
        audioPath: selectedCourse.audioPath,
        hasAudio: !!selectedCourse.audioPath
      });
    }
  }, [selectedCourse]);

  const handleInitialSubmit = async () => {
    console.log("Triggering initial syllabus generation");
    if (!searchText.trim() || isLoading) return

    setIsLoading(true)
    setShowLoadingOverlay(true)

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { type: 'user', content: searchText }
    ]

    try {
      const response = await fetch('/api/generate-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: searchText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate syllabus');
      }

      const data = await response.json();

      newMessages.push({
        type: 'ai',
        content: data.description,
        syllabus: data.syllabus
      });

      setMessages(newMessages)
      setShowChat(true)
      setSearchText("")
      setShowChatInput(false)
    } catch (error) {
      console.error('Error:', error);
      newMessages.push({
        type: 'ai',
        content: "I apologize, but I encountered an error while generating your course. Please try again or rephrase your request.",
      });
    } finally {
      setIsLoading(false)
      setShowLoadingOverlay(false)
      setMessages(newMessages)
    }
  }

  const handleModificationSubmit = async () => {
    console.log("Triggering syllabus modification");
    if (!searchText.trim() || isLoading) return

    setIsLoading(true)
    setShowLoadingOverlay(true)

    // Get the most recent syllabus from messages
    const currentSyllabus = [...messages]
      .reverse()
      .find(m => m.type === 'ai' && m.syllabus)?.syllabus;

    if (!currentSyllabus) {
      console.log("No existing syllabus found to modify");
      setIsLoading(false);
      return;
    }

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { type: 'user', content: searchText }
    ]

    try {
      console.log("Sending modification request with syllabus:", currentSyllabus);
      const response = await fetch('/api/modify-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentSyllabus,
          modifications: searchText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to modify syllabus');
      }

      const data = await response.json();
      console.log("Received modified syllabus:", data);

      newMessages.push({
        type: 'ai',
        content: data.description,
        syllabus: data.syllabus
      });

    } catch (error) {
      console.error('Error:', error);
      newMessages.push({
        type: 'ai',
        content: "I apologize, but I encountered an error while modifying the course. Please try again or rephrase your request.",
      });
    } finally {
      setIsLoading(false)
      setShowLoadingOverlay(false)
      setMessages(newMessages)
      setSearchText("")
    }
  }

  // Make it more explicit which handler we're using
  const handleSubmit = async () => {
    console.log("Submit triggered, showChat:", showChat, "showChatInput:", showChatInput);
    if (showChat && showChatInput) {
      await handleModificationSubmit();
    } else {
      await handleInitialSubmit();
    }
  };

  const generateCourse = async (syllabus: SyllabusType) => {
    if (!syllabus || !syllabus.sections || syllabus.sections.length === 0) {
      return;
    }

    if (!isAuthenticated) {
      console.error('User not authenticated');
      alert('Please sign in to generate courses');
      return;
    }

    // Create a new course with generating state
    const courseId = uuidv4()
    const newCourse: Course = {
      id: courseId,
      title: syllabus.sections[0].title || "Untitled Course",
      description: syllabus.sections[0].description || "No description available",
      syllabus,
      createdAt: new Date(),
      imageUrl: "",
      isGenerating: true
    }

    // Add to local state first to show loading state
    setCourses(prev => [...prev, newCourse])
    setActiveSection("courses")

    try {
      console.log('Starting course generation...');
      // Find the last user message to get the original request
      const userRequest = [...messages]
        .reverse()
        .find(m => m.type === 'user')?.content || "";
      
      // Fetch resources for all topics in parallel and generate summary and audio
      const { syllabus: enrichedSyllabus, summary, audioUrl, capstone } = await enrichSyllabusWithResources(syllabus, userRequest);
      console.log('Course generation complete');

      // Convert audio URL to blob
      console.log('Fetching audio file...');
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();

      // Upload audio to Firebase Storage
      console.log('Uploading audio to Firebase Storage...');
      const audioPath = await uploadCourseAudio(audioBlob, courseId);

      // Create the final course object
      const finalCourse: Course = {
        ...newCourse,
        syllabus: enrichedSyllabus,
        summary,
        audioPath, // Store the Firebase Storage path instead of direct URL
        isGenerating: false,
        imageUrl: "https://source.unsplash.com/random/800x600/?education",
        capstone, // Include the capstone project
      };

      console.log('Updating local state...');
      // Update local state first
      setCourses(prev => prev.map(course => 
        course.id === courseId ? finalCourse : course
      ));

      // Only save to Firestore after successful generation and local state update
      try {
        console.log('Saving to Firestore...');
        await addCourse(finalCourse);
        console.log('Successfully saved to Firestore');
      } catch (error) {
        console.error('Error saving course to Firestore:', error);
        alert('Failed to save course. Please try again.');
      }
    } catch (error) {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
      // Update local state to remove the loading course
      setCourses(prev => prev.filter(course => course.id !== courseId));
    }
  }

  // Replace the ResourceCard component
  const ResourceCard = ({ resource }: { resource: VideoResource }) => {
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const videoId = getYouTubeVideoId(resource.url);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsVideoVisible(!isVideoVisible)}
          className="w-full text-left"
        >
          <div className="flex items-start space-x-4 p-4 rounded-lg bg-card hover:bg-primary/5 transition-colors">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {isVideoVisible ? (
                  <X className="w-5 h-5 text-primary" />
                ) : (
                  <Play className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-card-foreground truncate">
                {resource.title}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {resource.description}
              </p>
              <div className="mt-2 inline-flex items-center text-sm text-primary">
                {isVideoVisible ? 'Hide Video' : 'Watch Video'}
                <ChevronRight className="ml-1 w-4 h-4" />
              </div>
            </div>
          </div>
        </button>

        {isVideoVisible && videoId && (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  };

  const handleStartQuiz = async () => {
    if (!selectedTopic || !selectedCourse?.syllabus) return

    setIsGeneratingQuiz(true)
    try {
      const questions = await generateQuizQuestions(selectedTopic, selectedCourse.syllabus)
      setQuizQuestions(questions)
      setShowQuizModal(true)
    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('Failed to generate quiz questions. Please try again.')
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleTopicSearch = async () => {
    if (!topicSearchQuery.trim()) return
    
    setIsTopicSearchLoading(true)
    
    // Generate a unique ID for this question
    const questionId = `q-${Date.now()}`
    
    // Add the question to the list immediately with streaming state
    setTopicQuestions(prev => [
      ...prev,
      {
        id: questionId,
        question: topicSearchQuery,
        answer: "",
        isStreaming: true,
        isExpanded: false // Don't auto-expand the new question
      }
    ])
    
    try {
      // Call the API to get answers about the topic
      console.log(`Searching for: ${topicSearchQuery} about ${selectedTopic?.title}`)
      
      // Make the actual API call to the chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: topicSearchQuery }],
          currentTopic: {
            title: selectedTopic?.title || "Unknown Topic",
            description: selectedTopic?.description || "No description available"
          }
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get answer: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedAnswer = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk and append to accumulated answer
          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
          accumulatedAnswer += chunk;
          
          // Update the question with the accumulated answer so far
          setTopicQuestions(prev => 
            prev.map(q => 
              q.id === questionId 
                ? { ...q, answer: accumulatedAnswer, isStreaming: true } 
                : q
            )
          );
        }
        
        // Final update to mark streaming as complete
        setTopicQuestions(prev => 
          prev.map(q => 
            q.id === questionId 
              ? { ...q, answer: accumulatedAnswer, isStreaming: false } 
              : q
          )
        );
      } catch (streamError) {
        console.error('Error reading stream:', streamError);
        throw streamError;
      }
      
      // Clear the search query
      setTopicSearchQuery("")
    } catch (error) {
      console.error('Error searching topic:', error)
      
      // Update the question with an error message
      setTopicQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                answer: "Sorry, I couldn't find an answer to that question. Please try again.", 
                isStreaming: false 
              } 
            : q
        )
      )
    } finally {
      setIsTopicSearchLoading(false)
    }
  }

  if (selectedCourse) {
    return (
      <div className="h-full p-8 overflow-y-auto">
        {selectedTopic ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-primary">{selectedTopic.title}</h1>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleStartQuiz}
                disabled={isGeneratingQuiz}
              >
                <Brain className="h-4 w-4" />
                {isGeneratingQuiz ? "Generating Quiz..." : "Test Yourself"}
              </Button>
            </div>
            {selectedTopic.description && (
              <p className="text-muted-foreground mb-8">{selectedTopic.description}</p>
            )}
            
            <LearningModes 
              key={`learning-modes-${selectedTopic.title.replace(/\s+/g, '-').toLowerCase()}`}
              onModeSelect={(mode) => {
                console.log('Selected mode:', mode);
              }} 
              currentTopic={selectedTopic}
              syllabus={selectedCourse.syllabus}
              userQuery=""
              courseId={selectedCourse.id}
            />
            
            {/* Visual connector between learning modes and search bar */}
            <div className="relative mt-4 mb-1">
              {/* Center vertical line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-6 border-l border-dashed border-primary/40 animate-pulse-slow"></div>
              
              {/* Decorative node */}
              <div className="absolute left-1/2 -translate-x-1/2 top-6 w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"></div>
              </div>
              
              {/* Horizontal connecting lines */}
              <div className="absolute top-3 left-1/4 w-[50%] border-t border-dashed border-primary/30"></div>
              
              {/* Corner dots */}
              <div className="absolute top-3 left-1/4 w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/30 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
              <div className="absolute top-3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/30 translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
            </div>
            
            {/* Topic Search Bar */}
            <div className="mt-6 mb-12 relative">
              {/* Decorative dotted lines connecting to the learning modes */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[90%] mx-auto">
                <div className="relative h-6">
                  {/* Vertical side lines */}
                  <div className="absolute top-0 left-0 h-full border-l border-dashed border-primary/30"></div>
                  <div className="absolute top-0 right-0 h-full border-r border-dashed border-primary/30"></div>
                  
                  {/* Bottom connecting line */}
                  <div className="absolute bottom-0 left-0 w-full border-t border-dashed border-primary/30"></div>
                  
                  {/* Corner dots */}
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/30 -translate-x-1/2 translate-y-1/2 animate-pulse-slow"></div>
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/30 translate-x-1/2 translate-y-1/2 animate-pulse-slow"></div>
                </div>
              </div>
              
              <div className="group/wrapper">
                <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl bg-white/10 backdrop-blur-md shadow-sm transition-all hover:shadow-md border border-primary/30 group group-focus-within/wrapper:border-primary/50 group-focus-within/wrapper:shadow-md">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-primary/5 rounded-xl blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/5 rounded-xl"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-20"></div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-30 blur-sm rounded-xl group-hover:opacity-40 transition-opacity duration-300"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -inset-[400%] top-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rotate-45 translate-x-[0%] group-hover:translate-x-[100%] duration-2000"></div>
                  </div>
                  
                  {/* Decorative dots at corners */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-primary/40 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-primary/40 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full bg-primary/40 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-primary/40 translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-center">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder={`Ask Oyster anything about ${selectedTopic.title}...`}
                        className="w-full bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all duration-300 focus:placeholder:text-primary/50"
                        value={topicSearchQuery}
                        onChange={(e) => setTopicSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTopicSearch();
                          }
                        }}
                      />
                      {topicSearchQuery && (
                        <button 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                          onClick={() => setTopicSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Divider */}
                    <div className="h-10 w-px bg-primary/20 mx-2"></div>
                    
                    <button 
                      className="p-3 pr-4 text-primary/70 hover:text-primary transition-colors relative disabled:opacity-50 disabled:pointer-events-none"
                      onClick={handleTopicSearch}
                      disabled={isTopicSearchLoading}
                      aria-label="Search"
                    >
                      {isTopicSearchLoading ? (
                        <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      ) : (
                        <Search className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements below search bar */}
              <div className="flex justify-center mt-3">
                <div className="text-xs text-primary/60 flex items-center gap-2">
                  <div className="w-16 h-px border-t border-dashed border-primary/30"></div>
                  <div className="italic">Expand your understanding</div>
                  <div className="w-16 h-px border-t border-dashed border-primary/30"></div>
                </div>
              </div>
              
              {/* Question Pills */}
              {topicQuestions.length > 0 && (
                <div className="mt-6 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {topicQuestions.map((q) => (
                      <div key={q.id} className="relative">
                        <div 
                          className={`
                            rounded-full px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-all w-full
                            ${q.isExpanded 
                              ? 'bg-primary/20 text-primary shadow-sm' 
                              : 'bg-primary/10 text-primary/80 hover:bg-primary/15'}
                          `}
                          onClick={() => {
                            setTopicQuestions(prev => 
                              prev.map(item => 
                                item.id === q.id 
                                  ? { ...item, isExpanded: !item.isExpanded } 
                                  : item
                              )
                            )
                          }}
                        >
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                            {q.isStreaming ? (
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                            )}
                          </div>
                          <span className="truncate flex-1">{q.question}</span>
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${q.isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Expanded Answers - shown below the grid of pills */}
                  {topicQuestions.filter(q => q.isExpanded).map((q) => (
                    <div key={`answer-${q.id}`} className="mb-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-primary/20 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="mb-3 font-medium text-primary">{q.question}</div>
                        {q.isStreaming ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                            <span>Generating answer...</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground whitespace-pre-wrap">{q.answer}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedTopic.resources && selectedTopic.resources.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-primary mb-6">Dive deeper with some curated resources</h2>
                <div className="space-y-4">
                  {selectedTopic.resources.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              </div>
            )}

            {/* Floating button to open CourseCanvas */}
            <div className="fixed bottom-4 right-4 z-50">
              <Button
                onClick={() => setIsCourseCanvasOpen(true)}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300 group relative"
                title="Oyster Canvas"
              >
                <div className="relative w-10 h-10">
                  {/* Oyster shell design */}
                  <div className="absolute inset-0 bg-primary-foreground/20 rounded-full transform -rotate-45">
                    <div className="absolute inset-1 bg-gradient-to-br from-primary-foreground to-primary-foreground/80 rounded-full">
                      {/* Pearl */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg" />
                    </div>
                  </div>
                </div>
                
                {/* Tooltip - repositioned to be centered above the button with text on two lines */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 text-white px-3 py-1.5 rounded-md text-sm text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div>Oyster</div>
                  <div>Canvas</div>
                </div>
              </Button>
            </div>

            {/* CourseCanvas Component */}
            <CourseCanvas 
              isOpen={isCourseCanvasOpen} 
              onClose={() => setIsCourseCanvasOpen(false)} 
              courseId={selectedCourse?.id || ''}
            />

            {showQuizModal && (
              <QuizModal
                isOpen={showQuizModal}
                onClose={() => {
                  setShowQuizModal(false)
                  setQuizQuestions([])
                }}
                topic={selectedTopic}
                questions={quizQuestions}
              />
            )}
          </div>
        ) : selectedCapstone ? (
          <CapstoneDisplay capstone={selectedCapstone} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-2xl text-center">
              {selectedCourse.audioPath ? (
                <WelcomeAudio audioPath={selectedCourse.audioPath} />
              ) : (
                <div className="mb-12 inline-block">
                  <div className="flex items-center justify-center w-32 h-32 mx-auto rounded-full bg-primary/10">
                    <div className="w-16 h-16 rounded-full bg-primary/80 ring-8 ring-primary/20" />
                  </div>
                </div>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-primary mb-4">
                Welcome to Your Learning Journey
              </h1>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg">
                  Your course curriculum is now available in the sidebar. Here's how to get started:
                </p>
                <div className="text-left max-w-lg mx-auto space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                    <p>Explore the course sections by clicking the expand icons in the sidebar</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                    <p>Hover over section and subsection titles to view detailed descriptions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                    <p>Click on individual topics to access the learning materials and begin learning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeSection === "build") {
    if (showChat) {
      return (
        <>
          {showLoadingOverlay && <LoadingOverlay />}
          <div className="flex flex-col h-full p-8 max-w-4xl mx-auto relative">
            {/* Exit Button */}
            <Button
              variant="ghost"
              size="icon"
              className="fixed right-4 top-4 h-10 w-10 rounded-full bg-background border shadow-sm hover:bg-primary hover:text-primary-foreground transition-all z-50"
              onClick={() => {
                setShowChat(false)
                setShowChatInput(false)
                setMessages([])
                setSearchText("")
              }}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex-1 overflow-auto space-y-8 mb-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  ref={index === messages.length - 1 && message.type === 'ai' ? latestMessageRef : null}
                >
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary/80 ring-4 ring-primary/20" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-2xl rounded-2xl p-6",
                    message.type === 'user' 
                      ? "bg-primary text-primary-foreground ml-12" 
                      : "bg-muted mr-12"
                  )}>
                    <p className={cn(
                      "text-sm",
                      message.type === 'user' ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {message.content}
                    </p>
                    {message.syllabus && (
                      <>
                        <div className="mt-6">
                          <Syllabus sections={message.syllabus.sections} />
                        </div>
                        <div className="mt-6 flex gap-4 justify-end">
                          <Button 
                            variant="secondary" 
                            className="gap-2"
                            onClick={() => setShowChatInput(true)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Make Modifications
                          </Button>
                          <Button 
                            className="gap-2"
                            onClick={() => generateCourse(message.syllabus!)}
                          >
                            <Wand2 className="h-4 w-4" />
                            Generate Course
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-4 flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showChatInput && (
              <div className="flex gap-4 mt-6 border-t pt-6">
                <textarea
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 h-10 p-2 rounded-lg border bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="What modifications would you like to make to the course?"
                />
                <Button 
                  onClick={handleSubmit} 
                  size="icon" 
                  className="h-10 w-10 relative"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )
    }

    return (
      <>
        {showLoadingOverlay && <LoadingOverlay />}
        <div className="flex flex-col h-full p-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            {/* Oyster Logo */}
            <div className="mb-8 inline-block">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent mb-4">
              What would you like to learn today?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Describe your learning goals in detail, and we'll help you create the perfect course.
            </p>
          </div>
          
          <div className="w-full space-y-4">
            <div className="relative">
              <textarea
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-32 p-4 rounded-lg border bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Give us some details!"
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              className="w-full py-6 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Generating your course...
                </div>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Crack open new possibilities!
                </>
              )}
            </Button>

            <div className="mt-12">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-sm font-medium">Need inspiration? Try one of these:</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.title}
                    onClick={() => setSearchText(suggestion.description)}
                    className="p-4 rounded-lg border border-primary/10 bg-primary/5 hover:border-primary/20 hover:bg-primary/10 cursor-pointer transition-all group"
                  >
                    <h3 className="font-medium text-primary mb-2 group-hover:text-primary/80">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {suggestion.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (activeSection === "courses") {
    return (
      <CoursesView 
        courses={courses} 
        onCourseClick={setSelectedCourse}
        onCourseDelete={(courseId) => {
          // Update local state to remove the deleted course
          setCourses(prev => prev.filter(course => course.id !== courseId));
        }}
      />
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-block">
          {/* Decorative element */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
          The world is your oyster.
        </h1>
        <p className="text-lg text-muted-foreground">
          Dive in. Build your perfect learning experience!
        </p>
      </div>
    </div>
  )
}

export function CourseLayout() {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)

  const handleCapstoneClick = (capstone: CapstoneProject) => {
    setSelectedTopic(null);
    setSelectedCapstone(capstone);
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr]">
      <Sidebar
        activeSection={activeSection}
        onSectionClick={setActiveSection}
        selectedCourse={selectedCourse}
        onCourseDeselect={() => {
          setSelectedCourse(null)
          setSelectedTopic(null)
          setSelectedCapstone(null)
        }}
        onTopicClick={(topic: TopicWithResources) => {
          setSelectedTopic(topic)
          setSelectedCapstone(null)
        }}
        onCapstoneClick={handleCapstoneClick}
      />
      <MainContent
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        selectedCapstone={selectedCapstone}
        setSelectedCapstone={setSelectedCapstone}
      />
    </div>
  )
} 