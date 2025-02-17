import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const loadingCaptions = [
  "Diving deep into the ocean of knowledge",
  "Crafting your personalized learning journey",
  "Polishing each pearl of wisdom",
  "Discovering hidden learning treasures",
  "Creating your perfect learning path"
]

export function LoadingOverlay() {
  const [currentCaption, setCurrentCaption] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCaption((prev) => (prev + 1) % loadingCaptions.length)
    }, 3000) // Change caption every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Oyster */}
        <div className="relative w-32 h-32">
          {/* Bottom Shell */}
          <div className="absolute inset-0 bg-primary/10 rounded-full">
            <div className="absolute inset-4 bg-primary/20 rounded-full" />
          </div>
          
          {/* Top Shell - Animated */}
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full origin-bottom"
            animate={{
              rotateX: [0, -30, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-4 bg-primary/20 rounded-full" />
          </motion.div>
          
          {/* Pearl */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-full h-full rounded-full bg-primary/80 ring-4 ring-primary/20" />
          </motion.div>
        </div>

        {/* Rotating Captions */}
        <div className="h-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentCaption}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-primary text-center font-medium"
            >
              {loadingCaptions[currentCaption]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 