export default function MainContent() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-block">
          {/* Decorative element */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/80 ring-8 ring-primary/20" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
          Build Your Perfect Course
        </h1>
        <p className="text-lg text-muted-foreground">
          Select options from the sidebar to start customizing your learning journey. Your personalized course content
          will appear here.
        </p>
      </div>
    </div>
  )
} 