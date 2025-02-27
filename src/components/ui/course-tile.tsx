import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import Image from "next/image"
import type { VideoResource } from "@/lib/serpapi"
import type { Syllabus } from "@/lib/openai"

export interface CapstoneSection {
  title: string;
  description: string;
  instructions: string[];
  expectedOutput: string;
}

export interface CapstoneProject {
  title: string;
  description: string;
  sections: CapstoneSection[];
}

export interface Course {
  id: string
  title: string
  description: string
  syllabus: Syllabus
  createdAt: Date
  imageUrl: string
  isGenerating?: boolean
  summary?: string
  audioPath?: string
  capstone?: CapstoneProject
}

interface CourseTileProps {
  course: Course
}

export function CourseTile({ course }: CourseTileProps) {
  if (course.isGenerating) {
    return (
      <Card className="relative overflow-hidden h-[180px] bg-gradient-to-br from-card to-muted/50">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/80 ring-6 ring-primary/20 animate-pulse" />
          </div>
          <p className="text-primary font-medium text-sm">Generating Course...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group cursor-pointer overflow-hidden relative h-[180px] transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/50 opacity-50 group-hover:opacity-70 transition-opacity" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      
      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <p className="text-sm text-muted-foreground">
            {format(course.createdAt, "MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </Card>
  )
} 