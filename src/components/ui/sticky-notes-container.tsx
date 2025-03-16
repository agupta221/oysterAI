import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StickyNote } from './sticky-note';
import { v4 as uuidv4 } from 'uuid';

interface StickyNoteData {
  id: string;
  content: string;
  position: { x: number; y: number };
  isSaved?: boolean;
  isExistingNote?: boolean; // Flag to indicate if this is an existing note being edited
}

export interface TopicNote {
  id: string;
  content: string;
  createdAt: Date;
  clientId?: string; // Optional client-generated ID
}

interface StickyNotesContainerProps {
  isVisible: boolean;
  currentTopicId?: string;
  onSaveNote?: (topicId: string, note: TopicNote) => void;
  onUpdateNote?: (topicId: string, noteId: string, content: string) => void;
}

export interface StickyNotesContainerRef {
  addNote: () => void;
  openExistingNote: (note: TopicNote) => void;
}

// Helper function to safely parse JSON
const safelyParseJSON = (json: string | null): StickyNoteData[] => {
  if (!json) return [];
  
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return [];
  }
};

export const StickyNotesContainer = forwardRef<StickyNotesContainerRef, StickyNotesContainerProps>(
  ({ isVisible, currentTopicId, onSaveNote, onUpdateNote }, ref) => {
    // Initialize with an empty array to prevent "notes.map is not a function" error
    const [notes, setNotes] = useState<StickyNoteData[]>([]);

    // Load notes from localStorage on mount
    useEffect(() => {
      const savedNotes = localStorage.getItem('stickyNotes');
      const parsedNotes = safelyParseJSON(savedNotes);
      setNotes(parsedNotes);
    }, []);

    // Save notes to localStorage when they change
    useEffect(() => {
      if (Array.isArray(notes) && notes.length > 0) {
        try {
          localStorage.setItem('stickyNotes', JSON.stringify(notes));
        } catch (error) {
          console.error('Failed to save notes to localStorage:', error);
        }
      } else if (Array.isArray(notes) && notes.length === 0) {
        // Clear localStorage if notes array is empty
        localStorage.removeItem('stickyNotes');
      }
    }, [notes]);

    const addNote = () => {
      try {
        // Calculate a position that's visible in the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Position in the center of the viewport with some randomness
        const x = viewportWidth / 2 - 128 + (Math.random() * 100 - 50);
        const y = viewportHeight / 2 - 100 + (Math.random() * 100 - 50);
        
        const newNote: StickyNoteData = {
          id: uuidv4(),
          content: '',
          position: { x, y },
          isSaved: false,
          isExistingNote: false
        };
        
        setNotes((prevNotes) => {
          // Ensure prevNotes is an array
          return Array.isArray(prevNotes) ? [...prevNotes, newNote] : [newNote];
        });
      } catch (error) {
        console.error('Error adding note:', error);
        // Fallback: directly set a new array with just this note
        setNotes([{
          id: uuidv4(),
          content: '',
          position: { x: window.innerWidth / 2 - 128, y: window.innerHeight / 2 - 100 },
          isSaved: false,
          isExistingNote: false
        }]);
      }
    };

    const openExistingNote = (note: TopicNote) => {
      try {
        // Calculate a position that's visible in the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Position in the center of the viewport
        const x = viewportWidth / 2 - 128;
        const y = viewportHeight / 2 - 100;
        
        const reopenedNote: StickyNoteData = {
          id: note.id,
          content: note.content,
          position: { x, y },
          isSaved: true,
          isExistingNote: true
        };
        
        // Check if the note is already open
        setNotes((prevNotes) => {
          if (!Array.isArray(prevNotes)) {
            return [reopenedNote];
          }
          
          // If the note is already open, don't add it again
          const noteExists = prevNotes.some(n => n.id === note.id);
          if (noteExists) {
            return prevNotes;
          }
          
          return [...prevNotes, reopenedNote];
        });
      } catch (error) {
        console.error('Error opening existing note:', error);
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addNote,
      openExistingNote
    }), []);

    const removeNote = (id: string) => {
      try {
        setNotes((prevNotes) => {
          // Ensure prevNotes is an array
          if (!Array.isArray(prevNotes)) {
            return [];
          }
          return prevNotes.filter((note) => note.id !== id);
        });
      } catch (error) {
        console.error('Error removing note:', error);
      }
    };

    const updateNoteContent = (id: string, content: string) => {
      try {
        setNotes((prevNotes) => {
          // Ensure prevNotes is an array
          if (!Array.isArray(prevNotes)) {
            return [];
          }
          return prevNotes.map((note) =>
            note.id === id ? { ...note, content } : note
          );
        });
      } catch (error) {
        console.error('Error updating note content:', error);
      }
    };

    const saveNoteToTopic = (id: string, content: string) => {
      if (!currentTopicId) {
        console.warn('Cannot save note: missing topicId');
        return;
      }

      try {
        // Find the note to check if it's an existing note
        const noteToSave = notes.find(note => note.id === id);
        
        if (noteToSave?.isExistingNote && onUpdateNote) {
          // If it's an existing note, update it instead of creating a new one
          onUpdateNote(currentTopicId, id, content);
          
          // Remove the note from the screen after updating
          setNotes((prevNotes) => {
            if (!Array.isArray(prevNotes)) {
              return [];
            }
            return prevNotes.filter(note => note.id !== id);
          });
          
          return; // Exit early after handling the update
        } 
        
        if (onSaveNote) {
          // Create a new topic note
          const topicNote: TopicNote = {
            id: id,
            content: content,
            createdAt: new Date(),
          };

          // Call the save handler
          onSaveNote(currentTopicId, topicNote);
        }

        // Remove the note from the screen after saving
        setNotes((prevNotes) => {
          if (!Array.isArray(prevNotes)) {
            return [];
          }
          return prevNotes.filter(note => note.id !== id);
        });
      } catch (error) {
        console.error('Error saving note to topic:', error);
      }
    };

    if (!isVisible) return null;

    // Ensure notes is an array before mapping
    const notesToRender = Array.isArray(notes) ? notes : [];

    return (
      <div className="fixed inset-0 pointer-events-none z-30">
        <AnimatePresence initial={false} mode="sync">
          {notesToRender.map((note) => (
            <div key={note.id} className="pointer-events-auto">
              <StickyNote
                id={note.id}
                initialContent={note.content}
                initialPosition={note.position}
                onClose={removeNote}
                onContentChange={updateNoteContent}
                onSave={saveNoteToTopic}
                isSaved={note.isSaved}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

// Add displayName for better debugging
StickyNotesContainer.displayName = 'StickyNotesContainer'; 