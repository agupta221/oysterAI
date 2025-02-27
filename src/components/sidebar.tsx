import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Clock, GraduationCap, Layout, Settings, Target, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Course } from "@/components/ui/course-tile"
import { Syllabus } from "@/components/ui/syllabus"
import { Button } from "@/components/ui/button"
import type { Topic } from "@/lib/openai"
import type { VideoResource } from "@/lib/serpapi"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthStatus } from "@/components/auth/auth-status"

interface TopicWithResources extends Topic {
  resources?: VideoResource[];
}

export type ActiveSection = "build" | "courses" | "preferences" | null

interface SidebarProps {
  onSectionClick: (section: ActiveSection) => void;
  activeSection: ActiveSection;
  selectedCourse: Course | null;
  onCourseDeselect: () => void;
  onTopicClick: (topic: TopicWithResources) => void;
}

const sidebarSections = [
  {
    id: "build" as const,
    title: "Build A Course",
    description: "Define your learning goals",
    icon: Layout,
  },
  {
    id: "courses" as const,
    title: "Your Courses",
    description: "Explore your creations",
    icon: Target,
  },
  {
    id: "preferences" as const,
    title: "Preferences",
    description: "Customize your experience",
    icon: Settings,
  },
]

export default function Sidebar({ onSectionClick, activeSection, selectedCourse, onCourseDeselect, onTopicClick }: SidebarProps) {
  const handleBackClick = () => {
    onCourseDeselect()
    onSectionClick("courses")
  }

  if (selectedCourse) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-card">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-6 -ml-2 text-muted-foreground hover:text-primary"
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back to your courses
            </Button>
            
            <h1 className="text-xl font-semibold text-primary">
              {selectedCourse.title}
            </h1>
          </div>
          {selectedCourse.syllabus ? (
            <Syllabus 
              sections={selectedCourse.syllabus.sections} 
              onTopicClick={onTopicClick}
            />
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              Course content is not available
            </div>
          )}
        </div>
        
        {/* User controls at bottom */}
        <div className="p-4 border-t flex items-center justify-between">
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-1 hover:opacity-80 transition-opacity">
            {/* Simple pearl/oyster icon using CSS */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-primary/80 ring-4 ring-primary/20" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Oyster</h1>
          </Link>
          <p className="text-sm text-muted-foreground">Personalized Learning, Limitless Potential</p>
        </div>
        <div className="space-y-2">
          {sidebarSections.map((section) => (
            <Card
              key={section.title}
              className={cn(
                "cursor-pointer border-transparent transition-all duration-200",
                activeSection === section.id 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-primary/20 hover:bg-primary/5"
              )}
              onClick={() => onSectionClick(section.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-4">
                  <section.icon className="h-5 w-5 text-primary/80" />
                  <div>
                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                    <CardDescription className="text-xs">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
      
      {/* User controls at bottom */}
      <div className="p-4 border-t flex items-center justify-between">
        <ThemeToggle />
        <AuthStatus />
      </div>
    </div>
  )
} 
