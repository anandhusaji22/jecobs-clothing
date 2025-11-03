'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Trash2, MapPin, Phone, User } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface IUserAddress {
  _id: string;
  name: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
  createdAt: string;
}

const SavedAddressesPage = () => {
  const [addresses, setAddresses] = useState<IUserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<IUserAddress | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phoneNumber: ''
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

  const fetchAddresses = useCallback(async () => {
    if (!user.uid) return
    
    try {
      setLoading(true)
      const response = await axios.get(`/api/user/addresses?userId=${user.uid}`)
      if (response.data.success) {
        setAddresses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }, [user.uid])

  useEffect(() => {
    if (user.uid && user.isLoggedIn) {
      fetchAddresses()
    }
  }, [user.uid, user.isLoggedIn, fetchAddresses])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Address name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Address name must be at least 2 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Address name must be less than 50 characters'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name should contain only letters and spaces'
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required'
    } else if (formData.street.length < 5) {
      newErrors.street = 'Street address must be at least 5 characters'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    } else if (formData.city.length < 2) {
      newErrors.city = 'City must be at least 2 characters'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    } else if (formData.state.length < 2) {
      newErrors.state = 'State must be at least 2 characters'
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required'
    } else if (!/^\d{6}$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = 'Invalid PIN code format (must be 6 digits, e.g., 400001)'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    } else if (formData.country.length < 2) {
      newErrors.country = 'Country must be at least 2 characters'
    }

    if (formData.phoneNumber && !/^(\+91[\s\-]?)?[6-9]\d{9}$/.test(formData.phoneNumber.trim().replace(/[\s\-]/g, ''))) {
      newErrors.phoneNumber = 'Invalid phone number format (e.g., +91 98765 43210 or 9876543210)'
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
      const addressData = {
        userId: user.uid,
        name: formData.name.trim(),
        fullName: formData.fullName.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined
      }

      if (editingAddress) {
        await axios.put(`/api/user/addresses/${editingAddress._id}`, addressData)
      } else {
        await axios.post('/api/user/addresses', addressData)
      }
      
      resetForm()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Failed to save address. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phoneNumber: ''
    })
    setErrors({})
  }

  const handleEdit = (address: IUserAddress) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      fullName: address.fullName,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phoneNumber: address.phoneNumber || ''
    })
    setErrors({})
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    try {
      await axios.delete(`/api/user/addresses/${id}`)
      fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address. Please try again.')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await axios.put(`/api/user/addresses/${id}`, { isDefault: true })
      fetchAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('Failed to set as default. Please try again.')
    }
  }

  // Show loading while checking authentication
  if (user.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
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
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please log in to view your saved addresses.</p>
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
            <MapPin className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="lg:text-3xl text-lg font-bold text-gray-900">My Saved Addresses</h1>
              <p className="text-gray-600 lg:text-xl text-xs lg:block hidden">Manage your delivery addresses for easy ordering</p>
            </div>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="lg:w-4 lg:h-4 lg:mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
                <DialogDescription>
                  Save a new address for future orders.
                </DialogDescription>
              </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Address Name *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Home, Office, Church"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-fullName">Full Name *</Label>
                  <Input
                    id="add-fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-street">Street Address *</Label>
                  <Input
                    id="add-street"
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Plot No. 123, MG Road, Sector 5"
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-city">City *</Label>
                    <Input
                      id="add-city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Mumbai"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-state">State *</Label>
                    <Input
                      id="add-state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Maharashtra"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-zipCode">PIN Code *</Label>
                    <Input
                      id="add-zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="400001"
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                    {errors.zipCode && <p className="text-red-500 text-sm">{errors.zipCode}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-country">Country *</Label>
                    <Input
                      id="add-country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="India"
                      className={errors.country ? 'border-red-500' : ''}
                    />
                    {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-phoneNumber">Phone Number</Label>
                  <Input
                    id="add-phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
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
                    {formLoading ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved addresses yet</h3>
            <p className="text-gray-600 mb-6">Add your first address to make ordering easier.</p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <Card key={address._id} className="relative">
                {address.isDefault && (
                  <Badge className="absolute -top-2 -right-2 bg-green-100 text-green-800 border-green-200">
                    Default
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {address.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{address.fullName}</span>
                    </div>
                    <div className="text-gray-600">
                      {address.street}<br />
                      {address.city}, {address.state} {address.zipCode}<br />
                      {address.country}
                    </div>
                    {address.phoneNumber && (
                      <div className="flex items-center gap-2 pt-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{address.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(address)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {!address.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefault(address._id)}
                        className="flex-1"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(address._id)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>
                Update your saved address details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Address Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Home, Office, Church"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-street">Street Address *</Label>
                <Input
                  id="edit-street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Plot No. 123, MG Road, Sector 5"
                  className={errors.street ? 'border-red-500' : ''}
                />
                {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Delhi"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-state">State *</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Delhi"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">PIN Code *</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="110001"
                    className={errors.zipCode ? 'border-red-500' : ''}
                  />
                  {errors.zipCode && <p className="text-red-500 text-sm">{errors.zipCode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country *</Label>
                  <Input
                    id="edit-country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="India"
                    className={errors.country ? 'border-red-500' : ''}
                  />
                  {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsEditModalOpen(false)
                    setEditingAddress(null)
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Updating...' : 'Update Address'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default SavedAddressesPage