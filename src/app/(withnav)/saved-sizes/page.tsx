'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Trash2, Ruler } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface IUserSize {
  _id: string;
  name: string;
  type: string;
  measurements: {
    chest: string;
    length: string;
    shoulders: string;
    sleeves: string;
    neck: string;
    waist: string;
    backPleatLength: string;
  };
  isDefault: boolean;
  createdAt: string;
}

const SavedSizesPage = () => {
  const [sizes, setSizes] = useState<IUserSize[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<IUserSize | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    chest: '',
    length: '',
    shoulders: '',
    sleeves: '',
    neck: '',
    waist: '',
    backPleatLength: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const user = useSelector((state: RootState) => state.user)
  const router = useRouter()

  // Check authentication on component mount
  useEffect(() => {
    if (!user.authLoading && !user.isLoggedIn) {
      router.push('/login')
      return
    }
  }, [user.isLoggedIn, user.authLoading, router])

  const fetchSizes = useCallback(async () => {
    if (!user.uid) return
    
    try {
      setLoading(true)
      const response = await axios.get(`/api/user/sizes?userId=${user.uid}`)
      if (response.data.success) {
        setSizes(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching sizes:', error)
    } finally {
      setLoading(false)
    }
  }, [user.uid])

  useEffect(() => {
    if (user.uid && user.isLoggedIn) {
      fetchSizes()
    }
  }, [user.uid, user.isLoggedIn, fetchSizes])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Size name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Size name must be at least 2 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Size name must be less than 50 characters'
    }

    if (!formData.chest.trim()) {
      newErrors.chest = 'Chest measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.chest.trim())) {
      newErrors.chest = 'Invalid chest measurement format (e.g., 42", 42 in, 42cm)'
    }

    if (!formData.length.trim()) {
      newErrors.length = 'Length measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.length.trim())) {
      newErrors.length = 'Invalid length measurement format (e.g., 50", 50 in, 50cm)'
    }

    if (!formData.shoulders.trim()) {
      newErrors.shoulders = 'Shoulders measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.shoulders.trim())) {
      newErrors.shoulders = 'Invalid shoulders measurement format (e.g., 18", 18 in, 46cm)'
    }

    if (!formData.sleeves.trim()) {
      newErrors.sleeves = 'Sleeves measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.sleeves.trim())) {
      newErrors.sleeves = 'Invalid sleeves measurement format (e.g., 24", 24 in, 61cm)'
    }

    if (!formData.neck.trim()) {
      newErrors.neck = 'Neck measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.neck.trim())) {
      newErrors.neck = 'Invalid neck measurement format (e.g., 15", 15 in, 38cm)'
    }

    if (!formData.waist.trim()) {
      newErrors.waist = 'Waist measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.waist.trim())) {
      newErrors.waist = 'Invalid waist measurement format (e.g., 32", 32 in, 81cm)'
    }

    if (!formData.backPleatLength.trim()) {
      newErrors.backPleatLength = 'Back pleat length measurement is required'
    } else if (!/^\d+(\.\d+)?['"]?\s*(in|inch|inches|cm)?$/i.test(formData.backPleatLength.trim())) {
      newErrors.backPleatLength = 'Invalid back pleat length measurement format (e.g., 8", 8 in, 20cm)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setFormLoading(true)
    
    try {
      const sizeData = {
        userId: user.uid,
        name: formData.name.trim(),
        type: editingSize?.type || 'general',
        measurements: {
          chest: formData.chest.trim(),
          length: formData.length.trim(),
          shoulders: formData.shoulders.trim(),
          sleeves: formData.sleeves.trim(),
          neck: formData.neck.trim(),
          waist: formData.waist.trim(),
          backPleatLength: formData.backPleatLength.trim()
        }
      }

      if (editingSize) {
        await axios.put(`/api/user/sizes/${editingSize._id}`, sizeData)
      } else {
        await axios.post('/api/user/sizes', sizeData)
      }
      
      resetForm()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setEditingSize(null)
      fetchSizes()
    } catch (error) {
      console.error('Error saving size:', error)
      alert('Failed to save size. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      chest: '',
      length: '',
      shoulders: '',
      sleeves: '',
      neck: '',
      waist: '',
      backPleatLength: ''
    })
    setErrors({})
  }

  const handleEdit = (size: IUserSize) => {
    setEditingSize(size)
    setFormData({
      name: size.name || '',
      chest: size.measurements.chest || '',
      length: size.measurements.length || '',
      shoulders: size.measurements.shoulders || '',
      sleeves: size.measurements.sleeves || '',
      neck: size.measurements.neck || '',
      waist: size.measurements.waist || '',
      backPleatLength: size.measurements.backPleatLength || ''
    })
    setErrors({})
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this size?')) return
    
    try {
      await axios.delete(`/api/user/sizes/${id}`)
      fetchSizes()
    } catch (error) {
      console.error('Error deleting size:', error)
      alert('Failed to delete size. Please try again.')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await axios.put(`/api/user/sizes/${id}`, { isDefault: true })
      fetchSizes()
    } catch (error) {
      console.error('Error setting default size:', error)
      alert('Failed to set as default. Please try again.')
    }
  }

  // Show loading while checking authentication
  if (user.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins">
        <div className="text-center">
          <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </div>
      </div>
    )
  }

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins">
        <div className="text-center">
          <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please log in to view your saved sizes.</p>
          <Button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Ruler className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="lg:text-3xl text-xl font-bold text-gray-900">My Saved Sizes</h1>
              <p className="text-gray-600 lg:text-xl text-xs lg:block hidden">Manage your measurement profiles for easy ordering</p>
            </div>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[95vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Size</DialogTitle>
                <DialogDescription>
                  Save your measurements for future orders.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 pr-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Size Name *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Regular, Sunday Best"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-chest">Chest *</Label>
                    <Input
                      id="add-chest"
                      value={formData.chest}
                      onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                      placeholder='42", 42cm, 42 in'
                      className={errors.chest ? 'border-red-500' : ''}
                      required
                    />
                    {errors.chest && <p className="text-red-500 text-sm">{errors.chest}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-length">Length *</Label>
                    <Input
                      id="add-length"
                      value={formData.length}
                      onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                      placeholder='50", 50cm, 50 in'
                      className={errors.length ? 'border-red-500' : ''}
                      required
                    />
                    {errors.length && <p className="text-red-500 text-sm">{errors.length}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-shoulders">Shoulders *</Label>
                    <Input
                      id="add-shoulders"
                      value={formData.shoulders}
                      onChange={(e) => setFormData(prev => ({ ...prev, shoulders: e.target.value }))}
                      placeholder='18", 18cm, 18 in'
                      className={errors.shoulders ? 'border-red-500' : ''}
                      required
                    />
                    {errors.shoulders && <p className="text-red-500 text-sm">{errors.shoulders}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-sleeves">Sleeves *</Label>
                    <Input
                      id="add-sleeves"
                      value={formData.sleeves}
                      onChange={(e) => setFormData(prev => ({ ...prev, sleeves: e.target.value }))}
                      placeholder='25", 25cm, 25 in'
                      className={errors.sleeves ? 'border-red-500' : ''}
                      required
                    />
                    {errors.sleeves && <p className="text-red-500 text-sm">{errors.sleeves}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-neck">Neck *</Label>
                    <Input
                      id="add-neck"
                      value={formData.neck}
                      onChange={(e) => setFormData(prev => ({ ...prev, neck: e.target.value }))}
                      placeholder='15", 15cm, 15 in'
                      className={errors.neck ? 'border-red-500' : ''}
                      required
                    />
                    {errors.neck && <p className="text-red-500 text-sm">{errors.neck}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-waist">Waist *</Label>
                    <Input
                      id="add-waist"
                      value={formData.waist}
                      onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                      placeholder='34", 34cm, 34 in'
                      className={errors.waist ? 'border-red-500' : ''}
                      required
                    />
                    {errors.waist && <p className="text-red-500 text-sm">{errors.waist}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-backPleatLength">Back Pleat Length *</Label>
                    <Input
                      id="add-backPleatLength"
                      value={formData.backPleatLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, backPleatLength: e.target.value }))}
                      placeholder='8", 8cm, 8 in'
                      className={errors.backPleatLength ? 'border-red-500' : ''}
                      required
                    />
                    {errors.backPleatLength && <p className="text-red-500 text-sm">{errors.backPleatLength}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsAddModalOpen(false)
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : 'Save Size'}
                  </Button>
                </div>
              </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : sizes.length === 0 ? (
          <div className="text-center py-12">
            <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved sizes yet</h3>
            <p className="text-gray-600 mb-6">Add your first size profile to make ordering easier.</p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Size
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sizes.map((size) => (
              <Card key={size._id} className="relative">
                {size.isDefault && (
                  <Badge className="absolute -top-2 -right-2 bg-green-100 text-green-800 border-green-200">
                    Default
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    {size.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 capitalize">{size.type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chest:</span>
                      <span className="font-medium">{size.measurements.chest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Length:</span>
                      <span className="font-medium">{size.measurements.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shoulders:</span>
                      <span className="font-medium">{size.measurements.shoulders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sleeves:</span>
                      <span className="font-medium">{size.measurements.sleeves}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Neck:</span>
                      <span className="font-medium">{size.measurements.neck}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waist:</span>
                      <span className="font-medium">{size.measurements.waist}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Back Pleat Length:</span>
                      <span className="font-medium">{size.measurements.backPleatLength}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(size)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {!size.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefault(size._id)}
                        className="flex-1"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(size._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md max-h-[95vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Size</DialogTitle>
              <DialogDescription>
                Update your measurement profile.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Size Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Regular, Sunday Best"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-chest">Chest *</Label>
                  <Input
                    id="edit-chest"
                    value={formData.chest}
                    onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                    placeholder='42", 42cm, 42 in'
                    className={errors.chest ? 'border-red-500' : ''}
                    required
                  />
                  {errors.chest && <p className="text-red-500 text-sm">{errors.chest}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-length">Length *</Label>
                  <Input
                    id="edit-length"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    placeholder='50", 50cm, 50 in'
                    className={errors.length ? 'border-red-500' : ''}
                    required
                  />
                  {errors.length && <p className="text-red-500 text-sm">{errors.length}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-shoulders">Shoulders *</Label>
                  <Input
                    id="edit-shoulders"
                    value={formData.shoulders}
                    onChange={(e) => setFormData(prev => ({ ...prev, shoulders: e.target.value }))}
                    placeholder='18", 18cm, 18 in'
                    className={errors.shoulders ? 'border-red-500' : ''}
                    required
                  />
                  {errors.shoulders && <p className="text-red-500 text-sm">{errors.shoulders}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-sleeves">Sleeves *</Label>
                  <Input
                    id="edit-sleeves"
                    value={formData.sleeves}
                    onChange={(e) => setFormData(prev => ({ ...prev, sleeves: e.target.value }))}
                    placeholder='25", 25cm, 25 in'
                    className={errors.sleeves ? 'border-red-500' : ''}
                    required
                  />
                  {errors.sleeves && <p className="text-red-500 text-sm">{errors.sleeves}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-neck">Neck *</Label>
                  <Input
                    id="edit-neck"
                    value={formData.neck}
                    onChange={(e) => setFormData(prev => ({ ...prev, neck: e.target.value }))}
                    placeholder='15", 15cm, 15 in'
                    className={errors.neck ? 'border-red-500' : ''}
                    required
                  />
                  {errors.neck && <p className="text-red-500 text-sm">{errors.neck}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-waist">Waist *</Label>
                  <Input
                    id="edit-waist"
                    value={formData.waist}
                    onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                    placeholder='34", 34cm, 34 in'
                    className={errors.waist ? 'border-red-500' : ''}
                    required
                  />
                  {errors.waist && <p className="text-red-500 text-sm">{errors.waist}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-backPleatLength">Back Pleat Length *</Label>
                  <Input
                    id="edit-backPleatLength"
                    value={formData.backPleatLength}
                    onChange={(e) => setFormData(prev => ({ ...prev, backPleatLength: e.target.value }))}
                    placeholder='8", 8cm, 8 in'
                    className={errors.backPleatLength ? 'border-red-500' : ''}
                    required
                  />
                  {errors.backPleatLength && <p className="text-red-500 text-sm">{errors.backPleatLength}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsEditModalOpen(false)
                    setEditingSize(null)
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Updating...' : 'Update Size'}
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default SavedSizesPage