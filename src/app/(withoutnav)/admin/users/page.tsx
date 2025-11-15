"use client"
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { makeAuthenticatedRequest } from '@/lib/adminApi'

interface UserItem {
  _id: string
  name: string
  email: string
  phoneNumber: string
  address: string
  orders: number
  firebaseUid: string
}

interface UserDetails {
  _id: string
  name: string
  email: string
  phoneNumber: string
  address: string
  savedSizes: Array<{
    _id: string
    name: string
    category: string
    chest: number | string
    length: number | string
    shoulders: number | string
    sleeves: number | string
    neck: number | string
    waist: number | string
    backPleatLength: number | string
  }>
  orderHistory: Array<{
    _id: string
    dressType: string
    deliveryDate: string
    status: string
    amount: number
  }>
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [savingSize, setSavingSize] = useState(false)
  const [sizeForm, setSizeForm] = useState({
    name: '',
    category: '',
    chest: '',
    length: '',
    shoulders: '',
    sleeves: '',
    neck: '',
    waist: '',
    backPleatLength: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await makeAuthenticatedRequest('/api/admin/users')
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      setDetailLoading(true)
      const response = await makeAuthenticatedRequest(`/api/admin/users/${userId}`)
      if (response.data.success) {
        setSelectedUser(response.data.user)
        setIsDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const resetSizeForm = () => {
    setSizeForm({
      name: '',
      category: '',
      chest: '',
      length: '',
      shoulders: '',
      sleeves: '',
      neck: '',
      waist: '',
      backPleatLength: ''
    })
    setSizeError(null)
  }

  const handleStartEdit = (size: UserDetails['savedSizes'][0]) => {
    setEditingSizeId(size._id)
    setSizeForm({
      name: size.name || '',
      category: size.category && size.category !== 'Unknown' ? size.category : '',
      chest: String(size.chest || ''),
      length: String(size.length || ''),
      shoulders: String(size.shoulders || ''),
      sleeves: String(size.sleeves || ''),
      neck: String(size.neck || ''),
      waist: String(size.waist || ''),
      backPleatLength: String(size.backPleatLength || '')
    })
    setSizeError(null)
  }

  const handleCancelEdit = () => {
    setEditingSizeId(null)
    resetSizeForm()
  }

  const handleSizeInputChange = (field: keyof typeof sizeForm, value: string) => {
    setSizeForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSize = async () => {
    if (!selectedUser || !editingSizeId) {
      return
    }

    const requiredFields: Array<keyof typeof sizeForm> = [
      'name',
      'chest',
      'length',
      'shoulders',
      'sleeves',
      'neck',
      'waist',
      'backPleatLength'
    ]

    const missingField = requiredFields.find((field) => !sizeForm[field].trim())

    if (missingField) {
      setSizeError(`Please provide a value for ${missingField}`)
      return
    }

    setSavingSize(true)

    try {
      await makeAuthenticatedRequest(
        `/api/admin/users/${selectedUser._id}`,
        'PUT',
        {
          sizeId: editingSizeId,
          name: sizeForm.name.trim(),
          category: sizeForm.category.trim() || undefined,
          measurements: {
            chest: sizeForm.chest.trim(),
            length: sizeForm.length.trim(),
            shoulders: sizeForm.shoulders.trim(),
            sleeves: sizeForm.sleeves.trim(),
            neck: sizeForm.neck.trim(),
            waist: sizeForm.waist.trim(),
            backPleatLength: sizeForm.backPleatLength.trim()
          }
        }
      )

      await fetchUserDetails(selectedUser._id)
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating size:', error)
      setSizeError('Failed to update measurements. Please try again.')
    } finally {
      setSavingSize(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white'
      case 'pending':
        return 'bg-yellow-500 text-white'
      case 'delivered':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] font-poppins p-4 lg:p-0">
        <div className="text-base lg:text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 text-xs lg:text-sm mt-1">Manage customer information and details</p>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Name
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Contact
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Email
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Address
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Orders
                  </div>
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-4 text-left">
                  <div className='bg-gray-200 w-max px-2 lg:px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold'>
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900 font-medium">{user.name}</td>
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">{user.phoneNumber}</td>
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">{user.email}</td>
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">{user.address}</td>
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">
                    <span className="inline-flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {user.orders}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 hover:text-gray-900 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                      onClick={() => fetchUserDetails(user._id)}
                      disabled={detailLoading}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {users.length === 0 && (
        <Card className="p-8 lg:p-12 text-center">
          <p className="text-gray-600 text-sm lg:text-base">No users found.</p>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-md lg:max-w-2xl font-poppins mx-4 lg:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">User Details</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name :</label>
                    <p className="text-sm">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact :</label>
                    <p className="text-sm">{selectedUser.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email :</label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address :</label>
                    <p className="text-sm">{selectedUser.address}</p>
                  </div>
                </div>
              </div>

              {/* Saved Sizes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-500">Saved Sizes :</label>
                </div>
                <div className="space-y-3">
                  {selectedUser.savedSizes.map((size) => (
                    <div key={size._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {editingSizeId === size._id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor={`size-name-${size._id}`} className="text-xs text-gray-500">Size Name</Label>
                              <Input
                                id={`size-name-${size._id}`}
                                value={sizeForm.name}
                                onChange={(e) => handleSizeInputChange('name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`size-category-${size._id}`} className="text-xs text-gray-500">Category (optional)</Label>
                              <Input
                                id={`size-category-${size._id}`}
                                value={sizeForm.category}
                                onChange={(e) => handleSizeInputChange('category', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(['chest','length','shoulders','sleeves','neck','waist','backPleatLength'] as const).map((field) => (
                              <div key={field} className="space-y-1.5">
                                <Label className="text-xs text-gray-500 capitalize">{field === 'backPleatLength' ? 'Back Pleat Length' : field}</Label>
                                <Input
                                  value={sizeForm[field]}
                                  onChange={(e) => handleSizeInputChange(field, e.target.value)}
                                  placeholder='e.g. 42"'
                                />
                              </div>
                            ))}
                          </div>
                          {sizeError && (
                            <p className="text-red-500 text-xs">{sizeError}</p>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={savingSize}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveSize}
                              disabled={savingSize}
                            >
                              {savingSize ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <span className="text-sm font-semibold text-gray-900">{size.name}</span>
                              {size.category !== 'Unknown' && (
                                <span className="ml-2 text-xs text-gray-500">({size.category})</span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleStartEdit(size)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Chest:</span>
                              <p className="mt-0.5 font-semibold">{size.chest}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Length:</span>
                              <p className="mt-0.5 font-semibold">{size.length}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Shoulders:</span>
                              <p className="mt-0.5 font-semibold">{size.shoulders}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Sleeves:</span>
                              <p className="mt-0.5 font-semibold">{size.sleeves}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Neck:</span>
                              <p className="mt-0.5 font-semibold">{size.neck}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Waist:</span>
                              <p className="mt-0.5 font-semibold">{size.waist}&quot;</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium text-gray-500">Back Pleat Length:</span>
                              <p className="mt-0.5 font-semibold">{size.backPleatLength}&quot;</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {selectedUser.savedSizes.length === 0 && (
                    <p className="text-sm text-gray-500">No saved sizes</p>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-3 block">Order History :</label>
                <div className="space-y-2">
                  {selectedUser.orderHistory.map((order) => (
                    <div key={order._id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-500">Dress Type:</span>
                          <p className="mt-0.5">{order.dressType}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Delivery Date:</span>
                          <p className="mt-0.5">{order.deliveryDate}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Status:</span>
                          <div className="mt-0.5">
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Amount:</span>
                          <p className="mt-0.5 font-semibold">₹{order.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedUser.orderHistory.length === 0 && (
                    <p className="text-sm text-gray-500">No order history</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersPage