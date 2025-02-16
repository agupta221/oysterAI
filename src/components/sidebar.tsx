import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Clock, GraduationCap, Layout, Settings, Target } from "lucide-react"

const sidebarSections = [
  {
    title: "Course Structure",
    description: "Define your learning path",
    icon: Layout,
  },
  {
    title: "Learning Goals",
    description: "Set your objectives",
    icon: Target,
  },
  {
    title: "Time Commitment",
    description: "Plan your schedule",
    icon: Clock,
  },
  {
    title: "Topics",
    description: "Choose your subjects",
    icon: Book,
  },
  {
    title: "Difficulty Level",
    description: "Set your challenge",
    icon: GraduationCap,
  },
  {
    title: "Preferences",
    description: "Customize your experience",
    icon: Settings,
  },
]

export default function Sidebar() {
  return (
    <div className="h-full overflow-y-auto p-4 bg-card">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          {/* Simple pearl/oyster icon using CSS */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-primary/80 ring-4 ring-primary/20" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Oyster</h1>
        </div>
        <p className="text-sm text-muted-foreground">AI-Powered Course Builder</p>
      </div>
      <div className="space-y-2">
        {sidebarSections.map((section) => (
          <Card
            key={section.title}
            className="cursor-pointer border-transparent transition-all duration-200 hover:border-primary/20 hover:bg-primary/5"
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
  )
} 
