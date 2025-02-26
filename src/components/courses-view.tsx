import { CourseTile, type Course } from "@/components/ui/course-tile"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteCourse } from "@/lib/firebase/courseUtils"

interface CoursesViewProps {
  courses: Course[]
  onCourseClick: (course: Course) => void
  onCourseDelete?: (courseId: string) => void
}

export function CoursesView({ courses, onCourseClick, onCourseDelete }: CoursesViewProps) {
  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation(); // Prevent course click when clicking delete
    
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteCourse(courseId);
        onCourseDelete?.(courseId);
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

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
          <div key={course.id} className="group relative">
            <div onClick={() => onCourseClick(course)}>
              <CourseTile course={course} />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(e, course.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 