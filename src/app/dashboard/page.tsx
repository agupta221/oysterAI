import CourseLayout from "@/components/course-layout"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata = {
  title: 'Dashboard | Oyster AI',
  description: 'Create personalized learning experiences with AI',
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen">
        <CourseLayout />
      </div>
    </ProtectedRoute>
  )
} 