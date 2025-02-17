"use client"

import { useState, useRef, useEffect } from "react"
import { ActiveSection } from "./sidebar"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, MessageSquare, Wand2, Send, User, X, ArrowLeft, Play, FileText, BookOpen } from "lucide-react"
import { Syllabus } from "@/components/ui/syllabus"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { cn } from "@/lib/utils"
import type { Syllabus as SyllabusType } from "@/lib/openai"
import { CoursesView } from "@/components/courses-view"
import { v4 as uuidv4 } from "uuid"
import type { Course } from "@/components/ui/course-tile"
import { enrichSyllabusWithResources } from "@/lib/course-generator"
import type { Resource } from "@/lib/perplexity"
import type { Topic } from "@/lib/openai"

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
  resources?: Resource[];
}

interface MainContentProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  selectedTopic: TopicWithResources | null;
  setSelectedTopic: (topic: TopicWithResources | null) => void;
}

export default function MainContent({ 
  activeSection, 
  setActiveSection, 
  selectedCourse, 
  setSelectedCourse,
  selectedTopic,
  setSelectedTopic 
}: MainContentProps) {
  const [searchText, setSearchText] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [showChatInput, setShowChatInput] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const [activeVideo, setActiveVideo] = useState<Resource | null>(null)

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
    // Create a new course with generating state
    const courseId = uuidv4()
    const newCourse: Course = {
      id: courseId,
      title: syllabus.sections[0].title,
      description: syllabus.sections[0].description,
      syllabus,
      createdAt: new Date(),
      imageUrl: "",
      isGenerating: true
    }

    setCourses(prev => [...prev, newCourse])
    setActiveSection("courses")

    try {
      // Find the last user message to get the original request
      const userRequest = [...messages]
        .reverse()
        .find(m => m.type === 'user')?.content || "";

      console.log("Starting resource generation for course:", newCourse.title);
      
      // Fetch resources for all topics in parallel
      const enrichedSyllabus = await enrichSyllabusWithResources(syllabus, userRequest);

      // Update the course with the enriched syllabus
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? {
              ...course,
              syllabus: enrichedSyllabus,
              isGenerating: false,
              imageUrl: "https://source.unsplash.com/random/800x600/?education"
            }
          : course
      ))

      console.log("Course generation completed successfully!");
    } catch (error) {
      console.error("Error generating course resources:", error);
      
      // Update the course to show it's no longer generating, but keep the original syllabus
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? {
              ...course,
              isGenerating: false,
              imageUrl: "https://source.unsplash.com/random/800x600/?education"
            }
          : course
      ))
    }
  }

  if (selectedCourse) {
    return (
      <div className="h-full p-8 overflow-y-auto">
        {selectedTopic ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-2">{selectedTopic.title}</h2>
            {selectedTopic.description && (
              <p className="text-muted-foreground mb-8">{selectedTopic.description}</p>
            )}
            
            {selectedTopic.resources && selectedTopic.resources.length > 0 ? (
              <div className="space-y-12">
                {/* Video Resources */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Video Resources</h3>
                  {activeVideo && (
                    <div className="aspect-video w-full mb-6 rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(activeVideo.url)}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <div className="grid gap-4">
                    {selectedTopic.resources
                      .filter(resource => resource.type === 'video')
                      .map((resource, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (activeVideo === resource) {
                              setActiveVideo(null); // Close video if it's already active
                            } else {
                              setActiveVideo(resource); // Open new video
                            }
                          }}
                          className={cn(
                            "block p-4 rounded-lg border text-left transition-colors group",
                            activeVideo === resource 
                              ? "border-primary bg-primary/10" 
                              : "border-primary/10 bg-primary/5 hover:bg-primary/10"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {activeVideo === resource ? (
                                <X className="h-4 w-4 text-primary" />
                              ) : (
                                <Play className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-primary group-hover:text-primary/80 mb-1">
                                {resource.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {resource.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                  {selectedTopic.resources.filter(resource => resource.type === 'video').length === 0 && (
                    <p className="text-center text-muted-foreground">No video resources available for this topic.</p>
                  )}
                </div>

                {/* Additional Resources */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Additional Resources</h3>
                  <div className="grid gap-4">
                    {selectedTopic.resources
                      .filter(resource => resource.type !== 'video')
                      .map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          {resource.type === 'article' ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-primary group-hover:text-primary/80 mb-1">
                              {resource.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  {selectedTopic.resources.filter(resource => resource.type !== 'video').length === 0 && (
                    <p className="text-center text-muted-foreground">No additional resources available for this topic.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No resources available for this topic yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-2xl text-center">
              <div className="mb-8 inline-block">
                <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
                  <div className="w-10 h-10 rounded-full bg-primary/80 ring-8 ring-primary/20" />
                </div>
              </div>
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
                    <p>Click on individual topics to access the learning materials and begin your studies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
                  rows={1}
                  disabled={isLoading}
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
    return <CoursesView courses={courses} onCourseClick={setSelectedCourse} />
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