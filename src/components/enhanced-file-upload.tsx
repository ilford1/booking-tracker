'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Upload,
  Link,
  Download,
  FileText,
  Image,
  Video,
  File,
  X,
  Plus,
  ExternalLink,
  Calendar,
  User,
  Loader2,
  CheckCircle
} from 'lucide-react'

interface CreatorSubmission {
  id: string
  deliverable_id?: string
  source_type: 'google_drive' | 'email' | 'wetransfer' | 'direct_upload' | 'other'
  source_url?: string
  source_reference?: string
  submitted_by_creator: boolean
  creator_notes?: string
  submitted_at: Date
  files: {
    id: string
    name: string
    type: string
    size: number
    url?: string
    preview_url?: string
  }[]
}

interface EnhancedFileUploadProps {
  bookingId: string
  creatorName: string
  deliverables: Array<{
    id: string
    description: string
    type: string
    deadline: Date
    status: string
  }>
  onSubmissionAdded: (submission: CreatorSubmission) => void
}

export function EnhancedFileUpload({ 
  bookingId, 
  creatorName, 
  deliverables,
  onSubmissionAdded 
}: EnhancedFileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [sourceType, setSourceType] = useState<'google_drive' | 'email' | 'wetransfer' | 'direct_upload' | 'other'>('google_drive')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [selectedDeliverable, setSelectedDeliverable] = useState('')
  const [creatorNotes, setCreatorNotes] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sourceTypes = [
    { value: 'google_drive', label: 'Google Drive', icon: ExternalLink, description: 'Creator shared Google Drive folder/link' },
    { value: 'email', label: 'Email', icon: FileText, description: 'Creator sent files via email' },
    { value: 'wetransfer', label: 'WeTransfer', icon: Download, description: 'Creator shared via WeTransfer' },
    { value: 'direct_upload', label: 'Direct Upload', icon: Upload, description: 'Upload files directly to system' },
    { value: 'other', label: 'Other', icon: Link, description: 'Other source (specify in reference)' }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (sourceType !== 'direct_upload' && !sourceUrl && !sourceReference) {
      toast.error('Please provide source URL or reference')
      return
    }

    if (sourceType === 'direct_upload' && uploadedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))

      const submission: CreatorSubmission = {
        id: `sub-${Date.now()}`,
        deliverable_id: selectedDeliverable || undefined,
        source_type: sourceType,
        source_url: sourceUrl || undefined,
        source_reference: sourceReference || undefined,
        submitted_by_creator: true,
        creator_notes: creatorNotes || undefined,
        submitted_at: new Date(),
        files: uploadedFiles.map((file, index) => ({
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: sourceType === 'direct_upload' ? URL.createObjectURL(file) : undefined
        }))
      }

      onSubmissionAdded(submission)
      
      // Reset form
      setSourceUrl('')
      setSourceReference('')
      setSelectedDeliverable('')
      setCreatorNotes('')
      setUploadedFiles([])
      setIsOpen(false)
      
      toast.success('Creator submission recorded successfully!')
      
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error('Failed to record submission')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Record Creator Submission
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {creatorName} has submitted content via external platform
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Submission
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Record Creator Submission
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Creator Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">{creatorName}</span>
          </div>
          <p className="text-sm text-blue-700">
            Recording content submission from creator
          </p>
        </div>

        {/* Source Type Selection */}
        <div className="space-y-3">
          <Label>How did the creator submit content?</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sourceTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setSourceType(type.value as any)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    sourceType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Source Details */}
        {sourceType !== 'direct_upload' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-url">
                {sourceType === 'google_drive' && 'Google Drive Link'}
                {sourceType === 'email' && 'Email Subject/Sender'}
                {sourceType === 'wetransfer' && 'WeTransfer Link'}
                {sourceType === 'other' && 'Source URL/Link'}
              </Label>
              <Input
                id="source-url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={
                  sourceType === 'google_drive' ? 'https://drive.google.com/...' :
                  sourceType === 'email' ? 'Email from creator@email.com - Subject' :
                  sourceType === 'wetransfer' ? 'https://wetransfer.com/...' :
                  'Source link or reference'
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source-reference">Additional Reference (Optional)</Label>
              <Input
                id="source-reference"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="Folder name, file names, or other reference info"
              />
            </div>
          </div>
        )}

        {/* Direct Upload */}
        {sourceType === 'direct_upload' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Files</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to select files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deliverable Assignment */}
        {deliverables.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="deliverable">Assign to Deliverable (Optional)</Label>
            <Select value={selectedDeliverable} onValueChange={setSelectedDeliverable}>
              <SelectTrigger>
                <SelectValue placeholder="Select deliverable" />
              </SelectTrigger>
              <SelectContent>
                {deliverables.map((deliverable) => (
                  <SelectItem key={deliverable.id} value={deliverable.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{deliverable.type}</Badge>
                      <span>{deliverable.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Creator Notes */}
        <div className="space-y-2">
          <Label htmlFor="creator-notes">Creator's Notes (Optional)</Label>
          <Textarea
            id="creator-notes"
            value={creatorNotes}
            onChange={(e) => setCreatorNotes(e.target.value)}
            placeholder="Any notes or comments from the creator..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Record Submission
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
