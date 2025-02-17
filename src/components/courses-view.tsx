import { CourseTile, type Course } from "@/components/ui/course-tile"

interface CoursesViewProps {
  courses: Course[]
  onCourseClick: (course: Course) => void
}

export function CoursesView({ courses, onCourseClick }: CoursesViewProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="mb-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">
          No courses yet
        </h2>
        <p className="text-muted-foreground">
          Generate your first course to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} onClick={() => onCourseClick(course)}>
            <CourseTile course={course} />
          </div>
        ))}
      </div>
    </div>
  )
} 