import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/wave.svg')] bg-no-repeat bg-cover opacity-10" />
        <div className="absolute -bottom-[40%] -right-[10%] w-[50%] aspect-square rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -top-[20%] -left-[10%] w-[30%] aspect-square rounded-full bg-white/20 blur-3xl" />
      </div>
      
      <div className="container py-12 md:py-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white ring-2 ring-white/30" />
              </div>
              OysterAI
            </Link>
            <p className="mt-3 text-sm text-white/80">
              Personalized learning, limitless potential. Transforming education with AI-powered personalization.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-4 text-white">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/app" className="text-white/70 hover:text-white transition-colors">
                  App
                </Link>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Pricing
                </span>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  About
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4 text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Documentation
                </span>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  FAQ
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4 text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Privacy
                </span>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Terms
                </span>
              </li>
              <li>
                <span className="text-white/40 cursor-not-allowed">
                  Cookies
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} OysterAI. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-white/40 cursor-not-allowed">
              <span className="sr-only">Twitter</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-twitter"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </span>
            <span className="text-white/40 cursor-not-allowed">
              <span className="sr-only">GitHub</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </span>
            <span className="text-white/40 cursor-not-allowed">
              <span className="sr-only">LinkedIn</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-linkedin"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
} 