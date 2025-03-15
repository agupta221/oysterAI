import React, { useState } from "react"
import { X, ChevronRight, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TimelineContent } from "@/lib/interactive-mode-generator"

interface TimelineModalProps {
  isOpen: boolean
  onClose: () => void
  content: TimelineContent
}

export function TimelineModal({ isOpen, onClose, content }: TimelineModalProps) {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null)

  if (!isOpen) return null

  // Calculate header height to ensure proper spacing
  const headerHeight = 120; // Approximate height based on padding and content

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header - no longer fixed position */}
      <div className="w-full border-b bg-background/80 backdrop-blur-md shadow-sm flex-shrink-0">
        {/* Close button - positioned absolutely in the top right */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-primary/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Title section with improved spacing */}
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">{content.timeline.title}</h2>
              <p className="text-muted-foreground max-w-2xl">{content.timeline.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - now using flex-grow to fill remaining space */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />

            {/* Events */}
            {content.timeline.events.map((event, index) => (
              <div 
                key={index}
                className={cn(
                  "relative flex items-start gap-8 mb-12",
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                )}
              >
                {/* Date bubble */}
                <div className="flex-1 flex items-center gap-4">
                  <div className={cn(
                    "text-sm font-medium text-primary/70 flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full",
                    index % 2 === 0 ? "justify-end ml-auto" : "justify-start mr-auto"
                  )}>
                    <Clock className="h-4 w-4" />
                    {event.date}
                  </div>
                </div>

                {/* Event node */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-primary bg-background top-1" />

                {/* Content */}
                <div className="flex-1">
                  <div 
                    className={cn(
                      "bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg p-4 cursor-pointer transition-all",
                      selectedEventIndex === index && "ring-2 ring-primary/40"
                    )}
                    onClick={() => setSelectedEventIndex(index === selectedEventIndex ? null : index)}
                  >
                    <h3 className="font-medium text-primary mb-2 flex items-center justify-between">
                      {event.title}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        selectedEventIndex === index && "rotate-90"
                      )} />
                    </h3>
                    
                    {selectedEventIndex === index && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                        
                        {event.interactionPrompt && (
                          <div className="text-sm text-primary italic">
                            💡 {event.interactionPrompt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conclusion */}
          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-medium text-primary mb-2">Key Takeaway</h3>
            <p className="text-muted-foreground">{content.timeline.conclusion}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 