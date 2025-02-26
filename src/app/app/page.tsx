import CourseLayout from "@/components/course-layout"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata = {
  title: 'App | Oyster AI',
  description: 'Create personalized learning experiences with AI',
}

export default function AppPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen">
        <CourseLayout />
      </div>
    </ProtectedRoute>
  )
} 