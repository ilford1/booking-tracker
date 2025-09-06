'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  FileText,
  Download,
  Upload,
  Trash2,
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      bookingUpdates: true,
      paymentAlerts: true,
      weeklyReport: false,
      marketingEmails: false,
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
  const [isImporting, setIsImporting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('Please select a CSV or JSON file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB')
      return
    }

    setIsImporting(true)
    try {
      const fileContent = await file.text()
      let importedData: any

      if (file.name.endsWith('.csv')) {
        // Parse CSV (basic implementation)
        const lines = fileContent.split('\n')
        if (lines.length < 2) {
          throw new Error('CSV file must contain headers and at least one data row')
        }
        
        const headers = lines[0].split(',').map(h => h.trim())
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',')
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index]?.trim() || ''
            })
            return obj
          })
        
        importedData = data
      } else {
        // Parse JSON
        importedData = JSON.parse(fileContent)
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real implementation, you would send this data to your backend
      console.log('Imported data:', importedData)
      
      toast.success(`Successfully imported ${Array.isArray(importedData) ? importedData.length : 1} record(s)!`)
      
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import data. Please check file format.')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''
      }
    }
  }

  const handleImportClick = () => {
    importFileInputRef.current?.click()
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
          {/* Timezone Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Default Timezone</h4>
                  <p className="text-sm text-gray-500">All dates and times are displayed in Vietnam timezone</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">UTC+7</p>
                  <p className="text-sm text-gray-500">Ho Chi Minh City</p>
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
                  <p className="text-sm text-gray-500">Import bookings from CSV or JSON file</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={handleImportClick}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
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
