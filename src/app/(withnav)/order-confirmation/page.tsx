"use client"
import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import { auth } from '@/lib/firebase/config'

interface OrderDetails {
  _id: string
  productId: string
  productName: string
  productImage: string
  productDescription: string
  userId: string
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
  priceBreakdown: {
    basePrice: number
    normalSlotsCost: number
    emergencySlotsCost: number
    emergencyCharges: number
  }
  status: string
  paymentStatus: string
  razorpayOrderId: string
  razorpayPaymentId: string
  createdAt: string
}

function OrderConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useSelector((state: RootState) => state.user)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId')

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get Firebase ID token
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      const idToken = await currentUser.getIdToken()
      
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (response.data.success) {
        setOrderDetails(response.data.order)
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setError('Order not found')
        } else if (error.response?.status === 401) {
          setError('Please log in to view your order')
          router.push('/login')
          return
        } else {
          setError(`Failed to load order details: ${error.response?.data?.message || error.message}`)
        }
      } else {
        setError('Failed to load order details')
      }
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    // Wait for auth loading to complete
    if (user.authLoading) {
      return
    }

    if (!user.uid) {
      router.push('/login')
      return
    }

    if (!orderId) {
      router.push('/products')
      return
    }

    fetchOrderDetails()
  }, [user.uid, user.authLoading, orderId, router, fetchOrderDetails])

  if (loading || user.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
            <Button onClick={() => router.push('/')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTotalSlots = () => {
    return orderDetails.slotAllocation.reduce((total: number, allocation) => 
      total + allocation.normalSlotsUsed + allocation.emergencySlotsUsed, 0
    )
  }

  const getFormattedDates = (): Array<{date: string, slots: number, hasEmergency: boolean}> => {
    return orderDetails.slotAllocation.map((allocation) => ({
      date: format(new Date(allocation.date.date), 'MMM dd, yyyy'),
      slots: allocation.normalSlotsUsed + allocation.emergencySlotsUsed,
      hasEmergency: allocation.emergencySlotsUsed > 0
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-poppins">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600">
            Thank you for your order. We&apos;ll send you updates via email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex lg:flex-row flex-col items-start gap-4">
                  <div className="relative lg:w-20 w-full h-50 lg:h-20 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={orderDetails.productImage}
                      alt={orderDetails.productName}
                      fill
                      className="object-cover w-auto h-auto"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {orderDetails.productName}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Order Number:</span>
                        <p className="font-mono">#{orderDetails._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p>{orderDetails.quantity} pieces</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Slots:</span>
                        <p>{getTotalSlots()} slots</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status: </span>
                        <Badge variant="default">{orderDetails.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFormattedDates().map((dateInfo, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{dateInfo.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {dateInfo.slots} slots
                        </span>
                        {dateInfo.hasEmergency && (
                          <Badge variant="secondary" className="text-xs">
                            Emergency
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Payment Status:</span>
                    <div>
                      <Badge 
                        variant={orderDetails.paymentStatus === 'completed' ? 'default' : 'secondary'}
                      >
                        {orderDetails.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment ID:</span>
                    <p className="font-mono text-xs">
                      {orderDetails.razorpayPaymentId}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Order Date:</span>
                    <p>{format(new Date(orderDetails.createdAt), 'MMM dd, yyyy hh:mm a')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{orderDetails.priceBreakdown.basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Normal Slots Cost</span>
                  <span>₹{orderDetails.priceBreakdown.normalSlotsCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Slots Cost</span>
                  <span>₹{orderDetails.priceBreakdown.emergencySlotsCost}</span>
                </div>
                {orderDetails.priceBreakdown.emergencyCharges > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Emergency Slot Charges</span>
                    <span>+₹{orderDetails.priceBreakdown.emergencyCharges}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{orderDetails.totalPrice}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/')}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p className="mb-2">
                  If you have any questions about your order, feel free to contact us.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contactus">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}