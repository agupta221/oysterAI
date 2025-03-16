import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingActionMenuProps {
  isOpen: boolean;
  onStickyNoteClick: () => void;
  onCanvasClick: () => void;
}

export function FloatingActionMenu({
  isOpen,
  onStickyNoteClick,
  onCanvasClick,
}: FloatingActionMenuProps) {
  const menuItems = [
    {
      icon: StickyNote,
      label: 'Create Sticky Note',
      onClick: onStickyNoteClick,
    },
    {
      icon: Layout,
      label: 'Oyster Canvas',
      onClick: onCanvasClick,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 items-center"
          >
            <TooltipProvider>
              {menuItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={item.onClick}
                        className={cn(
                          "h-12 w-12 rounded-full shadow-md flex items-center justify-center",
                          "bg-white hover:bg-primary/10 text-primary",
                          "border border-primary/20 transition-all duration-200"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </TooltipProvider>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 