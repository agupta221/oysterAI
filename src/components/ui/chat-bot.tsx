import { useState, useRef, useEffect } from "react";
import { Message } from "ai";
import { useChat } from "ai/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Bot, X, Send, Loader2, GripVertical } from "lucide-react";
import type { Topic } from "@/lib/openai";
import Markdown from "react-markdown";

interface ChatBotProps {
  currentTopic: Topic;
}

export function ChatBot({ currentTopic }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(384); // Default width of 384px (w-96)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      currentTopic,
    },
  });

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, 320), 800)); // Min 320px, max 800px
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <div className="relative w-10 h-10">
            {/* Oyster shell design */}
            <div className="absolute inset-0 bg-primary-foreground/20 rounded-full transform -rotate-45">
              <div className="absolute inset-1 bg-gradient-to-br from-primary-foreground to-primary-foreground/80 rounded-full">
                {/* Pearl */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg" />
              </div>
            </div>
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          style={{ width: `${width}px` }}
          className="absolute bottom-16 right-0 h-[600px] bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-200"
        >
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/10 group flex items-center"
          >
            <div className="absolute left-0 w-6 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Header */}
          <div className="p-4 border-b bg-primary/5">
            <h3 className="font-semibold">Oyster the Oracle</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about {currentTopic.title}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 text-sm",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <Markdown
                    components={{
                      pre: ({ children }) => (
                        <pre className="bg-primary/10 p-2 rounded-lg overflow-auto">
                          {children}
                        </pre>
                      ),
                      code: ({ children }) => (
                        <code className="bg-primary/10 rounded px-1">{children}</code>
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t flex gap-2 items-end"
          >
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
} 