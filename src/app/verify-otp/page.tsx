"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

const resetPasswordSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

function VerifyOTPContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password')
    }
  }, [email, router])

  const onSubmit: SubmitHandler<ResetPasswordForm> = async (data) => {
    if (!email) {
      setMessage({ type: 'error', text: 'Email is missing. Please start over.' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await axios.post('/api/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      })

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' })
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to reset password' })
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to reset password. Please try again.'
      setMessage({ 
        type: 'error', 
        text: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await axios.post('/api/auth/forgot-password', { email })

      if (response.data.success) {
        setMessage({ type: 'success', text: 'New OTP sent to your email!' })
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to resend OTP' })
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : 'Failed to resend OTP. Please try again.'
      setMessage({ 
        type: 'error', 
        text: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-poppins">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the OTP sent to <span className="font-semibold">{email}</span> and your new password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                OTP Code
              </Label>
              <Input
                {...register('otp')}
                id="otp"
                type="text"
                maxLength={6}
                className="mt-1 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                {...register('newPassword')}
                id="newPassword"
                type="password"
                className="mt-1"
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                className="mt-1"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-gray-800 py-3 text-base font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              Resend OTP
            </button>
            <div>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-500">
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}
