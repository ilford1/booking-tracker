'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getBrands, addBrand, removeBrand, resetBrands, type Brand } from '@/lib/brands'
import { toast } from 'sonner'
import { Plus, X, Trash2 } from 'lucide-react'

export function BrandManager() {
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [newBrandName, setNewBrandName] = React.useState('')

  React.useEffect(() => {
    setBrands(getBrands())
  }, [])

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      const updatedBrands = addBrand(newBrandName)
      setBrands(updatedBrands)
      setNewBrandName('')
      toast.success('Brand added successfully!')
    }
  }

  const handleRemoveBrand = (id: string, name: string) => {
    const updatedBrands = removeBrand(id)
    setBrands(updatedBrands)
    toast.success(`${name} removed successfully!`)
  }

  const handleResetBrands = () => {
    const emptyBrands = resetBrands()
    setBrands(emptyBrands)
    toast.success('All brands cleared!')
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Brand Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Brand */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter brand name"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
          />
          <Button 
            onClick={handleAddBrand}
            disabled={!newBrandName.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>

        {/* Brand List */}
        {brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No brands added yet. Add your first brand above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Current Brands ({brands.length})</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetBrands}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Badge 
                  key={brand.id} 
                  variant="secondary" 
                  className="text-sm px-3 py-1 flex items-center gap-2"
                >
                  {brand.name}
                  <button
                    onClick={() => handleRemoveBrand(brand.id, brand.name)}
                    className="hover:text-red-600 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
