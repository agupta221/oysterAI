import React, { useState } from "react"
import { X, CheckCircle, AlertCircle, ArrowRight, Lightbulb, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ScenarioContent } from "@/lib/interactive-mode-generator"

interface ScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  content: ScenarioContent
}

export function ScenarioModal({ isOpen, onClose, content }: ScenarioModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  if (!isOpen) return null

  const currentStep = content.scenario.steps[currentStepIndex]
  const isLastStep = currentStepIndex === content.scenario.steps.length - 1
  const hasSelectedOption = selectedOptions[currentStepIndex] !== undefined

  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions]
    newSelectedOptions[currentStepIndex] = optionIndex
    setSelectedOptions(newSelectedOptions)
    setShowExplanation(true)
  }

  const handleNextStep = () => {
    if (isLastStep) {
      setIsCompleted(true)
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
      setShowExplanation(false)
    }
  }

  const handleRestart = () => {
    setCurrentStepIndex(0)
    setSelectedOptions([])
    setShowExplanation(false)
    setIsCompleted(false)
  }

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
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">Interactive Scenario</h2>
              <p className="text-muted-foreground max-w-2xl">
                Work through this scenario to apply your knowledge in a practical context.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {!isCompleted ? (
            <>
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Step {currentStepIndex + 1} of {content.scenario.steps.length}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(((currentStepIndex) / content.scenario.steps.length) * 100)}% Complete
                  </span>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${((currentStepIndex) / content.scenario.steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Context (only shown on first step) */}
              {currentStepIndex === 0 && (
                <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Context
                  </h3>
                  <p className="text-muted-foreground">{content.scenario.context}</p>
                </div>
              )}

              {/* Current situation */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-primary mb-3">Situation</h3>
                <p className="text-muted-foreground">{currentStep.situation}</p>
              </div>

              {/* Options */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-primary mb-4">
                  {currentStep.question || "What would you do?"}
                </h3>
                <div className="space-y-3">
                  {currentStep.options.map((option, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all",
                        selectedOptions[currentStepIndex] === index
                          ? index === currentStep.correctOption
                            ? "bg-green-50 border-green-200 ring-2 ring-green-200"
                            : "bg-red-50 border-red-200 ring-2 ring-red-200"
                          : "bg-card hover:bg-primary/5 border-border",
                        showExplanation && index === currentStep.correctOption && "ring-2 ring-green-300"
                      )}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showExplanation}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {selectedOptions[currentStepIndex] === index ? (
                            index === currentStep.correctOption ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-primary/30" />
                          )}
                        </div>
                        <span className={cn(
                          selectedOptions[currentStepIndex] === index
                            ? index === currentStep.correctOption
                              ? "text-green-700"
                              : "text-red-700"
                            : "text-foreground"
                        )}>
                          {option}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Explanation
                  </h3>
                  <p className="text-muted-foreground">{currentStep.explanation}</p>
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleNextStep}
                  disabled={!hasSelectedOption}
                  className="gap-2"
                >
                  {isLastStep ? "Complete Scenario" : "Next Step"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            /* Completion screen */
            <div className="text-center py-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-4">Scenario Completed!</h2>
              <div className="max-w-xl mx-auto mb-8 p-6 bg-primary/5 border border-primary/20 rounded-lg text-left">
                <h3 className="font-medium text-primary mb-2">Key Takeaway</h3>
                <p className="text-muted-foreground">{content.scenario.conclusion}</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleRestart}>
                  Restart Scenario
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 