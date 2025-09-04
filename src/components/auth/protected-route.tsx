'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
  fallbackComponent?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/auth/signin',
  fallbackComponent 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to sign in
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      } else if (requiredRoles.length > 0 && user.profile) {
        // User is authenticated, check role permissions
        const userRole = user.profile.user_role
        const hasRequiredRole = requiredRoles.includes(userRole)
        
        if (!hasRequiredRole) {
          // User doesn't have required role, show unauthorized or redirect
          router.push('/unauthorized')
        }
      }
    }
  }, [user, loading, router, requiredRoles, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is not authenticated
  if (!user) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }
    return null // Will redirect in useEffect
  }

  // User is authenticated but doesn't have required role
  if (requiredRoles.length > 0 && user.profile) {
    const userRole = user.profile.user_role
    const hasRequiredRole = requiredRoles.includes(userRole)
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-gray-600">
                  You don't have permission to access this page.
                </p>
                <p className="text-sm text-gray-500">
                  Required role: {requiredRoles.join(' or ')}
                  <br />
                  Your role: {userRole}
                </p>
              </div>
              <div className="flex space-x-2">
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Role-specific protection components
export function AdminOnly({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['business_admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function ProviderOnly({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['service_provider', 'business_admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function CustomerOrAbove({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}
