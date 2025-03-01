'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, Trash2, Link as LinkIcon, StickyNote, Plus, ChevronLeft, ChevronRight, BookOpen, Loader2, Film, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { Section, Subsection, Topic } from '@/lib/openai';
import type { VideoResource } from '@/lib/serpapi';

// Custom DialogContent without the built-in close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = DialogPrimitive.Content.displayName;

interface CourseCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
}

interface CanvasNote {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
}

interface TopicNode {
  id: string;
  x: number;
  y: number;
  topicId: string;
  topicName: string;
  topicDescription?: string;
  sectionName?: string;
  subsectionName?: string;
}

interface VideoNode {
  id: string;
  x: number;
  y: number;
  title: string;
  url: string;
  description: string;
  parentTopicId: string; // Reference to the topic node it's connected to
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

interface CourseSection {
  id: string;
  name: string;
  subsections: Array<{
    id: string;
    name: string;
  }>;
}

const COLORS = [
  'bg-yellow-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-pink-100',
  'bg-purple-100',
  'bg-orange-100',
];

interface SelectedSubsection {
  id: string;
  name: string;
  topics: Topic[];
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const CourseCanvas: React.FC<CourseCanvasProps> = ({ isOpen, onClose, courseId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasNotes, setCanvasNotes] = useState<CanvasNote[]>([]);
  const [topicNodes, setTopicNodes] = useState<TopicNode[]>([]);
  const [videoNodes, setVideoNodes] = useState<VideoNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [noteDragStart, setNoteDragStart] = useState({ x: 0, y: 0 });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isTopicSelectorOpen, setIsTopicSelectorOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [subsections, setSubsections] = useState<Array<{ 
    id: string; 
    name: string; 
    description?: string;
    topics?: Topic[];
  }>>([]);
  const [courseSections, setCourseSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<SelectedSubsection | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedTopicForVideo, setSelectedTopicForVideo] = useState<TopicNode | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoResources, setVideoResources] = useState<VideoResource[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [activeVideoNode, setActiveVideoNode] = useState<VideoNode | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

  // Load course sections and subsections
  useEffect(() => {
    if (courseId && isOpen) {
      fetchCourseSections();
    }
  }, [courseId, isOpen]);

  const fetchCourseSections = async () => {
    setIsLoadingSections(true);
    setError(null);
    
    try {
      // Get the course document from Firestore
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }
      
      const courseData = courseDoc.data();
      
      // Check if the course has a syllabus
      if (!courseData.syllabus || !courseData.syllabus.sections) {
        throw new Error('Course syllabus not found');
      }
      
      // Set the course sections from the syllabus
      setCourseSections(courseData.syllabus.sections);
      
    } catch (error) {
      console.error('Error fetching course sections:', error);
      setError('Failed to load course content');
      
      // Fallback to sample data if API fails
      setCourseSections([
        { 
          title: 'Getting Started with React',
          description: 'Introduction to React fundamentals',
          subsections: [
            { 
              title: 'Introduction to React', 
              description: 'Learn the basics of React',
              topics: [
                { 
                  title: 'What is React?', 
                  description: 'An overview of React and its benefits',
                  searchQuery: 'what is react js'
                }
              ]
            },
            { 
              title: 'Setting Up Your Environment', 
              description: 'Configure your development environment',
              topics: [
                { 
                  title: 'Installing Node.js and npm', 
                  description: 'Set up the required tools for React development',
                  searchQuery: 'install nodejs npm'
                }
              ]
            }
          ]
        },
        { 
          title: 'React Fundamentals',
          description: 'Core concepts in React',
          subsections: [
            { 
              title: 'JSX Syntax', 
              description: 'Learn the JSX syntax used in React',
              topics: [
                { 
                  title: 'JSX Basics', 
                  description: 'Understanding JSX syntax and rules',
                  searchQuery: 'react jsx basics'
                }
              ]
            },
            { 
              title: 'Props and State', 
              description: 'Understanding data flow in React',
              topics: [
                { 
                  title: 'Working with Props', 
                  description: 'Passing data between components',
                  searchQuery: 'react props tutorial'
                }
              ]
            }
          ]
        }
      ]);
    } finally {
      setIsLoadingSections(false);
    }
  };

  // Load saved canvas state from localStorage
  useEffect(() => {
    if (courseId) {
      const savedCanvas = localStorage.getItem(`course-canvas-${courseId}`);
      if (savedCanvas) {
        try {
          const parsed = JSON.parse(savedCanvas);
          setPosition(parsed.position || { x: 0, y: 0 });
          setZoom(parsed.zoom || 1);
          setCanvasNotes(parsed.notes || []);
          setTopicNodes(parsed.topicNodes || []);
          setVideoNodes(parsed.videoNodes || []);
          setConnections(parsed.connections || []);
        } catch (e) {
          console.error('Failed to parse saved canvas', e);
        }
      }
    }
  }, [courseId]);

  // Save canvas state to localStorage
  useEffect(() => {
    if (courseId) {
      localStorage.setItem(`course-canvas-${courseId}`, JSON.stringify({
        position,
        zoom,
        notes: canvasNotes,
        topicNodes,
        videoNodes,
        connections
      }));
    }
  }, [position, zoom, canvasNotes, topicNodes, videoNodes, connections, courseId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggedNoteId && !draggedTopicId && !isConnecting) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx,
        y: position.y + dy
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (draggedNoteId) {
      const dx = (e.clientX - noteDragStart.x) / zoom;
      const dy = (e.clientY - noteDragStart.y) / zoom;
      
      setCanvasNotes(notes => notes.map(note => 
        note.id === draggedNoteId 
          ? { ...note, x: note.x + dx, y: note.y + dy } 
          : note
      ));
      
      setNoteDragStart({ x: e.clientX, y: e.clientY });
    } else if (draggedTopicId) {
      const dx = (e.clientX - noteDragStart.x) / zoom;
      const dy = (e.clientY - noteDragStart.y) / zoom;
      
      // Check if it's a topic node
      const isTopicNode = topicNodes.some(node => node.id === draggedTopicId);
      
      if (isTopicNode) {
        setTopicNodes(nodes => nodes.map(node => 
          node.id === draggedTopicId 
            ? { ...node, x: node.x + dx, y: node.y + dy } 
            : node
        ));
      } else {
        // It must be a video node
        setVideoNodes(nodes => nodes.map(node => 
          node.id === draggedTopicId 
            ? { ...node, x: node.x + dx, y: node.y + dy } 
            : node
        ));
      }
      
      setNoteDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNoteId(null);
    setDraggedTopicId(null);
    
    if (isConnecting && connectingFrom) {
      setIsConnecting(false);
      setConnectingFrom(null);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (canvasRef.current && !isConnecting) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - position.x) / zoom;
      const y = (e.clientY - rect.top - position.y) / zoom;
      
      // Add a new note at the clicked position
      const newNote = {
        id: `note-${Date.now()}`,
        x,
        y,
        content: 'Double click to edit',
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      
      setCanvasNotes([...canvasNotes, newNote]);
    }
  };

  const handleNoteDoubleClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    const note = canvasNotes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingContent(note.content);
    }
  };

  const handleNoteMouseDown = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    
    if (isConnecting && connectingFrom && connectingFrom !== noteId) {
      // Create a connection
      const newConnection = {
        id: `connection-${Date.now()}`,
        fromId: connectingFrom,
        toId: noteId
      };
      
      setConnections([...connections, newConnection]);
      setIsConnecting(false);
      setConnectingFrom(null);
    } else {
      // Start dragging the note
      setDraggedNoteId(noteId);
      setNoteDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const startConnecting = (noteId: string) => {
    setIsConnecting(true);
    setConnectingFrom(noteId);
  };

  const deleteNote = (noteId: string) => {
    setCanvasNotes(canvasNotes.filter(note => note.id !== noteId));
    setConnections(connections.filter(conn => 
      conn.fromId !== noteId && conn.toId !== noteId
    ));
  };

  const handleAddStickyNote = () => {
    // Calculate center of the visible canvas
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = (rect.width / 2 - position.x) / zoom;
      const centerY = (rect.height / 2 - position.y) / zoom;
      
      // Create a temporary note ID
      const tempNoteId = `temp-note-${Date.now()}`;
      
      // Set editing state with empty content
      setEditingNoteId(tempNoteId);
      setEditingContent('');
      
      // Store the position for later use if saved
      setIsAddingNote(true);
      
      // Store position information for when the note is saved
      localStorage.setItem('temp-note-position', JSON.stringify({
        id: tempNoteId,
        x: centerX,
        y: centerY
      }));
    }
  };

  const saveNoteContent = () => {
    if (editingNoteId) {
      // Only add/update the note if there's actual content
      if (editingContent.trim()) {
        if (isAddingNote) {
          // This is a new note being added
          const positionData = localStorage.getItem('temp-note-position');
          if (positionData) {
            const { x, y } = JSON.parse(positionData);
            
            // Add the new note with the entered content
            const newNote = {
              id: editingNoteId.replace('temp-', ''),
              x,
              y,
              content: editingContent.trim(),
              color: 'bg-blue-100'
            };
            
            setCanvasNotes([...canvasNotes, newNote]);
            localStorage.removeItem('temp-note-position');
          }
        } else {
          // This is an existing note being edited
          setCanvasNotes(canvasNotes.map(note => 
            note.id === editingNoteId 
              ? { ...note, content: editingContent.trim() } 
              : note
          ));
        }
      }
      
      // Reset editing state
      setEditingNoteId(null);
      setIsAddingNote(false);
    }
  };

  const cancelNoteEdit = () => {
    // Clear editing state without saving
    setEditingNoteId(null);
    setEditingContent('');
    setIsAddingNote(false);
    localStorage.removeItem('temp-note-position');
  };

  const handleTopicNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (isConnecting && connectingFrom && connectingFrom !== nodeId) {
      // Create a connection
      const newConnection = {
        id: `connection-${Date.now()}`,
        fromId: connectingFrom,
        toId: nodeId
      };
      
      setConnections([...connections, newConnection]);
      setIsConnecting(false);
      setConnectingFrom(null);
    } else {
      // Start dragging the topic node
      setDraggedTopicId(nodeId);
      setNoteDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const startConnectingFromTopic = (nodeId: string) => {
    setIsConnecting(true);
    setConnectingFrom(nodeId);
  };

  const deleteTopicNode = (nodeId: string) => {
    setTopicNodes(topicNodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => 
      conn.fromId !== nodeId && conn.toId !== nodeId
    ));
  };

  const handleAddTopicNode = () => {
    // Open the section selector
    setIsTopicSelectorOpen(true);
    setSelectedSection(null);
    setSubsections([]);
  };

  const handleSectionSelect = (sectionIndex: number) => {
    setSelectedSection(sectionIndex.toString());
    const section = courseSections[sectionIndex];
    if (section && section.subsections) {
      setSubsections(section.subsections.map((subsection, index) => ({
        id: `${sectionIndex}-${index}`,
        name: subsection.title,
        description: subsection.description,
        topics: subsection.topics
      })));
    }
  };

  const handleSubsectionSelect = (subsectionId: string, subsectionName: string, topics: Topic[]) => {
    // Store the selected subsection and its topics for the topic selector
    setSelectedSubsection({
      id: subsectionId,
      name: subsectionName,
      topics: topics || []
    });
    
    // Open the topic selector modal
    setIsTopicModalOpen(true);
  };

  const handleTopicSelect = (topic: Topic) => {
    // Calculate center of the visible canvas
    if (canvasRef.current && selectedSubsection) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = (rect.width / 2 - position.x) / zoom;
      const centerY = (rect.height / 2 - position.y) / zoom;
      
      // Find the section name
      const sectionIndex = parseInt(selectedSection || '0', 10);
      const sectionName = courseSections[sectionIndex]?.title || '';
      
      // Add a new topic node at the center position
      const newTopicNode = {
        id: `topic-node-${Date.now()}`,
        x: centerX,
        y: centerY,
        topicId: `${selectedSubsection.id}-${topic.title}`,
        topicName: topic.title,
        topicDescription: topic.description,
        sectionName: sectionName,
        subsectionName: selectedSubsection.name
      };
      
      setTopicNodes([...topicNodes, newTopicNode]);
      
      // Close all selectors and reset state
      setIsTopicModalOpen(false);
      setIsTopicSelectorOpen(false);
      setSelectedSubsection(null);
      setSelectedSection(null);
      setSubsections([]);
    }
  };

  // Fetch video resources for a topic
  const fetchVideoResources = async (topicId: string, searchQuery?: string) => {
    setIsLoadingVideos(true);
    try {
      // Get the course document from Firestore
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }
      
      const courseData = courseDoc.data();
      
      // Find the topic in the syllabus
      let foundResources: VideoResource[] = [];
      
      if (courseData.syllabus && courseData.syllabus.sections) {
        // Loop through sections to find the topic
        for (const section of courseData.syllabus.sections) {
          for (const subsection of section.subsections) {
            for (const topic of subsection.topics) {
              // Check if this is the topic we're looking for
              if (topicId.includes(topic.title)) {
                // If the topic has resources, use them
                if (topic.resources && topic.resources.length > 0) {
                  foundResources = topic.resources;
                  break;
                }
              }
            }
            if (foundResources.length > 0) break;
          }
          if (foundResources.length > 0) break;
        }
      }
      
      // If no resources found, use sample data
      if (foundResources.length === 0) {
        foundResources = [
          {
            title: "Introduction to the Topic",
            url: "https://www.youtube.com/watch?v=sample1",
            description: "A beginner-friendly overview of the topic"
          },
          {
            title: "Advanced Concepts",
            url: "https://www.youtube.com/watch?v=sample2",
            description: "Deeper dive into advanced concepts"
          },
          {
            title: "Practical Examples",
            url: "https://www.youtube.com/watch?v=sample3",
            description: "Real-world applications and examples"
          }
        ];
      }
      
      setVideoResources(foundResources);
    } catch (error) {
      console.error('Error fetching video resources:', error);
      // Fallback to sample data
      setVideoResources([
        {
          title: "Introduction to the Topic",
          url: "https://www.youtube.com/watch?v=sample1",
          description: "A beginner-friendly overview of the topic"
        },
        {
          title: "Advanced Concepts",
          url: "https://www.youtube.com/watch?v=sample2",
          description: "Deeper dive into advanced concepts"
        },
        {
          title: "Practical Examples",
          url: "https://www.youtube.com/watch?v=sample3",
          description: "Real-world applications and examples"
        }
      ]);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleVideoSelect = (video: VideoResource) => {
    if (canvasRef.current && selectedTopicForVideo) {
      // Calculate position for the video node (to the right of the topic node)
      const topicX = selectedTopicForVideo.x;
      const topicY = selectedTopicForVideo.y;
      
      // Create a new video node
      const newVideoNode: VideoNode = {
        id: `video-node-${Date.now()}`,
        x: topicX + 200, // Position it to the right of the topic node with some spacing
        y: topicY, // Keep the same vertical position
        title: video.title,
        url: video.url,
        description: video.description,
        parentTopicId: selectedTopicForVideo.id
      };
      
      // Add the video node
      setVideoNodes([...videoNodes, newVideoNode]);
      
      // Create a connection between the topic and the video
      const newConnection: Connection = {
        id: `connection-${Date.now()}`,
        fromId: selectedTopicForVideo.id,
        toId: newVideoNode.id
      };
      
      // Add the connection
      setConnections([...connections, newConnection]);
      
      // Close the modal
      setIsVideoModalOpen(false);
      setSelectedTopicForVideo(null);
    }
  };

  const openVideoSelector = (topicNode: TopicNode) => {
    setSelectedTopicForVideo(topicNode);
    fetchVideoResources(topicNode.topicId, topicNode.topicName);
    setIsVideoModalOpen(true);
  };

  const deleteVideoNode = (nodeId: string) => {
    setVideoNodes(videoNodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => 
      conn.fromId !== nodeId && conn.toId !== nodeId
    ));
  };

  const handleVideoNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (isConnecting && connectingFrom && connectingFrom !== nodeId) {
      // Create a connection
      const newConnection = {
        id: `connection-${Date.now()}`,
        fromId: connectingFrom,
        toId: nodeId
      };
      
      setConnections([...connections, newConnection]);
      setIsConnecting(false);
      setConnectingFrom(null);
    } else {
      // Start dragging the video node
      setDraggedTopicId(nodeId); // Reuse the same state for dragging
      setNoteDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const startConnectingFromVideo = (nodeId: string) => {
    setIsConnecting(true);
    setConnectingFrom(nodeId);
  };

  const handleVideoNodeClick = (e: React.MouseEvent, node: VideoNode) => {
    e.stopPropagation();
    // Only open the video player if we're not in connecting mode and not dragging
    if (!isConnecting && !draggedTopicId) {
      setActiveVideoNode(node);
      setIsVideoPlayerOpen(true);
    }
  };

  const renderConnections = () => {
    return connections.map(connection => {
      // Find the source and target elements (can be notes, topic nodes, or video nodes)
      const fromNote = canvasNotes.find(note => note.id === connection.fromId);
      const toNote = canvasNotes.find(note => note.id === connection.toId);
      const fromTopic = topicNodes.find(node => node.id === connection.fromId);
      const toTopic = topicNodes.find(node => node.id === connection.toId);
      const fromVideo = videoNodes.find(node => node.id === connection.fromId);
      const toVideo = videoNodes.find(node => node.id === connection.toId);
      
      // Calculate center points for each node type
      let fromX, fromY, toX, toY;
      
      // Calculate source coordinates
      if (fromNote) {
        // Center of note
        fromX = fromNote.x * zoom + position.x + 75 * zoom;
        fromY = fromNote.y * zoom + position.y + 30 * zoom;
      } else if (fromTopic) {
        // For topic nodes, use different connection points based on the target
        if (toVideo) {
          // If connecting to a video, use the right edge of the topic node
          fromX = fromTopic.x * zoom + position.x + 180 * zoom; // Right edge
          fromY = fromTopic.y * zoom + position.y + 50 * zoom; // Vertical center
        } else {
          // Otherwise use the center
          fromX = fromTopic.x * zoom + position.x + 90 * zoom; // Center
          fromY = fromTopic.y * zoom + position.y + 50 * zoom;
        }
      } else if (fromVideo) {
        // For video nodes, use different connection points based on the target
        if (toTopic) {
          // If connecting to a topic, use the left edge of the video node
          fromX = fromVideo.x * zoom + position.x; // Left edge
          fromY = fromVideo.y * zoom + position.y + 30 * zoom; // Vertical center
        } else {
          // Otherwise use the center
          fromX = fromVideo.x * zoom + position.x + 90 * zoom; // Center
          fromY = fromVideo.y * zoom + position.y + 30 * zoom;
        }
      } else {
        return null; // Source not found
      }
      
      // Calculate target coordinates
      if (toNote) {
        // Center of note
        toX = toNote.x * zoom + position.x + 75 * zoom;
        toY = toNote.y * zoom + position.y + 30 * zoom;
      } else if (toTopic) {
        // For topic nodes, use different connection points based on the source
        if (fromVideo) {
          // If connecting from a video, use the left edge of the topic node
          toX = toTopic.x * zoom + position.x; // Left edge
          toY = toTopic.y * zoom + position.y + 50 * zoom; // Vertical center
        } else {
          // Otherwise use the center
          toX = toTopic.x * zoom + position.x + 90 * zoom; // Center
          toY = toTopic.y * zoom + position.y + 50 * zoom;
        }
      } else if (toVideo) {
        // For video nodes, use different connection points based on the source
        if (fromTopic) {
          // If connecting from a topic, use the left edge of the video node
          toX = toVideo.x * zoom + position.x; // Left edge
          toY = toVideo.y * zoom + position.y + 30 * zoom; // Vertical center
        } else {
          // Otherwise use the center
          toX = toVideo.x * zoom + position.x + 90 * zoom; // Center
          toY = toVideo.y * zoom + position.y + 30 * zoom;
        }
      } else {
        return null; // Target not found
      }
      
      // Calculate the angle for the arrow
      const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
      
      return (
        <svg 
          key={connection.id} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* Add arrowhead */}
          <polygon 
            points={`${toX},${toY} ${toX-5},${toY-3} ${toX-5},${toY+3}`}
            transform={`rotate(${angle + 90}, ${toX}, ${toY})`}
            fill="rgba(0,0,0,0.3)"
          />
        </svg>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CustomDialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Canvas Header */}
          <div className="flex justify-between items-center p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              {/* Oyster pearl icon */}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-primary/80 ring-4 ring-primary/20" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Oyster Canvas</h2>
                <p className="text-xs text-muted-foreground italic">Create your own mind maps to turbocharge your learning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Canvas Area */}
          <div 
            className="flex-1 overflow-hidden relative bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Major Grid Lines */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${100 * zoom}px ${100 * zoom}px`,
                backgroundPosition: `${position.x}px ${position.y}px`,
                width: '300%',
                height: '300%',
                left: '-100%',
                top: '-100%'
              }}
            />
            
            {/* Minor Grid Lines */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${position.x}px ${position.y}px`,
                width: '300%',
                height: '300%',
                left: '-100%',
                top: '-100%'
              }}
            />
            
            {/* Connections between notes */}
            {renderConnections()}
            
            {/* Canvas Notes */}
            {canvasNotes.map(note => (
              <div
                key={note.id}
                className={`absolute p-3 rounded shadow-md ${note.color} border border-gray-200`}
                style={{
                  left: `${note.x * zoom + position.x}px`,
                  top: `${note.y * zoom + position.y}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  minWidth: '150px',
                  maxWidth: '250px',
                  zIndex: draggedNoteId === note.id ? 30 : 20,
                  cursor: isConnecting ? (connectingFrom === note.id ? 'not-allowed' : 'crosshair') : 'move'
                }}
                onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
                onDoubleClick={(e) => handleNoteDoubleClick(e, note.id)}
              >
                <div className="text-sm mb-2 break-words">
                  {note.content}
                </div>
                <div className="flex justify-end gap-1 mt-2 border-t pt-2">
                  <button 
                    className="p-1 rounded hover:bg-black/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnecting(note.id);
                    }}
                    title="Connect to another note"
                  >
                    <LinkIcon className="h-3 w-3" />
                  </button>
                  <button 
                    className="p-1 rounded hover:bg-black/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    title="Delete note"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Topic Nodes */}
            {topicNodes.map(node => (
              <div
                key={node.id}
                className="absolute rounded-lg shadow-lg bg-blue-700 text-white flex flex-col items-center justify-center relative"
                style={{
                  left: `${node.x * zoom + position.x}px`,
                  top: `${node.y * zoom + position.y}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '180px',
                  minHeight: '100px',
                  zIndex: draggedTopicId === node.id ? 30 : 20,
                  cursor: isConnecting ? (connectingFrom === node.id ? 'not-allowed' : 'crosshair') : 'move'
                }}
                onMouseDown={(e) => handleTopicNodeMouseDown(e, node.id)}
              >
                <div className="text-xs font-medium text-blue-200 mb-1 px-3 pt-3">
                  {node.subsectionName}
                </div>
                <div className="text-sm font-bold text-center p-3 break-words max-w-full">
                  {node.topicName}
                </div>
                
                {/* Floating controls outside the node */}
                <div className="absolute -bottom-6 -right-6 flex gap-1">
                  <button 
                    className="p-2 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVideoSelector(node);
                    }}
                    title="Add video resource"
                  >
                    <Film className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnectingFromTopic(node.id);
                    }}
                    title="Connect to another element"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-red-600 text-white shadow-md hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTopicNode(node.id);
                    }}
                    title="Delete topic node"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Video Nodes */}
            {videoNodes.map(node => (
              <div
                key={node.id}
                className="absolute rounded-lg shadow-lg bg-purple-700 text-white flex flex-col items-center justify-center relative"
                style={{
                  left: `${node.x * zoom + position.x}px`,
                  top: `${node.y * zoom + position.y}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '180px',
                  minHeight: '60px',
                  zIndex: draggedTopicId === node.id ? 30 : 20,
                  cursor: 'move'
                }}
                onMouseDown={(e) => handleVideoNodeMouseDown(e, node.id)}
              >
                <div className="flex items-center justify-center gap-2 p-3">
                  <button
                    className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isConnecting && !draggedTopicId) {
                        setActiveVideoNode(node);
                        setIsVideoPlayerOpen(true);
                      }
                    }}
                    title="Play video"
                  >
                    <Play className="h-4 w-4 text-white flex-shrink-0" />
                  </button>
                  <div className="text-sm font-medium text-center break-words max-w-full">
                    {node.title}
                  </div>
                </div>
                
                {/* Floating controls outside the node */}
                <div className="absolute -bottom-6 -right-6 flex gap-1">
                  <button 
                    className="p-2 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(node.url, '_blank');
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnectingFromVideo(node.id);
                    }}
                    title="Connect to another element"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-red-600 text-white shadow-md hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVideoNode(node.id);
                    }}
                    title="Delete video node"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Editing Modal */}
            {editingNoteId && (
              <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={cancelNoteEdit}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-lg w-80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium mb-2">{isAddingNote ? 'Add Note' : 'Edit Note'}</h3>
                  <textarea
                    className="w-full p-2 border rounded mb-3 h-32"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    autoFocus
                    placeholder="Type your thoughts here..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={cancelNoteEdit}
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveNoteContent}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Topic Selector Modal */}
            {isTopicSelectorOpen && (
              <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setIsTopicSelectorOpen(false)}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-lg w-96"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium mb-4">
                    {selectedSection ? 'Select a Subsection' : 'Select a Section'}
                  </h3>
                  
                  {isLoadingSections ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading course content...</span>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center">
                      <p className="text-red-500">{error}</p>
                      <p className="text-sm text-muted-foreground mt-2">Using sample data instead</p>
                    </div>
                  ) : !selectedSection ? (
                    // Show sections
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {courseSections.map((section, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left p-3 hover:bg-blue-50"
                          onClick={() => handleSectionSelect(index)}
                        >
                          <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{section.title}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    // Show subsections for the selected section
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {subsections.map((subsection) => (
                        <Button
                          key={subsection.id}
                          variant="outline"
                          className="w-full justify-start text-left p-3 hover:bg-blue-50"
                          onClick={() => handleSubsectionSelect(
                            subsection.id, 
                            subsection.name,
                            subsection.topics || []
                          )}
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-600 mr-2" />
                          <span>{subsection.name}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-4">
                    {selectedSection && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedSection(null);
                          setSubsections([]);
                        }}
                        disabled={isLoadingSections}
                      >
                        Back to Sections
                      </Button>
                    )}
                    <div className={selectedSection ? '' : 'ml-auto'}>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsTopicSelectorOpen(false);
                          setSelectedSection(null);
                          setSubsections([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Topic Selector Modal */}
            {selectedSubsection && (
              <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setIsTopicModalOpen(false)}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-lg w-96"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium mb-2">
                    Select a Topic from {selectedSubsection.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a topic to add to your canvas!
                  </p>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedSubsection.topics.map((topic, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left p-3 hover:bg-blue-50"
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{topic.title}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsTopicModalOpen(false);
                        setSelectedSubsection(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Video Resource Selector Modal */}
            {isVideoModalOpen && selectedTopicForVideo && (
              <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setIsVideoModalOpen(false)}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-lg w-96"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium mb-2">
                    Select a Video for {selectedTopicForVideo.topicName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a video resource to add to your canvas
                  </p>
                  
                  {isLoadingVideos ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading video resources...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {videoResources.map((video, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left p-3 hover:bg-purple-50"
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="flex items-start gap-2">
                            <Play className="h-4 w-4 mt-1 text-purple-600 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium">{video.title}</span>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsVideoModalOpen(false);
                        setSelectedTopicForVideo(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* YouTube Video Player Modal */}
            {isVideoPlayerOpen && activeVideoNode && (
              <div 
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                onClick={() => setIsVideoPlayerOpen(false)}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-lg w-[80vw] max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      {activeVideoNode.title}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsVideoPlayerOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-md">
                    {getYouTubeVideoId(activeVideoNode.url) ? (
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(activeVideoNode.url)}`}
                        title={activeVideoNode.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center p-4">
                          <p className="text-lg font-medium text-gray-500 mb-2">Unable to load video</p>
                          <Button 
                            variant="outline"
                            onClick={() => window.open(activeVideoNode.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in browser
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {activeVideoNode.description && (
                    <div className="mt-4 text-sm text-gray-600 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded">
                      <p>{activeVideoNode.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Floating Tools Panel */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 flex items-center">
              {/* Panel Content */}
              <div 
                className="bg-white border rounded-lg shadow-lg overflow-hidden flex-shrink-0"
                style={{ 
                  width: isPanelCollapsed ? '0' : '14rem',
                  opacity: isPanelCollapsed ? '0' : '1',
                  padding: isPanelCollapsed ? '0' : '1rem',
                  pointerEvents: isPanelCollapsed ? 'none' : 'auto',
                  transform: isPanelCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                  transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out',
                  maxHeight: '80vh',
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                }}
              >
                <h3 className="font-medium text-sm mb-3 text-primary">Canvas Tools</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={handleAddStickyNote}
                  >
                    <StickyNote className="h-4 w-4" />
                    <span>Add Note</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={handleAddTopicNode}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Add Topic Node</span>
                  </Button>
                </div>
              </div>
              
              {/* Panel Toggle Button - Always visible */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border bg-white shadow-md hover:bg-primary/5 z-50 ml-2 flex-shrink-0"
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                aria-label={isPanelCollapsed ? "Expand tools panel" : "Collapse tools panel"}
              >
                {isPanelCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Drag Indicator */}
            {isDragging && (
              <div className="fixed bottom-4 right-4 bg-primary/80 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <Move className="h-4 w-4" />
                <span className="text-sm">Moving Canvas</span>
              </div>
            )}
            
            {/* Connection Indicator */}
            {isConnecting && (
              <div className="fixed bottom-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <span className="text-sm">Click on another note to connect</span>
              </div>
            )}
          </div>
          
          {/* Canvas Footer */}
          <div className="p-2 border-t text-xs text-muted-foreground text-center">
            Double-click canvas to add a note • Double-click note to edit • Drag to move • Connect notes with link icon
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CourseCanvas; 