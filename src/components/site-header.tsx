'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthStatus } from '@/components/auth/auth-status'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">OysterAI</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/"
            className={`transition-colors hover:text-foreground/80 ${
              isActive('/') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`transition-colors hover:text-foreground/80 ${
              isActive('/dashboard') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            App
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <AuthStatus />
        </div>
      </div>
    </header>
  )
} 