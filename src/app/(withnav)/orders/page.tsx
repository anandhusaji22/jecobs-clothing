"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import { auth } from '@/lib/firebase/config'

interface OrderItem {
  _id: string
  productId: string
  productName: string
  productImage: string
  productDescription: string
  quantity: number
  totalPrice: number
  slotAllocation: Array<{
    date: {
      _id: string
      date: string
      normalSlots: number
      emergencySlots: number
      isAvailable: boolean
      normalBookedSlots: number
      emergencyBookedSlots: number
    }
    normalSlotsUsed: number
    emergencySlotsUsed: number
    totalSlotsUsed: number
  }>
  status: string
  paymentStatus: string
  createdAt: string
}

export default function OrdersPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.user)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'placed' | 'cancelled'>('placed')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get Firebase ID token
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      const idToken = await currentUser.getIdToken()
      
      const response = await axios.get('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (response.data.success) {
        setOrders(response.data.orders || [])
      } else {
        setError('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Wait for auth loading to complete
    if (user.authLoading) {
      return
    }

    if (!user.uid) {
      router.push('/login')
      return
    }

    fetchOrders()
  }, [user.uid, user.authLoading, router, fetchOrders])

  // Helper function to format date using UTC components (timezone-safe)
  const formatDateUTC = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getFormattedDates = (slotAllocation: OrderItem['slotAllocation']) => {
    return slotAllocation.map((allocation) => ({
      date: formatDateUTC(allocation.date.date),
      slots: allocation.normalSlotsUsed + allocation.emergencySlotsUsed,
      hasEmergency: allocation.emergencySlotsUsed > 0
    }))
  }

  const getStatusDisplay = (status: string) => {
    if (status === 'completed') return 'Shipped'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Show loading while auth is being determined
  if (user.authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchOrders}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => 
    activeTab === 'placed' ? order.status !== 'cancelled' : order.status === 'cancelled'
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-poppins">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="lg:text-3xl text-xl font-bold text-gray-900 mb-2">My Orders</h1>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            onClick={() => setActiveTab('placed')}
            className={`px-6 py-3 font-medium lg:text-lg text-[15px] border-b-2 transition-colors ${
              activeTab === 'placed'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Placed
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 font-medium text-lg border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No {activeTab} orders found
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'placed' 
                    ? "You haven't placed any orders yet."
                    : "You don't have any cancelled orders."
                  }
                </p>
                {activeTab === 'placed' && (
                  <Button onClick={() => router.push('/products')}>
                    Start Shopping
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order._id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex lg:flex-row flex-col gap-6">
                    {/* Product Image */}
                    <div className="lg:w-32 lg:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={order.productImage}
                        alt={order.productName}
                        width={128}
                        height={128}
                        className="w-full h-full  object-cover"
                      />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex lg:flex-row flex-col justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {order.productName}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {order.productDescription}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusDisplay(order.status)}
                        </Badge>
                      </div>

                      {/* Price and Order Date */}
                      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-center mb-4">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{order.totalPrice}
                        </div>
                        <div className="lg:text-right lg:block flex gap-2">
                          <p className="text-sm text-gray-500">Order Date:</p>
                          <p className="font-semibold">
                            {format(new Date(order.createdAt), 'dd-MM-yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Dates */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Expected Completion:</p>
                        <div className="flex flex-wrap gap-2">
                          {getFormattedDates(order.slotAllocation).map((dateInfo, index) => (
                            <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">{dateInfo.date}</span>
                              {dateInfo.hasEmergency && (
                                <Badge variant="secondary" className="text-xs ml-1">
                                  Emergency
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/order-confirmation?orderId=${order._id}`)}
                          className="font-semibold"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}