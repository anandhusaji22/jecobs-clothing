"use client"
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-gray-900">{size.name}</span>
                        {size.category !== 'Unknown' && (
                          <span className="ml-2 text-xs text-gray-500">({size.category})</span>
                        )}
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