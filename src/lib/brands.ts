// Brand Management System
// This handles the brand list for campaign creation

export interface Brand {
  id: string
  name: string
  created_at?: string
}

// Default brands - empty list, only user-added brands will show
export const DEFAULT_BRANDS: Brand[] = []

// Local storage key for brands
const BRANDS_STORAGE_KEY = 'campaign-brands'

// Get brands from localStorage or return defaults
export function getBrands(): Brand[] {
  if (typeof window === 'undefined') return DEFAULT_BRANDS
  
  try {
    const stored = localStorage.getItem(BRANDS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : DEFAULT_BRANDS
    }
  } catch (error) {
    console.error('Error loading brands from localStorage:', error)
  }
  
  return DEFAULT_BRANDS
}

// Save brands to localStorage
export function saveBrands(brands: Brand[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands))
  } catch (error) {
    console.error('Error saving brands to localStorage:', error)
  }
}

// Add a new brand
export function addBrand(name: string): Brand[] {
  const brands = getBrands()
  const newBrand: Brand = {
    id: Date.now().toString(),
    name: name.trim(),
    created_at: new Date().toISOString()
  }
  
  const updatedBrands = [...brands, newBrand]
  saveBrands(updatedBrands)
  return updatedBrands
}

// Remove a brand
export function removeBrand(id: string): Brand[] {
  const brands = getBrands()
  const updatedBrands = brands.filter(brand => brand.id !== id)
  saveBrands(updatedBrands)
  return updatedBrands
}

// Update a brand
export function updateBrand(id: string, name: string): Brand[] {
  const brands = getBrands()
  const updatedBrands = brands.map(brand => 
    brand.id === id ? { ...brand, name: name.trim() } : brand
  )
  saveBrands(updatedBrands)
  return updatedBrands
}

// Reset brands to empty (removes all brands including defaults)
export function resetBrands(): Brand[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BRANDS_STORAGE_KEY)
  }
  return []
}

// Check if brands are using defaults vs user-added
export function hasUserBrands(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem(BRANDS_STORAGE_KEY)
    return !!stored
  } catch {
    return false
  }
}
