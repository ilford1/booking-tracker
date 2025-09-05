'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Types for search results
export interface SearchResult {
  id: string
  type: 'creator' | 'campaign' | 'booking' | 'navigation' | 'action'
  title: string
  description: string
  url?: string
  action?: () => void
  icon?: string
  data?: any
}

// Mock data - in a real app this would come from your search API
const navigationItems: SearchResult[] = [
  {
    id: 'nav-dashboard',
    type: 'navigation',
    title: 'Dashboard',
    description: 'View dashboard and KPIs',
    url: '/',
    icon: 'LayoutDashboard'
  },
  {
    id: 'nav-creators',
    type: 'navigation',
    title: 'Creators',
    description: 'Manage creator directory',
    url: '/creators',
    icon: 'Users'
  },
  {
    id: 'nav-campaigns',
    type: 'navigation',
    title: 'Campaigns',
    description: 'Manage marketing campaigns',
    url: '/campaigns',
    icon: 'Megaphone'
  },
  {
    id: 'nav-bookings',
    type: 'navigation',
    title: 'Bookings',
    description: 'View booking workflow',
    url: '/bookings',
    icon: 'BookOpen'
  },
  {
    id: 'nav-calendar',
    type: 'navigation',
    title: 'Calendar',
    description: 'View deliverables calendar',
    url: '/calendar',
    icon: 'Calendar'
  },
  {
    id: 'nav-payments',
    type: 'navigation',
    title: 'Payments',
    description: 'Manage payments and invoices',
    url: '/payments',
    icon: 'CreditCard'
  },
  {
    id: 'nav-reports',
    type: 'navigation',
    title: 'Reports',
    description: 'View analytics and performance',
    url: '/reports',
    icon: 'BarChart3'
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    title: 'Settings',
    description: 'Configure system settings',
    url: '/settings',
    icon: 'Settings'
  }
]

const quickActions: SearchResult[] = [
  {
    id: 'action-add-creator',
    type: 'action',
    title: 'Add Creator',
    description: 'Add new creator to directory',
    icon: 'Plus',
    action: () => {
      // This will be connected to actual dialog opening
      toast.info('Opening Add Creator dialog...')
    }
  },
  {
    id: 'action-add-campaign',
    type: 'action',
    title: 'Add Campaign',
    description: 'Create new marketing campaign',
    icon: 'Plus',
    action: () => {
      toast.info('Opening Add Campaign dialog...')
    }
  },
  {
    id: 'action-add-booking',
    type: 'action',
    title: 'Add Booking',
    description: 'Create new creator booking',
    icon: 'Plus',
    action: () => {
      toast.info('Opening Add Booking dialog...')
    }
  }
]

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Mock search function - replace with actual API call
  const performSearch = useMemo(() => {
    return async (searchQuery: string): Promise<SearchResult[]> => {
      if (!searchQuery.trim()) {
        return [...navigationItems, ...quickActions]
      }

      const lowercaseQuery = searchQuery.toLowerCase()
      
      // Search navigation items
      const navResults = navigationItems.filter(
        item =>
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.description.toLowerCase().includes(lowercaseQuery)
      )

      // Search quick actions
      const actionResults = quickActions.filter(
        item =>
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.description.toLowerCase().includes(lowercaseQuery)
      )

      // Mock creator search results
      const creatorResults: SearchResult[] = []
      if (lowercaseQuery.includes('creator') || lowercaseQuery.includes('@')) {
        creatorResults.push(
          {
            id: 'creator-jane',
            type: 'creator',
            title: '@fashionista_jane',
            description: 'Fashion influencer • 45K followers',
            url: '/creators',
            data: { handle: '@fashionista_jane' }
          },
          {
            id: 'creator-mike',
            type: 'creator',
            title: '@tech_reviewer',
            description: 'Tech reviewer • 78K followers',
            url: '/creators',
            data: { handle: '@tech_reviewer' }
          }
        )
      }

      // Mock campaign search results
      const campaignResults: SearchResult[] = []
      if (lowercaseQuery.includes('campaign') || lowercaseQuery.includes('summer') || lowercaseQuery.includes('tech')) {
        campaignResults.push(
          {
            id: 'campaign-summer',
            type: 'campaign',
            title: 'Summer Sale 2024',
            description: 'Fashion campaign • ₫1.15B budget',
            url: '/campaigns',
            data: { name: 'Summer Sale 2024' }
          },
          {
            id: 'campaign-tech',
            type: 'campaign',
            title: 'Tech Product Launch',
            description: 'Product launch • ₫1.73B budget',
            url: '/campaigns',
            data: { name: 'Tech Product Launch' }
          }
        )
      }

      return [
        ...navResults,
        ...actionResults,
        ...creatorResults,
        ...campaignResults
      ].slice(0, 10) // Limit to 10 results
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults = await performSearch(query)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Search failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, isOpen, performSearch])

  const handleSelect = (result: SearchResult) => {
    if (result.url) {
      router.push(result.url)
    } else if (result.action) {
      result.action()
    }
    setIsOpen(false)
    setQuery('')
  }

  const open = () => setIsOpen(true)
  const close = () => {
    setIsOpen(false)
    setQuery('')
  }

  return {
    isOpen,
    query,
    results,
    isLoading,
    setQuery,
    handleSelect,
    open,
    close
  }
}
