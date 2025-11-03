'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import axios from 'axios'

interface AddSizeModalProps {
  userId: string
  onSizeAdded: () => void
}

const AddSizeModal: React.FC<AddSizeModalProps> = ({ userId, onSizeAdded }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
      newErrors.length = 'Invalid length measurement format (e.g., 52", 52 in, 52cm)'
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

    setLoading(true)

    try {
      const sizeData = {
        userId,
        name: formData.name.trim(),
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

      await axios.post('/api/user/sizes', sizeData)
      
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
      setOpen(false)
      onSizeAdded()
    } catch (error) {
      console.error('Error adding size:', error)
      alert('Failed to add size. Please try again.')
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
          <DialogTitle>Add New Size</DialogTitle>
          <DialogDescription>
            Save your measurements for future orders.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Size Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., My Regular, Sunday Best"
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chest">Chest *</Label>
              <Input
                id="chest"
                value={formData.chest}
                onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                placeholder='42", 42in, 107cm'
                className={errors.chest ? 'border-red-500' : ''}
                required
              />
              {errors.chest && <p className="text-red-500 text-sm">{errors.chest}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length *</Label>
              <Input
                id="length"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                placeholder='52", 52in, 132cm'
                className={errors.length ? 'border-red-500' : ''}
                required
              />
              {errors.length && <p className="text-red-500 text-sm">{errors.length}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shoulders">Shoulders *</Label>
              <Input
                id="shoulders"
                value={formData.shoulders}
                onChange={(e) => setFormData(prev => ({ ...prev, shoulders: e.target.value }))}
                placeholder='18", 18in, 46cm'
                className={errors.shoulders ? 'border-red-500' : ''}
                required
              />
              {errors.shoulders && <p className="text-red-500 text-sm">{errors.shoulders}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleeves">Sleeves *</Label>
              <Input
                id="sleeves"
                value={formData.sleeves}
                onChange={(e) => setFormData(prev => ({ ...prev, sleeves: e.target.value }))}
                placeholder='24", 24in, 61cm'
                className={errors.sleeves ? 'border-red-500' : ''}
                required
              />
              {errors.sleeves && <p className="text-red-500 text-sm">{errors.sleeves}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neck">Neck *</Label>
              <Input
                id="neck"
                value={formData.neck}
                onChange={(e) => setFormData(prev => ({ ...prev, neck: e.target.value }))}
                placeholder='15", 15in, 38cm'
                className={errors.neck ? 'border-red-500' : ''}
                required
              />
              {errors.neck && <p className="text-red-500 text-sm">{errors.neck}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">Waist *</Label>
              <Input
                id="waist"
                value={formData.waist}
                onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                placeholder='32", 32in, 81cm'
                className={errors.waist ? 'border-red-500' : ''}
                required
              />
              {errors.waist && <p className="text-red-500 text-sm">{errors.waist}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backPleatLength">Back Pleat Length *</Label>
            <Input
              id="backPleatLength"
              value={formData.backPleatLength}
              onChange={(e) => setFormData(prev => ({ ...prev, backPleatLength: e.target.value }))}
              placeholder='8", 8in, 20cm'
              className={errors.backPleatLength ? 'border-red-500' : ''}
              required
            />
            {errors.backPleatLength && <p className="text-red-500 text-sm">{errors.backPleatLength}</p>}
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
              {loading ? 'Saving...' : 'Save Size'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddSizeModal