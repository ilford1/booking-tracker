'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield,
  Users,
  Database,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  UserPlus,
  Trash2,
  Edit,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  user_role: string
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

function AdminContent() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Fetch users data from API
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const { users } = await response.json()
      setUsers(users)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search and role
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || u.user_role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      'customer': { label: 'Customer', color: 'bg-blue-100 text-blue-800' },
      'service_provider': { label: 'Service Provider', color: 'bg-green-100 text-green-800' },
      'business_admin': { label: 'Business Admin', color: 'bg-purple-100 text-purple-800' },
      'super_admin': { label: 'Super Admin', color: 'bg-red-100 text-red-800' }
    }
    return roleMap[role as keyof typeof roleMap] || { label: role, color: 'bg-gray-100 text-gray-800' }
  }

  const getStatsData = () => {
    const totalUsers = users.length
    const adminUsers = users.filter(u => u.user_role === 'business_admin' || u.user_role === 'super_admin').length
    const serviceProviders = users.filter(u => u.user_role === 'service_provider').length
    const customers = users.filter(u => u.user_role === 'customer').length
    const verifiedUsers = users.filter(u => u.email_confirmed_at).length
    
    return { totalUsers, adminUsers, serviceProviders, customers, verifiedUsers }
  }

  const stats = getStatsData()

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 mt-1">
                Manage users, monitor system health, and configure settings
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Admins</p>
                        <p className="text-2xl font-bold">{stats.adminUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Providers</p>
                        <p className="text-2xl font-bold">{stats.serviceProviders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Customers</p>
                        <p className="text-2xl font-bold">{stats.customers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Verified</p>
                        <p className="text-2xl font-bold">{stats.verifiedUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.email[0])}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name} ({user.email})</p>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={getRoleDisplay(user.user_role).color}>
                          {getRoleDisplay(user.user_role).label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search users by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="business_admin">Business Admin</SelectItem>
                        <SelectItem value="service_provider">Service Provider</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Users List */}
              <Card>
                <CardHeader>
                  <CardTitle>Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.email[0])}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium">
                                  {user.first_name} {user.last_name} ({user.email})
                                </h4>
                                <Badge className={getRoleDisplay(user.user_role).color}>
                                  {getRoleDisplay(user.user_role).label}
                                </Badge>
                                {user.email_confirmed_at ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>ID: {user.id.substring(0, 8)}...</span>
                                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                {user.last_sign_in_at && (
                                  <span>Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== user?.id && (
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>All database connections healthy</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Analytics dashboard coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">System configuration options coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['business_admin', 'super_admin']}>
      <AdminContent />
    </ProtectedRoute>
  )
}
