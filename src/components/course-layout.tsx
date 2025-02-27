"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Sidebar, { ActiveSection } from "@/components/sidebar"
import MainContent from "@/components/main-content"
import type { Course } from "@/components/ui/course-tile"
import type { Topic } from "@/lib/openai"
import type { VideoResource } from "@/lib/serpapi"

interface TopicWithResources extends Topic {
  resources?: VideoResource[];
}

export default function CourseLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithResources | null>(null)

  const handleCourseDeselect = () => {
    setSelectedCourse(null)
    setSelectedTopic(null)
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
              onTopicClick={setSelectedTopic}
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
        />
      </main>
    </div>
  )
} 
