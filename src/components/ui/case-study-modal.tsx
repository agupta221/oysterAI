import React, { useState } from "react"
import { X, Users, Lightbulb, BookOpen, Award, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, Building, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CaseStudyContent } from "@/lib/interactive-mode-generator"

interface CaseStudyModalProps {
  isOpen: boolean
  onClose: () => void
  content: CaseStudyContent
}

export function CaseStudyModal({ isOpen, onClose, content }: CaseStudyModalProps) {
  const [currentSection, setCurrentSection] = useState<string>("introduction")
  const [showReflection, setShowReflection] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  // Validate content structure
  if (!content?.caseStudy) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-4">Error Loading Case Study</h2>
          <p className="text-muted-foreground mb-6">The case study content is missing or has an invalid format.</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    )
  }

  const sections = [
    { id: "introduction", label: "Introduction", icon: <BookOpen className="h-5 w-5" /> },
    { id: "background", label: "Background", icon: <Building className="h-5 w-5" /> },
    { id: "stakeholders", label: "Stakeholders", icon: <Users className="h-5 w-5" /> },
    { id: "challenge", label: "Challenge", icon: <HelpCircle className="h-5 w-5" /> },
    { id: "approach", label: "Approach", icon: <ArrowRight className="h-5 w-5" /> },
    { id: "outcomes", label: "Outcomes", icon: <CheckCircle className="h-5 w-5" /> },
    { id: "takeaways", label: "Key Takeaways", icon: <Lightbulb className="h-5 w-5" /> }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
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
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">{content.caseStudy.title}</h2>
              <p className="text-muted-foreground max-w-2xl">
                {content.caseStudy.introduction}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 flex gap-8">
          {/* Navigation sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="sticky top-8 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors",
                    currentSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-primary/5 text-muted-foreground"
                  )}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1">
            {/* Introduction */}
            {currentSection === "introduction" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Introduction</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">{content.caseStudy.introduction}</p>
                </div>
              </div>
            )}

            {/* Background */}
            {currentSection === "background" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Background</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line">{content.caseStudy.background}</p>
                </div>
              </div>
            )}

            {/* Stakeholders */}
            {currentSection === "stakeholders" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Stakeholders</h3>
                {Array.isArray(content.caseStudy.stakeholders) && content.caseStudy.stakeholders.length > 0 ? (
                  <div className="space-y-4">
                    {content.caseStudy.stakeholders.map((stakeholder, index) => (
                      <div key={index} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-medium text-primary mb-2">{stakeholder.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground font-medium">Role:</span>
                            <p>{stakeholder.role}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Interests:</span>
                            <p>{stakeholder.interests}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-muted-foreground">No stakeholder information available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Challenge */}
            {currentSection === "challenge" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">The Challenge</h3>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{content.caseStudy.challenge}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approach */}
            {currentSection === "approach" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Approach</h3>
                <div className="prose prose-sm max-w-none">
                  {typeof content.caseStudy.approach === 'string' ? (
                    <p className="text-muted-foreground whitespace-pre-line">{content.caseStudy.approach}</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(content.caseStudy.approach).map(([key, value]) => (
                        <div key={key} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="font-medium text-primary mb-2">{key.replace(/^step/i, 'Step ')}</h4>
                          <p className="text-muted-foreground">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outcomes */}
            {currentSection === "outcomes" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Outcomes</h3>
                
                {content.caseStudy.outcomes && (
                  <div className="space-y-6">
                    {/* Positive outcomes */}
                    <div>
                      <h4 className="text-lg font-medium text-green-600 flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5" />
                        Positive Outcomes
                      </h4>
                      {Array.isArray(content.caseStudy.outcomes.positive) && content.caseStudy.outcomes.positive.length > 0 ? (
                        <ul className="space-y-2">
                          {content.caseStudy.outcomes.positive.map((outcome, index) => (
                            <li key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">No positive outcomes listed.</p>
                      )}
                    </div>
                    
                    {/* Negative outcomes */}
                    <div>
                      <h4 className="text-lg font-medium text-red-600 flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5" />
                        Challenges & Negative Outcomes
                      </h4>
                      {Array.isArray(content.caseStudy.outcomes.negative) && content.caseStudy.outcomes.negative.length > 0 ? (
                        <ul className="space-y-2">
                          {content.caseStudy.outcomes.negative.map((outcome, index) => (
                            <li key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">No challenges or negative outcomes listed.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {!content.caseStudy.outcomes && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-muted-foreground">No outcome information available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Key Takeaways */}
            {currentSection === "takeaways" && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-semibold text-primary mb-4">Key Takeaways</h3>
                
                {Array.isArray(content.caseStudy.keyTakeaways) && content.caseStudy.keyTakeaways.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {content.caseStudy.keyTakeaways.map((takeaway, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border-l-4 border-primary/40 bg-primary/5">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>{takeaway}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
                    <p className="text-muted-foreground">No key takeaways available.</p>
                  </div>
                )}
                
                {/* Reflection prompt */}
                {content.caseStudy.reflectionPrompt ? (
                  <div className="mt-8">
                    <Button 
                      onClick={() => setShowReflection(!showReflection)}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>Reflection Question</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        showReflection && "rotate-90"
                      )} />
                    </Button>
                    
                    {showReflection && (
                      <div className="mt-4 p-5 bg-primary/5 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
                        <p className="text-primary font-medium mb-2">Consider this question:</p>
                        <p className="text-muted-foreground italic">{content.caseStudy.reflectionPrompt}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 