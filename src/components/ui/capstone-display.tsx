import type { CapstoneProject } from "@/components/ui/course-tile";
import { Card } from "@/components/ui/card";
import { GraduationCap, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CapstoneDisplayProps {
  capstone: CapstoneProject;
}

export function CapstoneDisplay({ capstone }: CapstoneDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">{capstone.title}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{capstone.description}</p>
      </div>

      <div className="space-y-6">
        {capstone.sections.map((section, index) => (
          <Card
            key={index}
            className={cn(
              "overflow-hidden transition-all duration-300",
              expandedSections.includes(index) ? "bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            <button
              className="w-full text-left p-6 flex items-center justify-between"
              onClick={() => toggleSection(index)}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold">{section.title}</h3>
              </div>
              {expandedSections.includes(index) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.includes(index) && (
              <div className="px-6 pb-6">
                <p className="text-muted-foreground mb-6">{section.description}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Instructions:</h4>
                    <ul className="space-y-2">
                      {section.instructions.map((instruction, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Expected Output:</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{section.expectedOutput}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 