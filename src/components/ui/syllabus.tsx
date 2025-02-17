import { ChevronRight, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Topic } from "@/lib/openai"
import type { Resource } from "@/lib/perplexity"

interface TopicWithResources extends Topic {
  resources?: Resource[];
}

interface SyllabusSection {
  title: string
  description?: string
  subsections?: {
    title: string
    description: string
    topics?: TopicWithResources[]
  }[]
}

interface SyllabusProps {
  sections: SyllabusSection[]
  onTopicClick?: (topic: TopicWithResources) => void
}

export function Syllabus({ sections, onTopicClick }: SyllabusProps) {
  const [expandedSections, setExpandedSections] = useState<number[]>([0])
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([])

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const toggleSubsection = (sectionIndex: number, subsectionIndex: number) => {
    const key = `${sectionIndex}-${subsectionIndex}`
    setExpandedSubsections(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.includes(sectionIndex)
          return (
            <div key={sectionIndex} className="border border-primary/10 rounded-lg overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className="w-full flex items-center gap-3 p-3 bg-primary/5 text-left group hover:bg-primary/10 transition-colors"
                  >
                    {isExpanded ? (
                      <Minus className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-primary group-hover:text-primary/80 transition-colors">
                      {section.title}
                    </h3>
                  </button>
                </TooltipTrigger>
                {section.description && (
                  <TooltipContent side="right" className="max-w-xs">
                    {section.description}
                  </TooltipContent>
                )}
              </Tooltip>

              {isExpanded && (
                <div className="px-4 py-2">
                  <div className="space-y-2">
                    {section.subsections?.map((subsection, subsectionIndex) => {
                      const isSubExpanded = expandedSubsections.includes(`${sectionIndex}-${subsectionIndex}`)
                      return (
                        <div key={subsectionIndex} className="pl-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleSubsection(sectionIndex, subsectionIndex)}
                                className="w-full flex items-center gap-2 py-2 text-left group"
                              >
                                {isSubExpanded ? (
                                  <Minus className="h-3.5 w-3.5 text-primary/40 flex-shrink-0" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5 text-primary/40 flex-shrink-0" />
                                )}
                                <h4 className="text-sm font-medium text-foreground/90 group-hover:text-primary/80 transition-colors">
                                  {subsection.title}
                                </h4>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              {subsection.description}
                            </TooltipContent>
                          </Tooltip>

                          {isSubExpanded && (
                            <div className="space-y-2 pl-6 mt-2">
                              {subsection.topics?.map((topic, topicIndex) => (
                                <Tooltip key={topicIndex}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => onTopicClick?.(topic)}
                                      className="w-full p-2 text-sm text-left bg-primary/5 hover:bg-primary/10 rounded-md text-foreground/80 hover:text-primary transition-colors"
                                    >
                                      {topic.title}
                                    </button>
                                  </TooltipTrigger>
                                  {topic.description && (
                                    <TooltipContent side="right" className="max-w-xs">
                                      {topic.description}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
} 