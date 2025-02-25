import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Sparkles, 
  Target, 
  Zap,
  Github,
  Twitter,
  Linkedin,
  Mail
} from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-primary/80 ring-4 ring-primary/20" />
            </div>
            <span className="text-2xl font-bold text-primary">Oyster</span>
          </div>

          {/* Auth Button */}
          <Link href="/app">
            <Button>Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-28 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
              Unlock Your Learning Potential with Oyster
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create personalized courses, discover curated resources, and master any subject with our AI-powered education platform.
            </p>
            <Link href="/app">
              <Button size="lg" className="px-8">
                Start Learning Now
              </Button>
            </Link>
          </div>

          {/* Hero Visual */}
          <div className="relative w-48 h-48 mx-auto">
            <div className="absolute inset-0 bg-primary/10 rounded-full">
              <div className="absolute inset-8 bg-primary/20 rounded-full" />
            </div>
            <div className="absolute inset-0 bg-primary/10 rounded-full">
              <div className="absolute inset-12 bg-primary/20 rounded-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/80 ring-8 ring-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why Choose Oyster?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Personalized Courses",
                description: "Intelligent course generation tailored to your goals and interests"
              },
              {
                icon: Target,
                title: "Learning Agents",
                description: "AI agents to help you learn and answer your questions"
              },
              {
                icon: BookOpen,
                title: "Curated Exercises & Activities",
                description: "High-quality quizzes and exercises to test your knowledge"
              },
              {
                icon: Zap,
                title: "Multi-Modal Learning",
                description: "Instructive content that leverages audio, video and text to help you learn"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Courses Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6">
            Courses Our Users Have Generated
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Discover the diverse range of courses created by our community. From technical skills to creative pursuits, the possibilities are endless.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Mobile App Development with Flutter",
                prompt: "I am a senior in college studying computer science - I've heard a lot about app development but haven't tried it yet. Create a course that teaches me about Flutter and focus the content on building an app to help students meet new people on campus.",
                topics: ["Flutter", "Dart", "UI Design", "Firebase"]
              },
              {
                title: "Machine Learning for Climate Science",
                prompt: "I'm an environmental scientist looking to apply machine learning to climate data. I need a course that covers Python, data analysis, and ML techniques specifically for processing and analyzing climate datasets.",
                topics: ["Python", "ML", "Data Analysis", "Climate Data"]
              },
              {
                title: "Game Development with Unity",
                prompt: "I'm an artist with no coding experience but I want to create my own indie games. I need a course that starts from the basics and teaches me Unity and C# while focusing on 2D game development.",
                topics: ["Unity", "C#", "2D Graphics", "Game Design"]
              },
              {
                title: "Personal Finance & Investment",
                prompt: "I'm 25 and just started my first job. I want to learn about personal finance, from budgeting to investing in stocks and crypto. Create a comprehensive course for young professionals.",
                topics: ["Budgeting", "Stocks", "Crypto", "Tax Planning"]
              }
            ].map((course, index) => (
              <div 
                key={index}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-primary">
                    {course.title}
                  </h3>
                  <div className="relative pl-3 mb-6">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/20 rounded-full" />
                    <p className="text-sm italic text-muted-foreground">
                      "{course.prompt}"
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-primary/5 text-primary/70"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-primary/80 ring-4 ring-primary/20" />
                </div>
                <span className="text-xl font-bold text-primary">Oyster</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Personalized Learning, Limitless Potential
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
                <li>API</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <Github className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Mail className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Oyster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 