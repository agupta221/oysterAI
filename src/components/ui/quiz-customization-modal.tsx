import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Topic } from "@/lib/openai"
import { cn } from "@/lib/utils"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface QuizCustomizationOptions {
  numQuestions: number
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard'
  format: 'multiple-choice' | 'free-text' | 'mixed'
  additionalRequirements: string
}

interface QuizCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  topic: Topic
  onGenerateQuiz: (options: QuizCustomizationOptions) => void
}

export function QuizCustomizationModal({ 
  isOpen, 
  onClose, 
  topic, 
  onGenerateQuiz 
}: QuizCustomizationModalProps) {
  const [customizationOptions, setCustomizationOptions] = useState<QuizCustomizationOptions>({
    numQuestions: 4,
    difficulty: 'mixed',
    format: 'multiple-choice',
    additionalRequirements: ''
  })

  if (!isOpen) return null

  const handleNumQuestionsChange = (value: number[]) => {
    setCustomizationOptions(prev => ({
      ...prev,
      numQuestions: value[0]
    }))
  }

  const handleDifficultyChange = (value: string) => {
    setCustomizationOptions(prev => ({
      ...prev,
      difficulty: value as 'mixed' | 'easy' | 'medium' | 'hard'
    }))
  }

  const handleFormatChange = (value: string) => {
    setCustomizationOptions(prev => ({
      ...prev,
      format: value as 'multiple-choice' | 'free-text' | 'mixed'
    }))
  }

  const handleAdditionalRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomizationOptions(prev => ({
      ...prev,
      additionalRequirements: e.target.value
    }))
  }

  const handleGenerateQuiz = () => {
    onGenerateQuiz(customizationOptions)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border">
        {/* Header */}
        <div className="bg-card/95 backdrop-blur-sm border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary">Customize Your Quiz</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {topic.title}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Customization Options */}
        <div className="p-6 space-y-6">
          {/* Number of Questions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="num-questions">Number of Questions</Label>
              <span className="text-sm font-medium">{customizationOptions.numQuestions}</span>
            </div>
            <Slider 
              id="num-questions"
              min={1} 
              max={10} 
              step={1} 
              value={[customizationOptions.numQuestions]} 
              onValueChange={handleNumQuestionsChange} 
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select 
              value={customizationOptions.difficulty} 
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger id="difficulty" className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quiz Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Quiz Format</Label>
            <Select 
              value={customizationOptions.format} 
              onValueChange={handleFormatChange}
            >
              <SelectTrigger id="format" className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="free-text">Free Text</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Requirements */}
          <div className="space-y-2">
            <Label htmlFor="additional-requirements">Additional Requirements (Optional)</Label>
            <Textarea 
              id="additional-requirements"
              placeholder="Add any specific requirements or topics you want to focus on..."
              value={customizationOptions.additionalRequirements}
              onChange={handleAdditionalRequirementsChange}
              className="resize-none h-24"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card/95 backdrop-blur-sm border-t p-6 flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateQuiz}
          >
            Generate Quiz
          </Button>
        </div>
      </div>
    </div>
  )
} 