"use client"

import React, { useState, useRef, useEffect } from "react"
import { ActiveSection } from "./sidebar"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, MessageSquare, Wand2, Send, User, X, ArrowLeft, Play, FileText, BookOpen, Pause, Volume2, CheckCircle, ChevronRight, Brain, Youtube, ExternalLink, ChevronLeft, Lightbulb, Briefcase, Microscope, Lock, ChevronDown, HelpCircle } from "lucide-react"
import { Syllabus } from "@/components/ui/syllabus"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { cn } from "@/lib/utils"
import type { Syllabus as SyllabusType, Section, Subsection, Topic, TopicQuestion } from "@/lib/openai"
import { CoursesView } from "@/components/courses-view"
import { v4 as uuidv4 } from "uuid"
import type { Course } from "@/components/ui/course-tile"
import { enrichSyllabusWithResources } from "@/lib/course-generator"
import type { VideoResource } from "@/lib/serpapi"
import { AudioPlayer } from "@/components/ui/audio-player"
import { addCourse, getUserCourses, uploadCourseAudio, getCourseAudioUrl } from "@/lib/firebase/courseUtils"
import { auth } from "@/lib/firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ChatBot } from "@/components/ui/chat-bot"
import { QuizModal } from "@/components/ui/quiz-modal"
import { generateQuizQuestions } from "@/lib/quiz-generator"
import { CapstoneDisplay } from "@/components/ui/capstone-display"
import type { CapstoneProject } from "@/lib/openai"
import CourseCanvas from "@/components/course-canvas"
import Sidebar from "@/components/sidebar"
import { QuizCustomizationModal, QuizCustomizationOptions } from "@/components/ui/quiz-customization-modal"
import { InteractiveModeButton } from "@/components/ui/interactive-mode-button"
import type { InteractiveModeContent } from '@/lib/interactive-mode-generator'
import { TimelineModal } from "@/components/ui/timeline-modal"
import { ScenarioModal } from "@/components/ui/scenario-modal"
import { CaseStudyModal } from "@/components/ui/case-study-modal"
import { toast } from "sonner"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

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
  questions?: TopicQuestion[];
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
        {isLoading ? 'Loading audio...' : isPlaying ? `${formatTime(audioRef.current?.currentTime || 0)} / ${formatTime(duration)}` : 'Click hear for a quick overview'}
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
  const [showQuizCustomizationModal, setShowQuizCustomizationModal] = useState(false)
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionModeStates, setQuestionModeStates] = useState<Record<string, {
    isLoading: boolean;
    explanation: string | null;
    timestampedWords: Array<{word: string, startTime: number, endTime: number}>;
    audioUrl: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isExpanded: boolean;
    streamedText: string;
    streamingComplete: boolean;
  }>>({});
  const [questionAudioElements, setQuestionAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const [isLoadingInteractiveMode, setIsLoadingInteractiveMode] = useState(false)
  const [interactiveModeContent, setInteractiveModeContent] = useState<InteractiveModeContent | null>(null)
  const [showInteractiveMode, setShowInteractiveMode] = useState(false)

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log('Authentication state changed:', {
        isAuthenticated: !!user,
        userId: user?.uid
      });
    });
    
    return () => unsubscribe();
  }, []);

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

  // Reset question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Reset question mode states when question changes
  useEffect(() => {
    // Pause and clean up any playing audio
    Object.values(questionAudioElements).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
    
    setQuestionModeStates({});
    setQuestionAudioElements({});
  }, [currentQuestionIndex, selectedTopic]);

  // Clean up audio elements when component unmounts
  useEffect(() => {
    return () => {
      // Pause and clean up any playing audio
      Object.values(questionAudioElements).forEach(audio => {
        if (!audio.paused) {
          audio.pause();
        }
      });
    };
  }, [questionAudioElements]);

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

  const handleStartQuiz = () => {
    if (!selectedTopic || !selectedCourse?.syllabus) return
    setShowQuizCustomizationModal(true)
  }

  const handleGenerateQuiz = async (options: QuizCustomizationOptions) => {
    if (!selectedTopic || !selectedCourse?.syllabus) return

    setShowQuizCustomizationModal(false)
    setIsGeneratingQuiz(true)
    
    try {
      // Pass the customization options to the generateQuizQuestions function
      const questions = await generateQuizQuestions(selectedTopic, selectedCourse.syllabus, options)
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

  // Handle learning mode selection for a specific question
  const handleQuestionModeSelect = async (modeId: string, question: TopicQuestion) => {
    // If already expanded, just toggle back
    if (questionModeStates[modeId]?.isExpanded) {
      setQuestionModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isExpanded: false
        }
      }));
      
      // Pause audio if playing
      if (questionAudioElements[modeId] && questionModeStates[modeId]?.isPlaying) {
        questionAudioElements[modeId].pause();
        setQuestionModeStates(prev => ({
          ...prev,
          [modeId]: {
            ...prev[modeId],
            isPlaying: false
          }
        }));
      }
      
      return;
    }
    
    // Ensure we have a user ID
    if (!isAuthenticated) {
      alert('You must be logged in to use this feature');
      return;
    }
    
    // Double-check Firebase auth state
    if (!auth.currentUser) {
      console.error('Firebase auth currentUser is null despite isAuthenticated being true');
      alert('Authentication error. Please try logging out and back in.');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('Current authenticated user ID:', userId);
    
    // Set loading state and expand the mode
    setQuestionModeStates(prev => ({
      ...prev,
      [modeId]: {
        isLoading: true,
        explanation: null,
        timestampedWords: [],
        audioUrl: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isExpanded: true,
        streamedText: "",
        streamingComplete: false
      }
    }));
    
    try {
      // Prepare the request payload
      const payload = {
        userId,
        courseId: selectedCourse?.id,
        topicId: `topic-${selectedTopic?.title.replace(/\s+/g, '-').toLowerCase()}`,
        userQuery: question.question,
        syllabus: selectedCourse?.syllabus,
        currentTopic: selectedTopic,
        learningMode: modeId,
        learningModeDescription: learningModes.find(m => m.id === modeId)?.description || '',
        questionContext: {
          question: question.question,
          answer: question.answer,
          searchQuery: question.searchQuery
        }
      };
      
      console.log('Sending request to generate explanation with payload:', JSON.stringify({
        userId: payload.userId,
        courseId: payload.courseId,
        topicId: payload.topicId,
        learningMode: payload.learningMode,
        questionText: question.question.substring(0, 30) + '...',
        // Omitting larger objects for clarity
      }));
      
      // Call the API to generate explanation and audio for the question
      const response = await fetch('/api/generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`Failed to generate explanation: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received explanation data:', {
        hasTimestampedExplanation: !!data.timestampedExplanation,
        wordCount: data.timestampedExplanation?.words?.length || 0,
        hasAudioUrl: !!data.audioUrl,
        error: data.error
      });
      
      // Check if there's an error message but we still have an explanation
      if (data.error && data.timestampedExplanation) {
        console.warn('API warning:', data.error);
      }
      
      // Get the explanation text and timestamped words
      const explanationText = data.timestampedExplanation?.fullText || '';
      const timestampedWords = data.timestampedExplanation?.words || [];
      
      // Create audio element if we have an audio URL
      let audio: HTMLAudioElement | null = null;
      if (data.audioUrl) {
        audio = new Audio(data.audioUrl);
        
        // Add debounce for timeupdate to prevent too frequent updates
        let lastUpdateTime = 0;
        
        // Add event listeners for time updates and duration
        audio.addEventListener('timeupdate', () => {
          const now = Date.now();
          // Only update every 50ms to prevent too frequent updates
          if (now - lastUpdateTime < 50) return;
          lastUpdateTime = now;
          
          const currentTime = audio?.currentTime || 0;
          const duration = audio?.duration || 0;
          
          // Get the current streamed text based on timestamps
          let streamedText = '';
          let streamingComplete = false;
          
          // Check if we're near the end of the audio
          const isNearEnd = currentTime >= duration - 0.2;
          
          // If we're near the end, show the full text
          if (isNearEnd) {
            streamedText = explanationText;
            streamingComplete = true;
          } else {
            // Use our fixed-rate approach regardless of whether we have timestamps
            if (timestampedWords.length > 0) {
              streamedText = getTextAtTimestamp(timestampedWords, currentTime, modeId);
            } else {
              streamedText = calculateStreamedText(explanationText, currentTime, duration, modeId);
            }
            streamingComplete = false;
          }
          
          setQuestionModeStates(prev => ({
            ...prev,
            [modeId]: {
              ...prev[modeId],
              currentTime,
              streamedText,
              streamingComplete
            }
          }));
        });
        
        // Add event listener for when audio ends
        audio.addEventListener('ended', () => {
          setQuestionModeStates(prev => ({
            ...prev,
            [modeId]: {
              ...prev[modeId],
              isPlaying: false,
              streamingComplete: true,
              // Show the full text when audio ends
              streamedText: explanationText
            }
          }));
        });
        
        audio.addEventListener('loadedmetadata', () => {
          setQuestionModeStates(prev => ({
            ...prev,
            [modeId]: {
              ...prev[modeId],
              duration: audio?.duration || 0
            }
          }));
        });
        
        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
          console.error('Error loading audio:', e);
          setQuestionModeStates(prev => ({
            ...prev,
            [modeId]: {
              ...prev[modeId],
              isLoading: false,
              explanation: prev[modeId]?.explanation || data.explanation,
              audioUrl: null // Clear the audio URL on error
            }
          }));
        });
        
        // Store audio element for later control
        setQuestionAudioElements(prev => ({
          ...prev,
          [modeId]: audio as HTMLAudioElement
        }));
      }
      
      // Update state with results
      setQuestionModeStates(prev => {
        // Check if we should start playing immediately
        const shouldPlay = prev[modeId]?.isPlaying || false;
        
        // If we should start playing, play the audio
        if (shouldPlay && audio) {
          // Add a small delay before playing to ensure everything is set up
          setTimeout(() => {
            audio.play().catch(error => {
              console.error('Error playing audio:', error);
            });
          }, 100);
        }
        
        return {
          ...prev,
          [modeId]: {
            ...prev[modeId],
            isLoading: false,
            explanation: explanationText,
            timestampedWords: timestampedWords,
            audioUrl: data.audioUrl,
            currentTime: 0,
            duration: 0,
            // Start with empty text, not the full explanation
            streamedText: shouldPlay ? "" : "",
            streamingComplete: false,
            isPlaying: shouldPlay
          }
        };
      });
    } catch (error) {
      console.error('Error generating explanation:', error);
      
      // Update state with error
      setQuestionModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isLoading: false,
          explanation: "Sorry, we couldn't generate an explanation at this time. Please try again later."
        }
      }));
    }
  };
  
  // Toggle play/pause for question audio
  const toggleQuestionAudio = (modeId: string) => {
    const audio = questionAudioElements[modeId];
    if (!audio) {
      console.warn('Audio element not found for mode:', modeId);
      return;
    }
    
    const state = questionModeStates[modeId];
    if (!state) return;
    
    if (state.isPlaying) {
      // Pause audio
      audio.pause();
      
      // When paused, keep the current streamed text
      setQuestionModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isPlaying: false
        }
      }));
    } else {
      // Pause any other playing audio first
      Object.entries(questionAudioElements).forEach(([id, audioEl]) => {
        if (id !== modeId && questionAudioElements[id] && questionModeStates[id]?.isPlaying) {
          audioEl.pause();
          setQuestionModeStates(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              isPlaying: false
            }
          }));
        }
      });
      
      // If starting from the beginning or near the end, reset the streamed text
      if (audio.currentTime < 0.1 || audio.currentTime >= audio.duration - 0.2 || state.streamingComplete) {
        // Reset to beginning if at the end or streaming is complete
        audio.currentTime = 0;
        
        setQuestionModeStates(prev => ({
          ...prev,
          [modeId]: {
            ...prev[modeId],
            streamedText: '',
            streamingComplete: false
          }
        }));
      }
      
      // Play the selected audio
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setQuestionModeStates(prev => ({
          ...prev,
          [modeId]: {
            ...prev[modeId],
            isPlaying: false,
            audioUrl: null, // Clear the audio URL on error
            streamedText: prev[modeId]?.explanation || '',
            streamingComplete: true
          }
        }));
      });
      
      setQuestionModeStates(prev => ({
        ...prev,
        [modeId]: {
          ...prev[modeId],
          isPlaying: true
        }
      }));
    }
  };
  
  // Format time for audio player
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Define learning modes
  const learningModes = [
    { 
      id: 'ELI5', 
      label: 'Explain like I\'m 5', 
      description: 'Simple explanations, without the jargon',
      color: 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 border-amber-200',
      icon: <Lightbulb className="h-5 w-5" />
    },
    { 
      id: 'How it works IRL', 
      label: 'How it works IRL', 
      description: 'Explanations with concrete examples',
      color: 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-200',
      icon: <Briefcase className="h-5 w-5" />
    },
    { 
      id: 'The Nitty Gritty', 
      label: 'The Nitty Gritty', 
      description: 'In-depth explanations, with specifics',
      color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-200',
      icon: <Microscope className="h-5 w-5" />
    },
    { 
      id: 'Impress your friends', 
      label: 'Impress \'em', 
      description: '5-6 essential facts, concise & memorable',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-orange-200',
      icon: <Sparkles className="h-5 w-5" />
    },
  ];

  // Calculate streamed text based on a fixed characters-per-minute rate
  const calculateStreamedText = (fullText: string, currentTime: number, duration: number, modeId: string): string => {
    if (!fullText || duration <= 0) return '';
    
    // Add a small delay to the start of streaming (0.3 seconds)
    // This helps account for any initial audio buffering
    const adjustedTime = Math.max(0, currentTime - 0.3);
    
    // Use a fixed characters-per-minute rate
    // Average reading speed is about 200-250 words per minute
    // Assuming an average of 5 characters per word, that's about 1000-1250 characters per minute
    // We'll use a moderate rate of 800 characters per minute (13.3 characters per second)
    let charsPerSecond = 13.3;
    
    // If we have a duration and text, adjust the rate to ensure all text is shown by the end
    if (duration > 0 && fullText.length > 0) {
      // Calculate the ideal characters per second to show all text by the end of the audio
      // Subtract 1 second from duration to ensure all text is shown before the very end
      const idealCharsPerSecond = fullText.length / Math.max(1, duration - 1);
      
      // Use the ideal rate if it's higher than our default
      if (idealCharsPerSecond > charsPerSecond) {
        charsPerSecond = idealCharsPerSecond;
      }
    }
    
    // Calculate how many characters should be shown based on the current time
    let charCount = Math.floor(adjustedTime * charsPerSecond);
    
    // Apply smoothing to prevent text from jumping too much
    const modeState = questionModeStates[modeId];
    if (modeState && modeState.streamedText) {
      // Get the current number of characters shown
      const currentCharCount = modeState.streamedText.length;
      
      // Limit how many characters can appear in a single update (max 15 chars per update)
      if (charCount > currentCharCount + 15) {
        charCount = currentCharCount + 15;
      }
    }
    
    // Limit to the actual number of characters we have
    const visibleCharCount = Math.min(charCount, fullText.length);
    
    // Return the substring
    return fullText.substring(0, visibleCharCount);
  };

  // Get text at a specific timestamp using a fixed words-per-minute rate
  const getTextAtTimestamp = (
    words: Array<{word: string, startTime: number, endTime: number}>, 
    currentTime: number,
    modeId: string
  ): string => {
    if (!words || words.length === 0) return '';
    
    // Add a small delay to the start of streaming (0.3 seconds)
    // This helps account for any initial audio buffering
    const adjustedTime = Math.max(0, currentTime - 0.3);
    
    // Instead of using the word timestamps, we'll use a fixed words-per-minute rate
    // Average speaking rate is about 150 words per minute, or 2.5 words per second
    // We'll use a moderate rate of 120 words per minute (2 words per second) for better readability
    let wordsPerSecond = 3.5;
    
    // Get the audio duration from the state
    const duration = questionModeStates[modeId]?.duration || 0;
    
    // If we have a duration and words, adjust the rate to ensure all words are shown by the end
    if (duration > 0 && words.length > 0) {
      // Calculate the ideal words per second to show all words by the end of the audio
      // Subtract 1 second from duration to ensure all words are shown before the very end
      const idealWordsPerSecond = words.length / Math.max(1, duration - 1);
      
      // Use the ideal rate if it's higher than our default
      if (idealWordsPerSecond > wordsPerSecond) {
        wordsPerSecond = idealWordsPerSecond;
      }
    }
    
    // Calculate how many words should be shown based on the current time
    let wordCount = Math.floor(adjustedTime * wordsPerSecond);
    
    // Apply smoothing to prevent text from jumping too much
    const modeState = questionModeStates[modeId];
    if (modeState && modeState.streamedText) {
      // Get the current number of words shown
      const currentWordCount = modeState.streamedText.split(/\s+/).length;
      
      // Limit how many words can appear in a single update (max 3 words per update)
      if (wordCount > currentWordCount + 3) {
        wordCount = currentWordCount + 3;
      }
    }
    
    // Limit to the actual number of words we have
    const visibleWordCount = Math.min(wordCount, words.length);
    
    // If no words are visible yet, return empty string
    if (visibleWordCount <= 0) return '';
    
    // Join the visible words with spaces
    return words.slice(0, visibleWordCount).map(word => word.word).join(' ');
  };

  const handleInteractiveModeClick = async () => {
    if (!selectedTopic?.questions?.[currentQuestionIndex] || !selectedCourse) return
    
    console.log('Starting interactive mode request for question:', {
      question: selectedTopic.questions[currentQuestionIndex].question,
      courseId: selectedCourse.id,
      topicId: `topic-${selectedTopic.title.replace(/\s+/g, '-').toLowerCase()}`
    })
    
    setIsLoadingInteractiveMode(true)
    try {
      // Get the current user
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create a unique ID for this question's interactive mode content
      const questionId = selectedTopic.questions[currentQuestionIndex].question
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)

      // Check if we have cached data in Firestore
      const interactiveModeRef = collection(db, 'users', user.uid, 'interactive-modes')
      const q = query(
        interactiveModeRef,
        where('questionId', '==', questionId),
        where('courseId', '==', selectedCourse.id),
        where('topicId', '==', `topic-${selectedTopic.title.replace(/\s+/g, '-').toLowerCase()}`)
      )

      const querySnapshot = await getDocs(q)
      let cachedData = null

      if (!querySnapshot.empty) {
        cachedData = querySnapshot.docs[0].data()
        console.log('Found cached interactive mode data:', cachedData)
      }

      if (cachedData) {
        // Use cached data
        //toast.info(`Opening ${cachedData.mode} interactive mode`)
        // toast.info(`Opening ${cachedData.mode} interactive mode`, {
        //   description: 'Click outside the modal to close it when you\'re done.'
        // })
        setInteractiveModeContent(cachedData.content)
        setShowInteractiveMode(true)
      } else {
        // Generate new content via API
        const token = await user.getIdToken()
        const response = await fetch('/api/interactive-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            question: selectedTopic.questions[currentQuestionIndex].question,
            courseId: selectedCourse.id,
            topicId: `topic-${selectedTopic.title.replace(/\s+/g, '-').toLowerCase()}`
          }),
        })

        if (!response.ok && response.status !== 200) {
          throw new Error('Failed to fetch interactive mode content')
        }

        const data = await response.json()
        
        // Log the response
        console.log('Interactive mode API response:', {
          mode: data.mode,
          content: data.content,
          fullResponse: data
        })
        
        // Check if there was an error but we have fallback content
        if (data.error && data.fallbackContent) {
          console.warn('Using fallback content due to error:', data.error, data.details)
          toast.warning('Using simplified interactive mode due to an error', {
            description: 'Some features may be limited.'
          })
          
          // Use the fallback content
          data.content = data.fallbackContent
          data.mode = data.fallbackMode || 'scenario-based'
        }
        
        // Log when case study mode is detected
        if (data.content && 'caseStudy' in data.content) {
          console.log('Case study mode detected:', data.content.caseStudy)
        }

        // Store the new data in Firestore
        try {
          await addDoc(interactiveModeRef, {
            questionId,
            courseId: selectedCourse.id,
            topicId: `topic-${selectedTopic.title.replace(/\s+/g, '-').toLowerCase()}`,
            mode: data.mode,
            content: data.content,
            createdAt: new Date(),
            question: selectedTopic.questions[currentQuestionIndex].question
          })
          console.log('Successfully stored interactive mode data in Firestore')
        } catch (error) {
          console.error('Error storing interactive mode data:', error)
          // Continue even if storage fails - we can still show the content
        }
        
        // Show a toast notification with the selected mode
        //toast.info(`Opening ${data.mode} interactive mode`)
        // toast.info(`Opening ${data.mode} interactive mode`, {
        //   description: 'Click outside the modal to close it when you\'re done.'
        // })
        
        setInteractiveModeContent(data.content)
        setShowInteractiveMode(true)
      }
    } catch (error) {
      console.error('Error fetching interactive mode:', error)
      toast.error('Failed to load interactive mode')
    } finally {
      setIsLoadingInteractiveMode(false)
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
            
            {/* Visual connector between learning modes and questions */}
            {selectedTopic.questions && selectedTopic.questions.length > 0 && (
              <div className="relative my-4">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-8 border-l border-dashed border-primary/40"></div>
                <div className="absolute left-1/2 -translate-x-1/2 top-8 w-4 h-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                </div>
              </div>
            )}
            
            {/* Display a single question with navigation */}
            {selectedTopic.questions && selectedTopic.questions.length > 0 && (
              <div className="mt-8 mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-primary">Byte sized learning</h2>
                  <div className="text-sm text-primary/60">
                    Question {currentQuestionIndex + 1} of {selectedTopic.questions.length}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-primary/20 p-6 shadow-sm">
                  {/* Question header with enhanced styling */}
                  <div className="mb-5 pb-4 border-b border-primary/10">
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            <div className="p-1 rounded-full bg-primary/10 animate-pulse-slow">
                              <HelpCircle className="h-5 w-5 text-primary/70" />
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-primary leading-tight">
                            {selectedTopic.questions[currentQuestionIndex].question}
                          </h3>
                        </div>
                        <InteractiveModeButton 
                          onClick={handleInteractiveModeClick}
                          disabled={!isAuthenticated || isLoadingInteractiveMode}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer text - visible by default */}
                  <div className="text-muted-foreground whitespace-pre-wrap mb-6">
                    {selectedTopic.questions[currentQuestionIndex].answer}
                  </div>
                  
                  {/* Learning modes for this question */}
                  <div className="mt-2 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-px border-t border-dashed border-primary/30"></div>
                      <h4 className="text-sm font-medium text-primary">Learn your way</h4>
                      <div className="w-8 h-px border-t border-dashed border-primary/30"></div>
                    </div>
                    
                    {!isAuthenticated && (
                      <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-2 text-primary/80">
                          <Lock className="h-4 w-4" />
                          <span className="font-medium">Login required</span>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          Please log in to access personalized learning modes for this question.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mx-auto"
                          onClick={() => {
                            // Redirect to login page or open login modal
                            // This depends on your authentication implementation
                            const event = new CustomEvent('open-auth-modal', { detail: { mode: 'login' } });
                            window.dispatchEvent(event);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Log in
                        </Button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {learningModes.map((mode) => {
                        const modeState = questionModeStates[mode.id];
                        const isExpanded = modeState?.isExpanded;
                        const isLoading = modeState?.isLoading;
                        const isPlaying = modeState?.isPlaying;
                        
                        return (
                          <div key={mode.id} className="flex flex-col">
                            <button
                              onClick={() => handleQuestionModeSelect(mode.id, selectedTopic.questions![currentQuestionIndex])}
                              className={cn(
                                "relative rounded-lg p-3 text-left transition-all duration-200 border",
                                mode.color,
                                isExpanded ? "ring-2 ring-primary/40 shadow-md" : "hover:shadow-sm",
                                !isAuthenticated && "opacity-60 cursor-not-allowed"
                              )}
                              disabled={!isAuthenticated || isLoading}
                              title={!isAuthenticated ? "Please log in to use this feature" : ""}
                            >
                              <div className="flex items-center gap-2">
                                {mode.icon}
                                <span className="font-medium">{mode.label}</span>
                              </div>
                              <p className="text-xs mt-1 opacity-80">{mode.description}</p>
                              
                              {/* Loading indicator */}
                              {isLoading && (
                                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                                </div>
                              )}
                              
                              {/* Authentication indicator */}
                              {!isAuthenticated && (
                                <div className="absolute top-1 right-1 text-primary/60">
                                  <Lock className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Expanded explanation */}
                  {Object.entries(questionModeStates).map(([modeId, state]) => {
                    if (!state.isExpanded || !state.explanation) return null;
                    
                    const mode = learningModes.find(m => m.id === modeId);
                    if (!mode) return null;
                    
                    return (
                      <div 
                        key={`explanation-${modeId}`} 
                        className={cn(
                          "mt-4 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-200",
                          mode.color.split(' ')[0], // Use the first color class
                          "border-primary/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {mode.icon}
                            <h4 className="font-medium">{mode.label} Explanation</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              setQuestionModeStates(prev => ({
                                ...prev,
                                [modeId]: {
                                  ...prev[modeId],
                                  isExpanded: false
                                }
                              }));
                              
                              // Pause audio if playing
                              if (questionAudioElements[modeId] && state.isPlaying) {
                                questionAudioElements[modeId].pause();
                                setQuestionModeStates(prev => ({
                                  ...prev,
                                  [modeId]: {
                                    ...prev[modeId],
                                    isPlaying: false
                                  }
                                }));
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm whitespace-pre-wrap mb-3 relative">
                          {/* Show streamed text when playing, empty or placeholder when not playing */}
                          <div className="relative">
                            <div 
                              className="max-h-[4.5rem] overflow-y-auto pr-1 scroll-smooth scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-primary/20 scrollbar-track-transparent" 
                              style={{ scrollBehavior: 'smooth' }}
                              ref={(el) => {
                                // Auto-scroll to bottom when content changes
                                if (el && state.isPlaying) {
                                  // Add a small delay to ensure the scroll happens after the content is rendered
                                  setTimeout(() => {
                                    el.scrollTop = el.scrollHeight;
                                  }, 10);
                                }
                              }}
                            >
                              {state.isPlaying || state.streamingComplete ? (
                                <div className="pb-4 leading-relaxed">
                                  <span>{state.streamedText}</span>
                                  {state.isPlaying && !state.streamingComplete && (
                                    <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-blink"></span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/70 italic">
                                  Press play to listen and see the explanation...
                                </span>
                              )}
                            </div>
                            
                            {/* Fade effect at the bottom */}
                            {(state.isPlaying || state.streamingComplete) && state.streamedText.length > 150 && (
                              <>
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background/90 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-1 text-primary/40 animate-bounce">
                                  <ChevronDown className="h-3 w-3" />
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Text streaming progress indicator */}
                          {state.isPlaying && state.explanation && (
                            <div className="mt-2 h-0.5 bg-primary/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary/40" 
                                style={{ 
                                  width: `${state.streamedText.length / (state.explanation?.length || 1) * 100}%` 
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Audio player */}
                        {state.audioUrl ? (
                          <div className="flex items-center gap-3 mt-4 text-xs">
                            <button
                              onClick={() => toggleQuestionAudio(modeId)}
                              className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                            >
                              {state.isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                            
                            <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary/60" 
                                style={{ 
                                  width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            
                            <div className="text-muted-foreground">
                              {formatTime(state.currentTime)} / {formatTime(state.duration)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-4 italic">
                            Audio unavailable. Please try again later.
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="flex items-center gap-2 mt-6">
                    <div className="text-xs text-primary/60 flex items-center gap-2">
                      <div className="w-8 h-px border-t border-dashed border-primary/30"></div>
                      <div className="italic">Related videos</div>
                      <div className="w-8 h-px border-t border-dashed border-primary/30"></div>
                    </div>
                  </div>
                  
                  <div className="mt-2 mb-4">
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTopic.questions[currentQuestionIndex].searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Youtube className="h-4 w-4" />
                      <span>Watch videos about: {selectedTopic.questions[currentQuestionIndex].searchQuery}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentQuestionIndex((prev) => (prev - 1 + selectedTopic.questions!.length) % selectedTopic.questions!.length)}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentQuestionIndex((prev) => (prev + 1) % selectedTopic.questions!.length)}
                      className="flex items-center gap-1"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedTopic.resources && selectedTopic.resources.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-semibold text-primary mb-4">Dive deeper with some curated resources</h2>
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

            {showQuizCustomizationModal && (
              <QuizCustomizationModal
                isOpen={showQuizCustomizationModal}
                onClose={() => setShowQuizCustomizationModal(false)}
                topic={selectedTopic}
                onGenerateQuiz={handleGenerateQuiz}
              />
            )}

            {showQuizModal && (
              <QuizModal
                isOpen={showQuizModal}
                onClose={() => {
                  setShowQuizModal(false)
                  setQuizQuestions([])
                }}
                topic={selectedTopic}
                questions={quizQuestions}
                timeLimit={null}
              />
            )}

            {interactiveModeContent && showInteractiveMode && (
              'timeline' in interactiveModeContent ? (
                <TimelineModal
                  isOpen={showInteractiveMode}
                  onClose={() => {
                    setShowInteractiveMode(false)
                    setInteractiveModeContent(null)
                  }}
                  content={interactiveModeContent}
                />
              ) : 'scenario' in interactiveModeContent ? (
                <ScenarioModal
                  isOpen={showInteractiveMode}
                  onClose={() => {
                    setShowInteractiveMode(false)
                    setInteractiveModeContent(null)
                  }}
                  content={interactiveModeContent}
                />
              ) : 'caseStudy' in interactiveModeContent ? (
                <CaseStudyModal
                  isOpen={showInteractiveMode}
                  onClose={() => {
                    setShowInteractiveMode(false)
                    setInteractiveModeContent(null)
                  }}
                  content={interactiveModeContent}
                />
              ) : null
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
                  Your learning roadmap is now available in the sidebar. Here's how to get started:
                </p>
                <div className="text-left max-w-lg mx-auto space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                    <p>Explore the learning space sections by clicking the expand icons in the sidebar</p>
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
                    <p>Click on individual topics to access the learning materials and begin your exploration</p>
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
                            Generate Learning Space
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
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
                <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent mb-4">
              What would you like to learn today?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Describe your learning goals in detail, and we'll help create a space that works for you.
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
                  Crack open new possibilities
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