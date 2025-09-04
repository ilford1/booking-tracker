'use client'

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  BookOpen,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Search,
  Loader2
} from 'lucide-react'
import { useGlobalSearch, type SearchResult } from '@/hooks/use-global-search'
import { cn } from '@/lib/utils'

// Icon mapping
const iconMap = {
  LayoutDashboard,
  Users,
  Megaphone,
  BookOpen,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Search
}

function getResultIcon(result: SearchResult) {
  if (result.icon && result.icon in iconMap) {
    const Icon = iconMap[result.icon as keyof typeof iconMap]
    return <Icon className="h-4 w-4" />
  }
  return <Search className="h-4 w-4" />
}

function getTypeColor(type: string) {
  switch (type) {
    case 'navigation':
      return 'bg-blue-100 text-blue-800'
    case 'action':
      return 'bg-green-100 text-green-800'
    case 'creator':
      return 'bg-purple-100 text-purple-800'
    case 'campaign':
      return 'bg-orange-100 text-orange-800'
    case 'booking':
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'navigation':
      return 'Page'
    case 'action':
      return 'Action'
    case 'creator':
      return 'Creator'
    case 'campaign':
      return 'Campaign'
    case 'booking':
      return 'Booking'
    default:
      return type
  }
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const {
    query,
    results,
    isLoading,
    setQuery,
    handleSelect,
  } = useGlobalSearch()

  // Initialize results when opening
  useEffect(() => {
    if (open && !query) {
      setQuery('') // This will trigger the default results
    }
  }, [open, query, setQuery])

  const groupedResults = results.reduce((groups, result) => {
    const type = result.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(result)
    return groups
  }, {} as Record<string, SearchResult[]>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for creators, campaigns, pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {query ? 'No results found' : 'Start typing to search...'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedResults).map(([type, typeResults], groupIndex) => (
                <div key={type}>
                  {groupIndex > 0 && <Separator className="my-2" />}
                  
                  {typeResults.map((result) => (
                    <div
                      key={result.id}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                        "border-l-2 border-transparent hover:border-l-blue-500"
                      )}
                      onClick={() => {
                        handleSelect(result)
                        onClose()
                      }}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getTypeColor(result.type))}
                          >
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded">↵</kbd>
                <span>to select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded">F</kbd>
              <span>to open</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
