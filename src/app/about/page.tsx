import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: 'About | Oyster AI',
  description: 'Learn more about Oyster AI and our mission',
}

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="text-4xl font-bold mb-6">About Oyster AI</h1>
          
          <div className="prose prose-lg dark:prose-invert">
            <p className="lead">
              Oyster AI is revolutionizing education by creating personalized learning experiences powered by artificial intelligence.
            </p>
            
            <h2>Our Mission</h2>
            <p>
              We believe that education should be tailored to each individual's needs, interests, and learning style. 
              Our mission is to make high-quality, personalized education accessible to everyone, everywhere.
            </p>
            
            <h2>How It Works</h2>
            <p>
              Oyster AI uses advanced artificial intelligence to analyze your learning goals and create customized courses 
              that adapt to your progress. Our platform combines cutting-edge technology with proven educational methodologies 
              to deliver an effective and engaging learning experience.
            </p>
            
            <h2>Our Team</h2>
            <p>
              We are a team of educators, technologists, and lifelong learners passionate about transforming education. 
              With backgrounds in AI, education technology, and instructional design, we're committed to building 
              tools that empower learners and educators alike.
            </p>
            
            <h2>Get in Touch</h2>
            <p>
              Have questions or feedback? We'd love to hear from you! Contact us at 
              <a href="mailto:info@oysterai.com" className="text-primary hover:underline"> info@oysterai.com</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
} 