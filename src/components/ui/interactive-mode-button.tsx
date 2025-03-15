import React from "react"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface InteractiveModeButtonProps {
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function InteractiveModeButton({
  className,
  onClick,
  disabled = false
}: InteractiveModeButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "gap-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20",
        "transition-all duration-200",
        "group relative",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Zap className="h-4 w-4 group-hover:animate-pulse" />
      Interactive Mode
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-md bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
    </Button>
  )
} 