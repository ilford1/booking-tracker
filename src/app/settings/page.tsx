'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Key, 
  Database,
  Mail,
  Palette,
  FileText,
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Marketing',
      timezone: 'America/New_York',
      language: 'en',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      bookingUpdates: true,
      paymentAlerts: true,
      weeklyReport: false,
      marketingEmails: false,
    },
    appearance: {
      theme: 'light',
      compactMode: false,
      sidebarCollapsed: false,
    },
    privacy: {
      profileVisible: true,
      analyticsTracking: true,
      cookieConsent: true,
    },
    integrations: {
      slackWebhook: '',
      googleAnalyticsId: '',
      facebookPixelId: '',
      zapierApiKey: '',
    }
  })

  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('booking-tracker-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to load saved settings:', error)
      }
    }
  }, [])

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const handleSave = () => {
    try {
      localStorage.setItem('booking-tracker-settings', JSON.stringify(settings))
      setUnsavedChanges(false)
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleExport = () => {
    try {
      const data = JSON.stringify(settings, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'booking-tracker-settings.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Settings exported successfully!')
    } catch (error) {
      console.error('Failed to export settings:', error)
      toast.error('Failed to export settings')
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would make an API call
      localStorage.clear()
      toast.success('Account deleted successfully!')
      // Redirect to login page
      window.location.href = '/'
    }
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500 mt-1">
                Manage your account preferences and configuration
              </p>
            </div>
            <div className="flex gap-2">
              {unsavedChanges && (
                <Badge variant="secondary" className="px-3 py-1">
                  Unsaved changes
                </Badge>
              )}
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={settings.profile.company}
                    onChange={(e) => updateSetting('profile', 'company', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.profile.timezone}
                    onValueChange={(value) => updateSetting('profile', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-updates">Booking Updates</Label>
                  <p className="text-sm text-gray-500">Get notified when booking status changes</p>
                </div>
                <Switch
                  id="booking-updates"
                  checked={settings.notifications.bookingUpdates}
                  onCheckedChange={(checked) => updateSetting('notifications', 'bookingUpdates', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-alerts">Payment Alerts</Label>
                  <p className="text-sm text-gray-500">Receive alerts for payment activities</p>
                </div>
                <Switch
                  id="payment-alerts"
                  checked={settings.notifications.paymentAlerts}
                  onCheckedChange={(checked) => updateSetting('notifications', 'paymentAlerts', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-report">Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Get weekly summary reports</p>
                </div>
                <Switch
                  id="weekly-report"
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReport', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-gray-500">Choose your preferred theme</p>
                </div>
                <Select 
                  value={settings.appearance.theme}
                  onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-gray-500">Use more dense layout</p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visible">Profile Visibility</Label>
                  <p className="text-sm text-gray-500">Make your profile visible to collaborators</p>
                </div>
                <Switch
                  id="profile-visible"
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) => updateSetting('privacy', 'profileVisible', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics-tracking">Analytics Tracking</Label>
                  <p className="text-sm text-gray-500">Allow anonymous usage analytics</p>
                </div>
                <Switch
                  id="analytics-tracking"
                  checked={settings.privacy.analyticsTracking}
                  onCheckedChange={(checked) => updateSetting('privacy', 'analyticsTracking', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="password"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.integrations.slackWebhook}
                  onChange={(e) => updateSetting('integrations', 'slackWebhook', e.target.value)}
                />
                <p className="text-sm text-gray-500">Send notifications to your Slack workspace</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga-id">Google Analytics ID</Label>
                <Input
                  id="ga-id"
                  placeholder="GA-XXXXXXXXX-X"
                  value={settings.integrations.googleAnalyticsId}
                  onChange={(e) => updateSetting('integrations', 'googleAnalyticsId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zapier-key">Zapier API Key</Label>
                <Input
                  id="zapier-key"
                  type="password"
                  placeholder="Your Zapier API key"
                  value={settings.integrations.zapierApiKey}
                  onChange={(e) => updateSetting('integrations', 'zapierApiKey', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-gray-500">Download your data as CSV or JSON</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Import Data</h4>
                  <p className="text-sm text-gray-500">Import bookings from CSV file</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-gray-500">Permanently delete your account and data</p>
                </div>
                <Button variant="destructive" className="gap-2" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
