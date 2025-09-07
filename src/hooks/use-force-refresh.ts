import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useForceRefresh() {
  const router = useRouter()

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing page...')
    
    // Method 1: Router refresh (Next.js 13+)
    router.refresh()
    
    // Method 2: Add cache busting to current URL
    const url = new URL(window.location.href)
    url.searchParams.set('_refresh', Date.now().toString())
    router.replace(url.pathname + url.search)
    
    // Method 3: Force a hard refresh as fallback after a delay
    setTimeout(() => {
      console.log('🔄 Hard refresh fallback')
      window.location.reload()
    }, 1000)
  }, [router])

  const softRefresh = useCallback(() => {
    console.log('🔄 Soft refreshing...')
    router.refresh()
  }, [router])

  return { forceRefresh, softRefresh }
}
