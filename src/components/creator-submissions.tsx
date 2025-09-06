'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import {
  ExternalLink,
  Download,
  FileText,
  Image,
  Video,
  File,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Link as LinkIcon,
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface CreatorSubmission {
  id: string
  deliverable_id?: string
  deliverable_name?: string
  source_type: 'google_drive' | 'email' | 'wetransfer' | 'direct_upload' | 'other'
  source_url?: string
  source_reference?: string
  submitted_by_creator: boolean
  creator_notes?: string
  submitted_at: Date
  status: 'pending_review' | 'approved' | 'rejected' | 'revision_requested'
  reviewed_by?: string
  reviewed_at?: Date
  staff_notes?: string
  files: {
    id: string
    name: string
    type: string
    size: number
    url?: string
    downloaded?: boolean
    download_date?: Date
  }[]
}

interface CreatorSubmissionsProps {
  submissions: CreatorSubmission[]
  creatorName: string
  creatorAvatar?: string
  onSubmissionReview: (submissionId: string, status: 'approved' | 'rejected' | 'revision_requested', notes?: string) => void
  onFileDownload: (submissionId: string, fileId: string) => void
}

export function CreatorSubmissions({
  submissions,
  creatorName,
  creatorAvatar,
  onSubmissionReview,
  onFileDownload
}: CreatorSubmissionsProps) {
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'google_drive': return <ExternalLink className="h-4 w-4" />
      case 'email': return <FileText className="h-4 w-4" />
      case 'wetransfer': return <Download className="h-4 w-4" />
      case 'direct_upload': return <FileText className="h-4 w-4" />
      default: return <LinkIcon className="h-4 w-4" />
    }
  }

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'google_drive': return 'Google Drive'
      case 'email': return 'Email'
      case 'wetransfer': return 'WeTransfer'
      case 'direct_upload': return 'Direct Upload'
      default: return 'Other'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      case 'revision_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Revision Requested</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleReview = (submissionId: string, status: 'approved' | 'rejected' | 'revision_requested') => {
    const notes = prompt(`Add review notes (optional):`)
    onSubmissionReview(submissionId, status, notes || undefined)
    toast.success(`Submission ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'marked for revision'}`)
  }

  const handleFileDownload = (submissionId: string, fileId: string) => {
    onFileDownload(submissionId, fileId)
    toast.success('File download initiated')
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Submissions Yet
            </h3>
            <p className="text-sm text-gray-500">
              Creator submissions will appear here once recorded
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creatorAvatar} />
                  <AvatarFallback>{creatorName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{creatorName}</span>
                    {getSourceIcon(submission.source_type)}
                    <span className="text-sm text-gray-500">
                      via {getSourceLabel(submission.source_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Submitted {formatRelativeTime(submission.submitted_at)}
                    </span>
                    {submission.deliverable_name && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <Badge variant="outline" className="text-xs">
                          {submission.deliverable_name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(submission.status)}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedSubmission(
                    expandedSubmission === submission.id ? null : submission.id
                  )}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Source Information */}
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.source_url && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Source Link</p>
                    <a
                      href={submission.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </div>
                )}
                {submission.source_reference && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reference</p>
                    <p className="text-sm text-gray-900">{submission.source_reference}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            {submission.files.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Files ({submission.files.length})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {submission.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                            {file.downloaded && (
                              <span className="text-green-600 ml-2">• Downloaded</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {submission.source_type === 'direct_upload' && file.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileDownload(submission.id, file.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Notes */}
            {submission.creator_notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Creator's Notes</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{submission.creator_notes}</p>
                </div>
              </div>
            )}

            {/* Staff Review */}
            {submission.status !== 'pending_review' && submission.reviewed_by && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Staff Review</p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-900">
                      Reviewed by {submission.reviewed_by}
                    </span>
                    <span className="text-xs text-blue-700">
                      {submission.reviewed_at && formatRelativeTime(submission.reviewed_at)}
                    </span>
                  </div>
                  {submission.staff_notes && (
                    <p className="text-sm text-blue-800">{submission.staff_notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Review Actions */}
            {submission.status === 'pending_review' && (
              <>
                <Separator className="mb-4" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Review Submission</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(submission.id, 'revision_requested')}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Request Revision
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(submission.id, 'rejected')}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReview(submission.id, 'approved')}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
