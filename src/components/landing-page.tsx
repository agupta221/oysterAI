'use client'

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
  Mail,
  ChevronRight,
  ExternalLink,
  ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation - Glass Effect */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 border-b border-neutral-200/50"
        style={{
          boxShadow: scrollY > 10 ? '0 4px 30px rgba(0, 0, 0, 0.05)' : 'none'
        }}
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden group">
              <div className="w-6 h-6 rounded-full bg-primary/80 ring-4 ring-primary/20 z-10 transition-all duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-radial from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="text-2xl font-bold text-primary">Oyster</span>
          </motion.div>

          {/* Nav Links - Added */}
          <motion.div 
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link 
              href="#features" 
              className="text-sm font-medium text-neutral-800 hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#courses" 
              className="text-sm font-medium text-neutral-800 hover:text-primary transition-colors"
            >
              Courses
            </Link>
            <Link 
              href="#" 
              className="text-sm font-medium text-neutral-800 hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="#" 
              className="text-sm font-medium text-neutral-800 hover:text-primary transition-colors"
            >
              About
            </Link>
          </motion.div>

          {/* Auth Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/app">
              <Button className="rounded-full px-6 font-medium">
                Sign In <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[70%] rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl" />
          <div className="absolute bottom-[10%] left-[15%] w-[30%] h-[40%] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative">
          <motion.div 
            className="max-w-4xl mx-auto mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="mr-2">🚀</span> Redefining personal education
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                Unlock Your Learning Potential
              </span>
              <br />with Oyster
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create personalized courses, discover curated resources, and master any subject with our AI-powered education platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="px-8 h-14 rounded-full text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/20 transition-all group">
                  Start Learning Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 h-14 rounded-full text-base border-2">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual - More Complex Interactive Pearl */}
          <motion.div 
            className="relative w-72 h-72 mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              delay: 0.2,
              duration: 0.8 
            }}
          >
            <div className="absolute inset-0 animate-pulse-slow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-purple-500/40 rounded-full blur-3xl" />
            </div>
            
            {/* Outer Shells */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-400/10 rounded-full">
              <div className="absolute inset-8 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-spin-very-slow bg-gradient-to-br from-primary/10 to-purple-400/10 rounded-full opacity-70">
              <div className="absolute inset-12 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full" />
            </div>
            
            {/* Pearl with Glow Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-white dark:bg-neutral-900 rounded-full opacity-70 blur-md animate-pulse-slow" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white to-primary/80 dark:from-primary/80 dark:to-purple-600 backdrop-blur-sm shadow-xl animate-float">
                  <div className="absolute top-1 left-3 w-6 h-2 bg-white/80 rounded-full rotate-[30deg] blur-[1px]" />
                </div>
              </div>
            </div>
            
            {/* Particle Effects */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary/80"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    opacity: 0.7,
                    animation: `float ${3 + Math.random() * 4}s infinite ease-in-out ${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-blue-50 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.3]" />
        </div>
        
        <div className="container mx-auto px-6 relative">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="mr-2 h-4 w-4" /> Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Why Choose Oyster?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Our AI-powered education platform transforms how you learn with personalized content and cutting-edge technology.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Sparkles,
                title: "Personalized Courses",
                description: "Intelligent course generation tailored to your goals and interests with adaptive learning paths.",
                color: "from-blue-500 to-indigo-600"
              },
              {
                icon: Target,
                title: "Learning Agents",
                description: "AI agents that adapt to your learning style and help you master concepts at your own pace.",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: BookOpen,
                title: "Curated Exercises",
                description: "High-quality interactive quizzes and exercises that reinforce knowledge and improve retention.",
                color: "from-amber-500 to-orange-600"
              },
              {
                icon: Zap,
                title: "Multi-Modal Learning",
                description: "Engaging content across audio, video, and text formats to suit all learning preferences.",
                color: "from-purple-500 to-pink-600"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="mb-6 relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700`} />
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} p-0.5`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
                      <feature.icon className={`h-7 w-7 ${feature.color === "from-blue-500 to-indigo-600" ? "text-blue-600" : 
                                                feature.color === "from-green-500 to-emerald-600" ? "text-emerald-600" : 
                                                feature.color === "from-amber-500 to-orange-600" ? "text-orange-600" : 
                                                "text-purple-600"}`} />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Example Courses Section */}
      <section id="courses" className="py-32 bg-white relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-[30%] -right-[10%] w-[50%] h-[70%] rounded-full bg-gradient-to-tl from-blue-500/10 to-transparent blur-3xl" />
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <BookOpen className="mr-2 h-4 w-4" /> Learn Anything
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Courses Our Users Have Generated
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Discover the diverse range of courses created by our community. From technical skills to creative pursuits, the possibilities are endless.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                title: "Mobile App Development with Flutter",
                prompt: "I am a senior in college studying computer science - I've heard a lot about app development but haven't tried it yet. Create a course that teaches me about Flutter and focus the content on building an app to help students meet new people on campus.",
                topics: ["Flutter", "Dart", "UI Design", "Firebase"],
                color: "from-blue-500 to-cyan-400",
                emoji: "📱"
              },
              {
                title: "Machine Learning for Climate Science",
                prompt: "I'm an environmental scientist looking to apply machine learning to climate data. I need a course that covers Python, data analysis, and ML techniques specifically for processing and analyzing climate datasets.",
                topics: ["Python", "ML", "Data Analysis", "Climate Data"],
                color: "from-green-500 to-emerald-400",
                emoji: "🌍"
              },
              {
                title: "Game Development with Unity",
                prompt: "I'm an artist with no coding experience but I want to create my own indie games. I need a course that starts from the basics and teaches me Unity and C# while focusing on 2D game development.",
                topics: ["Unity", "C#", "2D Graphics", "Game Design"],
                color: "from-purple-500 to-indigo-400",
                emoji: "🎮"
              },
              {
                title: "Personal Finance & Investment",
                prompt: "I'm 25 and just started my first job. I want to learn about personal finance, from budgeting to investing in stocks and crypto. Create a comprehensive course for young professionals.",
                topics: ["Budgeting", "Stocks", "Crypto", "Tax Planning"],
                color: "from-amber-500 to-yellow-400",
                emoji: "💰"
              }
            ].map((course, index) => (
              <motion.div 
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                variants={fadeIn}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300`} />
                
                <div className="p-1">
                  <div className={`bg-gradient-to-br ${course.color} rounded-xl p-4 text-white`}>
                    <div className="text-2xl mb-1">{course.emoji}</div>
                    <h3 className="font-bold text-lg line-clamp-1 mb-1">
                      {course.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {course.topics.slice(0, 2).map((topic, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="relative mb-6 flex-1">
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${course.color} rounded-full`} />
                    <p className="pl-4 text-sm text-neutral-600 leading-relaxed italic">
                      "{course.prompt}"
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {course.topics.slice(2).map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Link href="/app">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-2">
                Explore All Courses <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/wave.svg')] bg-no-repeat bg-cover opacity-10" />
          <div className="absolute -bottom-[40%] -right-[10%] w-[50%] aspect-square rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -top-[20%] -left-[10%] w-[30%] aspect-square rounded-full bg-white/20 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Transform How You Learn?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of learners who have already discovered the power of personalized AI education.
            </p>
            <Link href="/app">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 h-14 rounded-full text-base font-medium">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 