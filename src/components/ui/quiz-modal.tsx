import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Topic } from "@/lib/openai"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface Question {
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  topic: Topic
  questions: Question[]
  timeLimit: number | null
}

export function QuizModal({ isOpen, onClose, topic, questions, timeLimit }: QuizModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1))
  const [freeTextAnswers, setFreeTextAnswers] = useState<string[]>(new Array(questions.length).fill(''))
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[questionIndex] = optionIndex
    setSelectedAnswers(newAnswers)
  }

  const handleFreeTextChange = (questionIndex: number, text: string) => {
    const newAnswers = [...freeTextAnswers]
    newAnswers[questionIndex] = text
    setFreeTextAnswers(newAnswers)
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const handleClose = () => {
    setIsSubmitted(false)
    setSelectedAnswers(new Array(questions.length).fill(-1))
    setFreeTextAnswers(new Array(questions.length).fill(''))
    onClose()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  const getOptionStyle = (questionIndex: number, optionIndex: number) => {
    const isSelected = selectedAnswers[questionIndex] === optionIndex
    const isCorrect = isSubmitted && optionIndex === questions[questionIndex].correctAnswer
    const isWrong = isSubmitted && isSelected && !isCorrect

    return cn(
      "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
      "hover:border-primary/40 hover:bg-primary/5",
      "flex items-center gap-4",
      {
        "border-primary/30 bg-primary/10": isSelected && !isSubmitted,
        "border-green-500 bg-green-500/10 text-green-700": isCorrect,
        "border-red-500 bg-red-500/10 text-red-700": isWrong,
        "border-muted": !isSelected && !isSubmitted,
        "opacity-50": isSubmitted && !isSelected && !isCorrect,
      }
    )
  }

  // Check if a question is a free text question
  const isFreeTextQuestion = (question: Question) => {
    return question.options.length === 0 && question.correctAnswer === -1
  }

  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    return questions.every((question, index) => {
      if (isFreeTextQuestion(question)) {
        return freeTextAnswers[index].trim() !== ''
      } else {
        return selectedAnswers[index] !== -1
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary">{topic.title} Quiz</h2>
            <p className="text-sm text-muted-foreground mt-1">Test your knowledge with these questions</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-8">
          {questions.map((question, questionIndex) => (
            <div 
              key={questionIndex} 
              className="rounded-xl border bg-card/50 overflow-hidden"
            >
              {/* Question Header */}
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                    {questionIndex + 1}
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border",
                    getDifficultyColor(question.difficulty)
                  )}>
                    {question.difficulty}
                  </div>
                  {isFreeTextQuestion(question) && (
                    <div className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Free Text
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  {question.text}
                </h3>
              </div>

              {/* Options or Free Text Input */}
              <div className="p-6 space-y-3">
                {isFreeTextQuestion(question) ? (
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Type your answer here..."
                      value={freeTextAnswers[questionIndex]}
                      onChange={(e) => !isSubmitted && handleFreeTextChange(questionIndex, e.target.value)}
                      disabled={isSubmitted}
                      className={cn(
                        "min-h-[100px] resize-none",
                        isSubmitted && "opacity-70"
                      )}
                    />
                  </div>
                ) : (
                  question.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => !isSubmitted && handleAnswerSelect(questionIndex, optionIndex)}
                      disabled={isSubmitted}
                      className={getOptionStyle(questionIndex, optionIndex)}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        {
                          "border-primary bg-primary/10": selectedAnswers[questionIndex] === optionIndex && !isSubmitted,
                          "border-green-500 bg-green-500/10": isSubmitted && optionIndex === question.correctAnswer,
                          "border-red-500 bg-red-500/10": isSubmitted && selectedAnswers[questionIndex] === optionIndex && optionIndex !== question.correctAnswer,
                          "border-muted": selectedAnswers[questionIndex] !== optionIndex && !isSubmitted,
                        }
                      )}>
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="flex-1">{option}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Explanation or Model Answer */}
              {isSubmitted && question.explanation && (
                <div className="px-6 pb-6">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="font-medium text-primary mb-2">
                      {isFreeTextQuestion(question) ? "Model Answer:" : "Explanation:"}
                    </div>
                    <p className="text-muted-foreground text-sm">{question.explanation}</p>
                    
                    {isFreeTextQuestion(question) && freeTextAnswers[questionIndex] && (
                      <div className="mt-4 pt-4 border-t border-muted">
                        <div className="font-medium text-primary mb-2">Your Answer:</div>
                        <p className="text-muted-foreground text-sm">{freeTextAnswers[questionIndex]}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t p-6 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {!isSubmitted ? (
              `${questions.filter((q, i) => 
                isFreeTextQuestion(q) 
                  ? freeTextAnswers[i].trim() !== '' 
                  : selectedAnswers[i] !== -1
              ).length} of ${questions.length} questions answered`
            ) : (
              `Quiz completed! Review your answers above`
            )}
          </div>
          {!isSubmitted ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!allQuestionsAnswered()}
              className="min-w-[120px]"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button 
              onClick={handleClose}
              variant="outline" 
              className="min-w-[120px]"
            >
              Close Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 