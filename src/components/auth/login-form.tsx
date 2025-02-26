'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signInWithEmail, signInWithGoogle, resetPassword, sendVerificationEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isResendVerificationLoading, setIsResendVerificationLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      await signInWithEmail(data.email, data.password)
      toast.success('Successfully logged in')
      onSuccess()
    } catch (error: any) {
      if (error.message && error.message.includes('verify your email')) {
        setUnverifiedEmail(data.email)
        setShowVerificationPrompt(true)
      } else {
        toast.error(error.message || 'Failed to login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Successfully logged in with Google')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to login with Google')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleResetPassword = async () => {
    const email = getValues('email')
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsResetLoading(true)
    try {
      await resetPassword(email)
      toast.success('Password reset email sent')
      setShowResetPassword(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResendVerificationLoading(true)
    try {
      // We need to sign in the user temporarily to send the verification email
      try {
        const email = unverifiedEmail || getValues('email')
        // This will throw an error because the email is not verified
        await signInWithEmail(email, getValues('password'))
      } catch (error) {
        // This is expected, we just need to trigger the sendVerificationEmail
      }
      
      await sendVerificationEmail()
      toast.success('Verification email sent. Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setIsResendVerificationLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {showVerificationPrompt ? (
        <div className="p-6 border rounded-lg bg-muted/30 space-y-4">
          <h3 className="text-lg font-medium">Email Verification Required</h3>
          <p>
            Your email address <strong>{unverifiedEmail}</strong> needs to be verified before you can log in.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your inbox for the verification link. If you can't find it, you can request a new verification email.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleResendVerification}
              disabled={isResendVerificationLoading}
              className="flex-1"
            >
              {isResendVerificationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVerificationPrompt(false)}
              className="flex-shrink-0"
            >
              Back
            </Button>
          </div>
        </div>
      ) : showResetPassword ? (
        <div className="p-6 border rounded-lg bg-muted/30 space-y-4">
          <h3 className="text-lg font-medium">Reset Your Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              placeholder="name@example.com"
              {...register('email')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetLoading}
              className="flex-1"
            >
              {isResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetPassword(false)}
              className="flex-shrink-0"
            >
              Back to Login
            </Button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-normal"
                  onClick={() => setShowResetPassword(true)}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>
        </>
      )}
    </div>
  )
} 