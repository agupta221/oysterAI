"use client"

import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Sidebar, { ActiveSection } from "@/components/sidebar"
import MainContent from "@/components/main-content"
import type { Course, CapstoneProject } from "@/components/ui/course-tile"
import type { Topic, TopicQuestion } from "@/lib/openai"
import type { VideoResource } from "@/lib/serpapi"

interface TopicWithResources extends Topic {
  resources?: VideoResource[];
  questions?: TopicQuestion[];
}

export default function CourseLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithResources | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      
      // Auto-close sidebar on initial load if mobile
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [sidebarOpen]);

  const handleCourseDeselect = () => {
    setSelectedCourse(null)
    setSelectedTopic(null)
    setSelectedCapstone(null)
  }

  const handleCapstoneClick = (capstone: CapstoneProject) => {
    setSelectedTopic(null)
    setSelectedCapstone(capstone)
    // Also collapse sidebar on capstone click on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  }
  
  // New handler for topic selection that also collapses the sidebar
  const handleTopicClick = (topic: TopicWithResources) => {
    setSelectedTopic(topic);
    // Automatically collapse the sidebar when a topic is selected
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
      {/* Sidebar with toggle button container */}
      <div className="relative flex-shrink-0 h-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "h-full relative overflow-hidden transition-all duration-300",
            sidebarOpen ? "w-80" : "w-0"
          )}
        >
          <div className="absolute inset-0 w-80 border-r bg-background">
            <Sidebar 
              activeSection={activeSection}
              onSectionClick={setActiveSection}
              selectedCourse={selectedCourse}
              onCourseDeselect={handleCourseDeselect}
              onTopicClick={handleTopicClick}
              onCapstoneClick={handleCapstoneClick}
            />
          </div>
        </aside>

        {/* Toggle Button - Now outside the collapsible area */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 z-50 h-8 w-8 rounded-full border bg-background hover:bg-primary/5 hover:text-primary",
            sidebarOpen ? "right-0 translate-x-1/2" : "left-0 translate-x-1/2"
          )}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronLeft 
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              !sidebarOpen && "rotate-180"
            )} 
          />
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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
      </main>
    </div>
  )
} 
