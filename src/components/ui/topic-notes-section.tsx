import React, { useState } from 'react';
import { StickyNote, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { TopicNote } from './sticky-notes-container';

interface TopicNotesProps {
  topicId: string;
  notes: TopicNote[];
  onDeleteNote: (topicId: string, noteId: string) => void;
  onOpenNote?: (note: TopicNote) => void;
}

export function TopicNotesSection({ 
  topicId, 
  notes, 
  onDeleteNote,
  onOpenNote 
}: TopicNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!notes || notes.length === 0) {
    return null;
  }

  // Function to get a preview of the note content (first few words)
  const getNotePreview = (content: string, maxLength: number = 20) => {
    if (content.length <= maxLength) return content;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = content.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace === -1) return content.substring(0, maxLength) + '...';
    
    return content.substring(0, lastSpace) + '...';
  };

  const handleNoteClick = (note: TopicNote, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from affecting parent elements
    if (onOpenNote) {
      onOpenNote(note);
    }
  };

  return (
    <div className="mb-4 border border-primary/10 rounded-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary/60" />
          <span className="text-sm font-medium">
            Notes ({notes.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-primary/60" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary/60" />
        )}
      </button>

      {isExpanded && (
        <div className="p-2 flex flex-wrap gap-2">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="inline-flex items-center px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200 text-sm relative group cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={(e) => handleNoteClick(note, e)}
            >
              <span className="mr-6">{getNotePreview(note.content)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the note
                  onDeleteNote(topicId, note.id);
                }}
                className="absolute right-2 h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-opacity"
                title="Delete note"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 