'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Campaign } from '@/types'
import { DetailsDialog } from '@/components/dialogs/details-dialog'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  Plus
} from 'lucide-react'

type SortField = 'name' | 'budget' | 'start_date' | 'end_date' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

interface CampaignsTableProps {
  campaigns: Campaign[]
  onDelete: (id: string, name: string) => Promise<void>
  onSuccess: () => void
  deletingId: string | null
}

export function CampaignsTable({ campaigns, onDelete, onSuccess, deletingId }: CampaignsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4" />
  }

  const getCampaignStatus = (campaign: Campaign) => {
    const today = new Date()
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null

    if (startDate && startDate > today) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' }
    }
    if (endDate && endDate < today) {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800' }
    }
    return { status: 'active', color: 'bg-green-100 text-green-800' }
  }

  const sortedCampaigns = useMemo(() => {
    if (!sortField || !sortDirection) {
      return campaigns
    }

    return [...campaigns].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1

      // Handle different data types
      if (sortField === 'name') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else if (sortField === 'budget') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortField.includes('_date') || sortField.includes('_at')) {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [campaigns, sortField, sortDirection])

  if (campaigns.length === 0) {
    return null // Let parent handle empty state
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="h-auto p-0 font-medium"
              >
                Campaign Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('budget')}
                className="h-auto p-0 font-medium"
              >
                Budget
                {getSortIcon('budget')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('start_date')}
                className="h-auto p-0 font-medium"
              >
                Start Date
                {getSortIcon('start_date')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('end_date')}
                className="h-auto p-0 font-medium"
              >
                End Date
                {getSortIcon('end_date')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('created_at')}
                className="h-auto p-0 font-medium"
              >
                Created
                {getSortIcon('created_at')}
              </Button>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.map((campaign) => {
            const { status, color } = getCampaignStatus(campaign)
            
            return (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    {campaign.objective && (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {campaign.objective}
                      </div>
                    )}
                    {campaign.slug && (
                      <div className="text-xs text-gray-500">
                        Slug: {campaign.slug}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge className={`capitalize ${color}`}>
                    {status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {campaign.budget ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatCurrency(campaign.budget)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {campaign.start_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {formatDate(campaign.start_date)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {campaign.end_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {formatDate(campaign.end_date)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {formatDate(campaign.created_at)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DetailsDialog 
                      data={campaign}
                      type="campaign"
                      trigger={
                        <Button variant="ghost" size="sm" className="p-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <BookingDialog 
                      prefilledCampaignId={campaign.id}
                      onSuccess={onSuccess}
                      trigger={
                        <Button variant="ghost" size="sm" className="p-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={deletingId === campaign.id}
                          className="p-2 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(campaign.id, campaign.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
