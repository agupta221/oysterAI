import { format } from "date-fns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import Image from "next/image"
import type { Resource } from "@/lib/perplexity"
import type { Syllabus } from "@/lib/openai"

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
}

interface CourseTileProps {
  course: Course
}

export function CourseTile({ course }: CourseTileProps) {
  if (course.isGenerating) {
    return (
      <Card className="relative overflow-hidden h-[300px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-primary font-medium">Generating Course...</p>
            <p className="text-sm text-muted-foreground">This may take a few minutes</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
      <CardHeader className="p-4">
        <h3 className="font-semibold text-lg text-primary group-hover:text-primary/80 line-clamp-1">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          Created {format(course.createdAt, "MMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      </CardContent>
    </Card>
  )
} 