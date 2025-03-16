import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
  id: string;
  initialContent?: string;
  initialPosition?: { x: number; y: number };
  onClose: (id: string) => void;
  onContentChange?: (id: string, content: string) => void;
  onSave?: (id: string, content: string) => void;
  isSaved?: boolean;
}

export function StickyNote({
  id,
  initialContent = '',
  initialPosition = { x: 100, y: 100 },
  onClose,
  onContentChange,
  onSave,
  isSaved = false,
}: StickyNoteProps) {
  const [content, setContent] = useState(initialContent);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Random pastel color for the note
  const [bgColor] = useState(() => {
    const colors = [
      'bg-yellow-100',
      'bg-blue-100',
      'bg-green-100',
      'bg-pink-100',
      'bg-purple-100',
      'bg-orange-100',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    // Focus the textarea when the note is created
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (onContentChange) {
      onContentChange(id, content);
    }
  }, [content, id, onContentChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleSave = () => {
    if (onSave && content.trim()) {
      onSave(id, content);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <motion.div
      ref={noteRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 50 : 40,
      }}
      className={cn(
        'w-64 rounded-md shadow-lg overflow-hidden',
        bgColor,
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between bg-black/10"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <GripVertical className="h-4 w-4 text-black/40 mr-2" />
          <span className="text-xs font-medium text-black/60">
            {isSaved ? "Edit Note" : "Sticky Note"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-black/10 text-black/40 hover:text-green-600 transition-colors"
            title={isSaved ? "Update note" : "Save to topic notes"}
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => onClose(id)}
            className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-black/10 text-black/40 hover:text-black/60 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your note here..."
        className="w-full p-3 bg-transparent border-none focus:outline-none resize-none h-32"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
} 