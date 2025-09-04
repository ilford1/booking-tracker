'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload,
  File,
  FileText,
  FileImage,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  preview?: string
  id?: string
  status?: 'uploading' | 'completed' | 'error'
  progress?: number
  error?: string
}

interface FileUploadProps {
  onFilesChange?: (files: FileWithPreview[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedFileTypes?: string[]
  multiple?: boolean
  className?: string
}

const FileIcon = ({ file }: { file: File }) => {
  const type = file.type
  
  if (type.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-blue-500" />
  }
  if (type.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />
  }
  return <File className="h-8 w-8 text-gray-500" />
}

export function FileUpload({
  onFilesChange,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.csv'],
  multiple = true,
  className
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsDragActive(false)
    
    // Validate file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Process and validate files
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      status: 'uploading' as const,
      progress: 0,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesChange?.(updatedFiles)

    // Simulate file upload with progress
    for (const file of newFiles) {
      try {
        await simulateUpload(file.id!)
      } catch (error) {
        updateFileStatus(file.id!, 'error', 0, 'Upload failed')
      }
    }
  }, [uploadedFiles, maxFiles, onFilesChange])

  const simulateUpload = async (fileId: string) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200))
      updateFileStatus(fileId, 'uploading', progress)
    }
    updateFileStatus(fileId, 'completed', 100)
  }

  const updateFileStatus = (
    fileId: string, 
    status: 'uploading' | 'completed' | 'error',
    progress?: number,
    error?: string
  ) => {
    setUploadedFiles(files => {
      const updatedFiles = files.map(file => 
        file.id === fileId 
          ? { ...file, status, progress, error }
          : file
      )
      onFilesChange?.(updatedFiles)
      return updatedFiles
    })
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    multiple,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive && 'border-blue-500 bg-blue-50',
              isDragReject && 'border-red-500 bg-red-50',
              !isDragActive && !isDragReject && 'border-gray-300 hover:border-gray-400'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive 
                ? 'Drop files here...' 
                : 'Drag & drop files here, or click to select'
              }
            </div>
            <p className="text-sm text-gray-500">
              Supports: {acceptedFileTypes.join(', ')} • Max {formatFileSize(maxSize)} per file
            </p>
            <Button variant="outline" className="mt-4">
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h4>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-10 w-10 object-cover rounded"
                        onLoad={() => URL.revokeObjectURL(file.preview!)}
                      />
                    ) : (
                      <FileIcon file={file} />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress || 0} className="h-1" />
                        <p className="text-xs text-gray-500 mt-1">
                          {file.progress || 0}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === 'error' && file.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {file.error}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <Badge variant={
                      file.status === 'completed' ? 'secondary' :
                      file.status === 'error' ? 'destructive' : 'outline'
                    }>
                      {file.status === 'uploading' ? 'Uploading' :
                       file.status === 'completed' ? 'Complete' : 'Error'}
                    </Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id!)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
