"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/sidebar"
import MainContent from "@/components/main-content"

export default function CourseLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
      {/* Sidebar with toggle button container */}
      <div className="relative flex-shrink-0">
        {/* Sidebar */}
        <aside
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            sidebarOpen ? "w-80" : "w-0"
          )}
        >
          <div className="h-full w-80 border-r bg-background">
            <Sidebar />
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
        <MainContent />
      </main>
    </div>
  )
} 
