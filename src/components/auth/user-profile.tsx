'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function UserProfile() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      toast.success('Successfully logged out')
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout')
    } finally {
      setIsLoading(false)
    }
  }

  // Get initials from email
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || 'User'} />
          <AvatarFallback>{user.displayName ? user.displayName.substring(0, 2).toUpperCase() : getInitials(user.email || 'User')}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle>{user.displayName || 'User'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Email verified</span>
            <span className="text-sm">{user.emailVerified ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Account created</span>
            <span className="text-sm">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Last sign in</span>
            <span className="text-sm">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  )
} 