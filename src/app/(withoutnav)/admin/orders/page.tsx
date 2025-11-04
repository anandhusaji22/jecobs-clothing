"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'
import { makeAuthenticatedRequest } from '@/lib/adminApi'

interface OrderItem {
  _id: string
  productName: string
  productImage: string
  productDescription: string
  quantity: number
  totalPrice: number
  deliveryAddress?: string
  size?: string
  material?: string
  clothesProvided?: string
  status: string
  paymentStatus: string
  createdAt: string
  slotAllocation: Array<{
    date: {
      date: string
      _id: string
    }
    normalSlotsUsed: number
    emergencySlotsUsed: number
  }>
  userFirebaseUid: string
  user?: {
    name: string
    email: string
    phoneNumber: string
  }
}

interface SavedSize {
  _id: string
  name: string
  category: string
  chest: number | string
  length: number | string
  shoulders: number | string
  sleeves: number | string
  neck: number | string
  waist: number | string
  backPleatLength?: number | string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrderSizeDetails, setSelectedOrderSizeDetails] = useState<SavedSize | null>(null)
  const [loadingSizeDetails, setLoadingSizeDetails] = useState(false)

  const applyFilters = useCallback(() => {
    let filtered = [...orders]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Filter by date (using UTC for timezone-safe comparison)
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      const filterYear = filterDate.getUTCFullYear()
      const filterMonth = filterDate.getUTCMonth()
      const filterDay = filterDate.getUTCDate()
      
      filtered = filtered.filter(order => {
        return order.slotAllocation.some(slot => {
          const slotDate = new Date(slot.date.date)
          return slotDate.getUTCFullYear() === filterYear &&
                 slotDate.getUTCMonth() === filterMonth &&
                 slotDate.getUTCDate() === filterDay
        })
      })
    }

    setFilteredOrders(filtered)
  }, [orders, statusFilter, dateFilter])

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getDaysUntilDelivery = (slotAllocation: OrderItem['slotAllocation']) => {
    if (!slotAllocation || slotAllocation.length === 0) return null
    
    const earliestDate = new Date(slotAllocation[0].date.date)
    const today = new Date()
    const diffTime = earliestDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const getUrgencyBadge = (order: OrderItem) => {
    const daysLeft = getDaysUntilDelivery(order.slotAllocation)
    
    if (daysLeft === null) return null
    
    // Don't show overdue or urgency badges for completed or cancelled orders
    if (['completed', 'cancelled'].includes(order.status.toLowerCase())) {
      return null
    }
    
    if (daysLeft < 0 && !['completed', 'cancelled'].includes(order.status.toLowerCase())) {
      return <Badge className="bg-red-500 text-white ml-2">Overdue</Badge>
    } else if (daysLeft <= 3 && order.status.toLowerCase() === 'pending') {
      return <Badge className="bg-yellow-500 text-white ml-2">{daysLeft} days left</Badge>
    } else if (daysLeft <= 5 && !['completed', 'cancelled'].includes(order.status.toLowerCase())) {
      return <Badge className="bg-orange-500 text-white ml-2">{daysLeft} days left</Badge>
    }
    
    return null
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await makeAuthenticatedRequest('/api/admin/orders')
      if (response.data.success) {
        setOrders(response.data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSizeDetails = async (userFirebaseUid: string, sizeName: string) => {
    try {
      setLoadingSizeDetails(true)
      setSelectedOrderSizeDetails(null)
      
      // First, get the user by firebaseUid to get their MongoDB _id
      const usersResponse = await makeAuthenticatedRequest('/api/admin/users')
      if (usersResponse.data.success) {
        const user = usersResponse.data.users.find((u: { firebaseUid: string }) => u.firebaseUid === userFirebaseUid)
        if (user && user._id) {
          // Fetch user details including saved sizes
          const userDetailsResponse = await makeAuthenticatedRequest(`/api/admin/users/${user._id}`)
          if (userDetailsResponse.data.success && userDetailsResponse.data.user.savedSizes) {
            // Find the size that matches the order's size name
            const matchingSize = userDetailsResponse.data.user.savedSizes.find(
              (size: SavedSize) => size.name === sizeName
            )
            if (matchingSize) {
              setSelectedOrderSizeDetails(matchingSize)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching size details:', error)
    } finally {
      setLoadingSizeDetails(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdateLoading(true)
      const response = await makeAuthenticatedRequest(`/api/admin/orders/${orderId}`, 'PUT', {
        status: newStatus
      })
      
      if (response.data.success) {
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        ))
        
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-500'
      case 'completed':
        return 'bg-green-500'
      case 'confirmed':
        return 'bg-blue-500'
      case 'in progress':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Helper function to format date using UTC components (timezone-safe)
  const formatDateUTC = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  // Helper function to format date with day name using UTC components
  const formatDateUTCWithDay = (dateString: string): string => {
    const date = new Date(dateString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getUTCDay()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const getDeliveryDates = (slotAllocation: OrderItem['slotAllocation']) => {
    return slotAllocation.map(slot => 
      formatDateUTC(slot.date.date)
    ).join(', ')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl lg:text-3xl font-bold">Orders Management</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 lg:p-6">
          <CardTitle className="text-base lg:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-end">
            <div className="flex-1">
              <label className="text-xs lg:text-sm font-medium text-gray-700 mb-2 block">
                Filter by Delivery Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs lg:text-sm font-medium text-gray-700 mb-2 block">
                Filter by Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              className="text-sm lg:text-base"
              onClick={() => {
                setDateFilter('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 lg:p-6">
          <CardTitle className="text-base lg:text-lg">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Order ID</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Customer</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Dress Type</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Delivery Date</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Status</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-semibold text-xs lg:text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <span className="font-mono text-xs lg:text-sm">#{order._id.slice(-6)}</span>
                    </td>
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <div>
                        <div className="font-medium text-xs lg:text-sm">{order.user?.name || 'N/A'}</div>
                        <div className="text-xs lg:text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <div>
                        <div className="font-medium text-xs lg:text-sm">{order.productName}</div>
                        <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                          <span className="text-xs lg:text-sm">{getDeliveryDates(order.slotAllocation)}</span>
                        </div>
                        {order.slotAllocation.length > 1 && (
                          <span className="text-xs text-blue-600 ml-4">
                            {order.slotAllocation.length} dates
                          </span>
                        )}
                        {getUrgencyBadge(order)}
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <Badge className={`${getStatusColor(order.status)} text-white text-xs`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-2 lg:py-3 px-2 lg:px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                        onClick={async () => {
                          setSelectedOrder(order)
                          setIsDialogOpen(true)
                          setSelectedOrderSizeDetails(null) // Reset size details
                          // Fetch size details for this order
                          if (order.size && order.userFirebaseUid) {
                            await fetchSizeDetails(order.userFirebaseUid, order.size)
                          }
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && orders.length > 0 && (
              <div className="text-center py-6 lg:py-8">
                <Package className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm lg:text-base">No orders match the current filters</p>
              </div>
            )}
            {orders.length === 0 && !loading && (
              <div className="text-center py-6 lg:py-8">
                <Package className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm lg:text-base">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          // Clear size details when dialog closes
          setSelectedOrderSizeDetails(null)
        }
      }}>
        <DialogContent className="max-w-2xl mx-4 lg:mx-auto font-poppins max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="text-xs lg:text-sm font-medium text-gray-500">Order ID</label>
                  <p className="font-mono text-sm lg:text-base">#{selectedOrder._id.slice(-6)}</p>
                </div>
                <div>
                  <label className="text-xs lg:text-sm font-medium text-gray-500">Order Date</label>
                  <p className="text-sm lg:text-base">{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">Customer Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 bg-gray-50 p-3 lg:p-4 rounded-lg">
                  <div>
                    <label className="text-xs lg:text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm lg:text-base">{selectedOrder.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs lg:text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm lg:text-base">{selectedOrder.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs lg:text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm lg:text-base">{selectedOrder.user?.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">Product Information</h3>
                <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                    {selectedOrder.productImage && (
                      <img 
                        src={selectedOrder.productImage} 
                        alt={selectedOrder.productName}
                        className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm lg:text-base">{selectedOrder.productName}</h4>
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">{selectedOrder.productDescription}</p>
                      
                      {/* Order Details Grid */}
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs lg:text-sm">
                          <div className="flex items-baseline gap-1">
                            <span className="text-gray-500">Quantity:</span>
                            <strong>{selectedOrder.quantity}</strong>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-gray-500">Total:</span>
                            <strong className="text-green-600">₹{selectedOrder.totalPrice}</strong>
                          </div>
                          {selectedOrder.material && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-gray-500">Material:</span>
                              <strong>{selectedOrder.material}</strong>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-gray-500">Clothes Provided:</span>
                            <strong className={selectedOrder.clothesProvided === 'yes' ? 'text-green-600' : 'text-blue-600'}>
                              {selectedOrder.clothesProvided === 'yes' ? 'Yes' : 'No'}
                            </strong>
                          </div>
                        </div>
                        
                        {/* Size/Measurements Section */}
                        {selectedOrder.size && (
                          <div className="bg-white border border-gray-200 rounded p-2 lg:p-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-xs lg:text-sm flex-shrink-0">📏 Size/Measurements:</span>
                                <div className="text-xs lg:text-sm">
                                  <strong className="text-blue-700">{selectedOrder.size}</strong>
                                  {selectedOrderSizeDetails && selectedOrderSizeDetails.category !== 'Unknown' && (
                                    <span className="ml-2 text-gray-500">({selectedOrderSizeDetails.category})</span>
                                  )}
                                  {loadingSizeDetails && (
                                    <p className="text-gray-400 text-xs mt-0.5">Loading measurements...</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Display actual measurements if available */}
                              {selectedOrderSizeDetails && !loadingSizeDetails && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Chest:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.chest}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Length:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.length}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Shoulders:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.shoulders}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Sleeves:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.sleeves}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Neck:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.neck}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                      <span className="font-medium text-gray-500">Waist:</span>
                                      <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.waist}</p>
                                    </div>
                                    {selectedOrderSizeDetails.backPleatLength && (
                                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                        <span className="font-medium text-gray-500">Back Pleat Length:</span>
                                        <p className="mt-0.5 font-semibold">{selectedOrderSizeDetails.backPleatLength}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {!selectedOrderSizeDetails && !loadingSizeDetails && (
                                <p className="text-gray-500 text-xs mt-1">
                                  (Size profile details not found)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm lg:text-base">Delivery Address</h3>
                  <div className="bg-blue-50 p-3 lg:p-4 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-700">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">Delivery Schedule</h3>
                <div className="bg-blue-50 p-2 lg:p-3 rounded-lg mb-2">
                  <p className="text-xs lg:text-sm text-blue-700">
                    <strong>Total Quantity: {selectedOrder.quantity}</strong> - Distributed across {selectedOrder.slotAllocation.length} date{selectedOrder.slotAllocation.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-2">
                  {selectedOrder.slotAllocation.map((slot, index) => {
                    const itemsOnThisDate = slot.normalSlotsUsed + slot.emergencySlotsUsed;
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                              <span className="font-semibold text-sm lg:text-base">
                                {formatDateUTCWithDay(slot.date.date)}
                              </span>
                            </div>
                            <div className="ml-6 lg:ml-7">
                              <div className="bg-white px-3 py-2 rounded border border-gray-200 inline-block">
                                <span className="text-sm lg:text-base font-bold text-green-700">
                                  {itemsOnThisDate} item{itemsOnThisDate !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">to be delivered</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6 lg:ml-0 text-xs lg:text-sm text-gray-600 space-y-1">
                            {slot.normalSlotsUsed > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>Normal Slots: <strong>{slot.normalSlotsUsed}</strong></span>
                              </div>
                            )}
                            {slot.emergencySlotsUsed > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span>Emergency Slots: <strong>{slot.emergencySlotsUsed}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">Update Order Status</h3>
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder._id, value)}
                    disabled={updateLoading}
                  >
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {updateLoading && (
                    <span className="text-xs lg:text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </div>

              <div className="pt-3 lg:pt-4 border-t">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                  <span className="font-medium text-sm lg:text-base">Payment Status:</span>
                  <Badge variant={selectedOrder.paymentStatus === 'completed' ? 'default' : 'secondary'} className="text-xs w-fit">
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdersPage
