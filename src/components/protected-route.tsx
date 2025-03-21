'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { AuthModal } from '@/components/auth/auth-modal'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user && !isAuthModalOpen) {
      // If not logged in and modal not open, show the modal
      setIsAuthModalOpen(true)
    }
  }, [user, loading, isAuthModalOpen])

  // Handle modal close - redirect if still not logged in
  const handleModalClose = () => {
    setIsAuthModalOpen(false)
    if (!user) {
      router.push(redirectTo)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {user ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to access this page.</p>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleModalClose} 
        defaultTab="login"
      />
    </>
  )
} 