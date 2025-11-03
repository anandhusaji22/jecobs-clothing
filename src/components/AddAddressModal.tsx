'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import axios from 'axios'

interface AddAddressModalProps {
  userId: string
  onAddressAdded: () => void
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ userId, onAddressAdded }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNumber: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    } else if (!/^[a-zA-Z\s.-]+$/.test(formData.city.trim())) {
      newErrors.city = 'City should contain only letters, spaces, periods, and hyphens'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    } else if (formData.state.length < 2) {
      newErrors.state = 'State must be at least 2 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
      newErrors.state = 'State should contain only letters and spaces'
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required'
    } else if (!/^\d{6}$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = 'Invalid PIN code format (must be 6 digits, e.g., 560001)'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    } else if (formData.country.length < 2) {
      newErrors.country = 'Country must be at least 2 characters'
    }

    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Invalid phone number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await axios.post('/api/user/addresses', {
        userId,
        name: formData.name.trim(),
        fullName: formData.fullName.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined
      })
      
      setFormData({
        name: '',
        fullName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        phoneNumber: ''
      })
      setErrors({})
      setOpen(false)
      onAddressAdded()
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Failed to add address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="ml-2 px-2 py-1 h-8"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>
            Save a delivery address for future orders.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Address Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Home, Office, Church"
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
              className={errors.fullName ? 'border-red-500' : ''}
              required
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="Plot No. 123, MG Road, Sector 5"
              className={errors.street ? 'border-red-500' : ''}
              required
            />
            {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Bangalore"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Karnataka"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">PIN Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="560001"
                maxLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="India"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAddressModal