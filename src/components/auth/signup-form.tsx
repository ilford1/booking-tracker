'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Mail, Lock, User, Phone, Chrome, UserPlus } from 'lucide-react'
import { UserRole } from '@/lib/auth-context'

export function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userRole: 'customer' as UserRole
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [step, setStep] = useState(1) // 1: Role selection, 2: Form filling
  
  const { signUp, signInWithOAuth } = useAuth()
  const router = useRouter()

  const handleRoleSelection = (role: UserRole) => {
    setFormData(prev => ({ ...prev, userRole: role }))
    setStep(2)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return // Error toast will be handled by the form validation
    }

    if (formData.password.length < 8) {
      return // Error toast will be handled by the form validation
    }

    setLoading(true)

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          user_role: formData.userRole
        }
      )
      
      if (!error) {
        router.push('/auth/verify-email')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'apple') => {
    setOauthLoading(provider)
    
    try {
      await signInWithOAuth(provider)
    } finally {
      setOauthLoading(null)
    }
  }

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.firstName &&
      formData.lastName &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Choose Your Account Type
            </CardTitle>
            <CardDescription className="text-center">
              Select the type of account that best describes you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => handleRoleSelection('customer')}
            >
              <User className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Customer</div>
                <div className="text-sm text-gray-500">Book services and manage appointments</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => handleRoleSelection('service_provider')}
            >
              <UserPlus className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Service Provider</div>
                <div className="text-sm text-gray-500">Offer services and manage your calendar</div>
              </div>
            </Button>
          </CardContent>

          <CardFooter>
            <div className="w-full text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center">
            {formData.userRole === 'customer' ? 'Start booking services' : 'Start offering your services'}
          </CardDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Change account type
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('google')}
              disabled={!!oauthLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.password && formData.password.length < 8 && (
                <p className="text-sm text-red-600">Password must be at least 8 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isFormValid()}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <div className="w-full text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
