"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import axios from 'axios'
import { auth } from '@/lib/firebase/config'

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, callback: (response: unknown) => void) => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
  theme: {
    color: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

interface OrderData {
  productId?: string;
  productName?: string;
  productImage?: string;
  productDescription?: string;
  userId: string;
  quantity?: number;
  totalPrice?: number;
  slotAllocation?: Array<{
    date: {
      _id: string;
      date: string;
      normalSlots: number;
      emergencySlots: number;
      isAvailable: boolean;
      normalBookedSlots: number;
      emergencyBookedSlots: number;
    };
    normalSlotsUsed: number;
    emergencySlotsUsed: number;
    totalSlotsUsed: number;
  }>;
  normalSlotsTotal?: number;
  emergencySlotsTotal?: number;
  priceBreakdown?: {
    basePrice: number;
    normalSlotsCost: number;
    emergencySlotsCost: number;
    emergencyCharges: number;
  };
  selectedDates?: Date[];
  color?: string;
  size?: string;
  material?: string;
  specialNotes?: string;
  deliveryAddress?: string;
  clothesProvided?: string;
  deliveryMethod?: string;
  status?: string;
  // Cart-specific fields
  cart?: {
    items: Array<{
      productId: string;
      productName: string;
      productImage: string;
      productDescription: string;
      quantity: number;
      size: string;
      material?: string;
      clothesProvided: string;
      specialNotes?: string;
      selectedDates: Date[];
      normalSlotsTotal: number;
      emergencySlotsTotal: number;
      basePrice: number;
      normalSlotsCost: number;
      emergencySlotsCost: number;
      emergencyCharges: number;
      totalPrice: number;
    }>;
    deliveryAddress?: string;
  };
}

interface PaymentMethod {
  _id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  displayName: string;
  cardLast4?: string;
  cardBrand?: string;
  upiId?: string;
  bankName?: string;
  walletName?: string;
  isDefault: boolean;
  lastUsedAt?: Date;
}

export default function CheckoutPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.user)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)

  const getAuthHeaders = React.useCallback(async (): Promise<Record<string, string>> => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken()
      return { Authorization: `Bearer ${token}` }
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('firebaseToken') : null
    if (stored?.startsWith('email-') && user.uid) {
      return { Authorization: `Bearer ${stored}`, 'X-User-Id': user.uid }
    }
    throw new Error('User not authenticated')
  }, [user.uid])

  const fetchPaymentMethods = React.useCallback(async () => {
    if (user.authLoading || !user.uid) return
    
    setLoadingPaymentMethods(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get('/api/user/payment-methods', { headers })
      if (response.data.success) {
        setPaymentMethods(response.data.paymentMethods || [])
        // Auto-select default payment method
        const defaultMethod = response.data.paymentMethods?.find((method: PaymentMethod) => method.isDefault)
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod._id)
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      // Set empty array if there's an error
      setPaymentMethods([])
    } finally {
      setLoadingPaymentMethods(false)
    }
  }, [user.uid, user.authLoading, getAuthHeaders])

  useEffect(() => {
    // Wait for auth loading to complete
    if (user.authLoading) {
      return
    }

    // Check if user is authenticated
    if (!user.uid) {
      router.push('/login')
      return
    }

    // Fetch cart data from API
    const fetchCartData = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await axios.get('/api/cart', { headers })
        
        if (response.data.success && response.data.data) {
          const cart = response.data.data
          
          // Check if cart has items and delivery address
          if (!cart.items || cart.items.length === 0) {
            alert('Your cart is empty')
            router.push('/cart')
            return
          }
          
          if (!cart.deliveryAddress) {
            alert('Please select a delivery address in cart')
            router.push('/cart')
            return
          }
          
          // Store cart data for checkout
          setOrderData({
            cart: cart,
            userId: user.uid,
            deliveryAddress: cart.deliveryAddress
          })
        } else {
          alert('Failed to load cart data')
          router.push('/cart')
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
        if (error instanceof Error && error.message === 'User not authenticated') {
          router.push('/login')
        } else {
          alert('Failed to load cart data')
          router.push('/cart')
        }
      }
    }

    fetchCartData()

    // Fetch user's saved payment methods
    fetchPaymentMethods()

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [router, user.uid, user.authLoading, fetchPaymentMethods, getAuthHeaders])

  const handleConfirmOrder = async () => {
    if (!orderData) {
      alert('Order data not found. Please try again.')
      return
    }

    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const isCartCheckout = orderData.cart && orderData.cart.items && orderData.cart.items.length > 0;

      let response;
      try {
        if (isCartCheckout) {
          response = await axios.post('/api/orders/create-from-cart', {
            paymentMethodId: selectedPaymentMethod || null
          }, { headers });
        } else {
          response = await axios.post('/api/orders/create', {
            ...orderData,
            paymentMethodId: selectedPaymentMethod || null
          }, { headers });
        }
      } catch (error: unknown) {
        // Handle axios errors (400, 500, etc.)
        let errorMessage = 'Failed to create order';
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error || error.message || 'Failed to create order';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        alert(errorMessage);
        // If slot validation failed, redirect to cart so user can remove items
        if (errorMessage.includes('slots available') || errorMessage.includes('not available') || errorMessage.includes('Not enough')) {
          router.push('/cart');
        }
        setIsLoading(false);
        return;
      }

      // Handle slot availability errors
      if (!response.data.success) {
        const errorMessage = response.data.error || 'Failed to create order';
        alert(errorMessage);
        // If slot validation failed, redirect to cart so user can remove items
        if (errorMessage.includes('slots available') || errorMessage.includes('not available') || errorMessage.includes('Not enough')) {
          router.push('/cart');
        }
        setIsLoading(false);
        return;
      }

      if (response.data.success) {
        const { orderIds, orderId, razorpayOrderId, amount } = response.data.data
        const finalOrderIds = orderIds || [orderId]; // Support both cart and single order
        const isCartCheckout = Array.isArray(orderIds);

        // Initialize Razorpay
        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: amount * 100, // Amount in paise
          currency: 'INR',
          name: 'Jacob\'s Website',
          description: isCartCheckout ? `Cart Order (${finalOrderIds.length} items)` : `Order for ${orderData.productName || 'Product'}`,
          order_id: razorpayOrderId,
          handler: async (response: RazorpayResponse) => {
            try {
              const headers = await getAuthHeaders()
              const verifyEndpoint = isCartCheckout ? '/api/orders/verify-cart-payment' : '/api/orders/verify-payment';
              const verifyPayload = isCartCheckout ? {
                orderIds: finalOrderIds,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              } : {
                orderId: orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              };
              const verifyResponse = await axios.post(verifyEndpoint, verifyPayload, { headers })

              if (verifyResponse.data.success) {
                // Clear pending order from sessionStorage
                sessionStorage.removeItem('pendingOrder')
                
                // Redirect to order confirmation page
                const firstOrderId = isCartCheckout ? finalOrderIds[0] : orderId;
                router.push(`/order-confirmation?orderId=${firstOrderId}`)
              } else {
                alert('Payment verification failed. Please contact support.')
              }
            } catch (error) {
              console.error('Payment verification error:', error)
              alert('Payment verification failed. Please contact support.')
            }
          },
          prefill: {
            name: user.name || '',
            email: user.email || '',
            contact: user.phoneNumber || ''
          },
          theme: {
            color: '#000000'
          },
          modal: {
            ondismiss: async () => {
              try {
                const headers = await getAuthHeaders()
                if (isCartCheckout) {
                  await axios.post('/api/orders/payment-failed', {
                    orderIds: finalOrderIds,
                    error: 'Payment cancelled by user'
                  }, { headers });
                } else {
                  await axios.post('/api/orders/payment-failed', {
                    orderId: orderId,
                    error: 'Payment cancelled by user'
                  }, { headers });
                }
                alert('Payment cancelled. Your order has been cancelled.')
                router.push('/cart')
              } catch (error) {
                console.error('Error handling payment cancellation:', error)
              }
            }
          }
        }

        const rzp = new window.Razorpay(options)
        
        // Handle payment failure
        rzp.on('payment.failed', async (response: unknown) => {
          try {
            const paymentError = response as { error: { description: string } }
            const headers = await getAuthHeaders()
            if (isCartCheckout) {
              await axios.post('/api/orders/payment-failed', {
                orderIds: finalOrderIds,
                error: paymentError.error.description
              }, { headers });
            } else {
              await axios.post('/api/orders/payment-failed', {
                orderId: orderId,
                error: paymentError.error.description
              }, { headers });
            }
            alert(`Payment failed: ${paymentError.error.description}. Your order has been cancelled.`)
            router.push('/orders')
          } catch (error) {
            console.error('Error handling payment failure:', error)
          }
        })
        
        rzp.open()
      } else {
        alert('Failed to create order. Please try again.')
      }
    } catch (error) {
      console.error('Order creation error:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  // Show loading while auth is being determined
  if (user.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              {orderData.cart ? (
                <>
                  {orderData.cart.items.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={item.productImage || '/placeholder.png'}
                            alt={item.productName || 'Product'}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.productName}</h3>
                          <p className="text-sm text-gray-600">Qty: {item.quantity} | Size: {item.size}</p>
                          <p className="text-sm font-medium text-green-600">₹{item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Delivery Address */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Delivery Address:</h4>
                    <p className="text-sm text-gray-700">{orderData.cart.deliveryAddress}</p>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ₹{orderData.cart.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                // Legacy single order view
                <>
              {/* Product Details */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={orderData.productImage || '/placeholder.png'}
                    alt={orderData.productName || 'Product'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{orderData.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{orderData.productDescription}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{orderData.quantity} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{orderData.size}</span>
                </div>
                {orderData.material && (
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>{orderData.material}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Clothes Provided:</span>
                  <span>{orderData.clothesProvided === 'yes' ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Selected Dates */}
              <div>
                <h4 className="font-medium mb-2">Selected Dates:</h4>
                <div className="space-y-1 text-sm">
                  {orderData.selectedDates?.map((date, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{format(new Date(date), 'MMM dd, yyyy')}</span>
                      {index === 0 ? <span className="text-blue-600">(Primary)</span> : <span className="text-gray-500">(Additional)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot Breakdown */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Slot Allocation:</h4>
                {(orderData.normalSlotsTotal ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Normal Slots: {orderData.normalSlotsTotal}
                    </span>
                    <span>₹{orderData.priceBreakdown?.normalSlotsCost.toFixed(2)}</span>
                  </div>
                )}
                {(orderData.emergencySlotsTotal ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Emergency Slots: {orderData.emergencySlotsTotal}
                    </span>
                    <span>₹{orderData.priceBreakdown?.emergencySlotsCost.toFixed(2)}</span>
                  </div>
                )}
                {(orderData.emergencySlotsTotal ?? 0) > 0 && (
                  <div className="text-xs text-red-600">
                    * Emergency slots include extra charges per slot (varies by date)
                  </div>
                )}
              </div>

              {/* Total Price */}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Price:</span>
                  <span className="text-green-600">₹{orderData.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{orderData.deliveryAddress}</p>
              {orderData.specialNotes && (
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-1">Special Notes:</h4>
                  <p className="text-sm text-gray-600">{orderData.specialNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPaymentMethods ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                  <p className="text-sm">Loading payment methods...</p>
                </div>
              ) : paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method._id} value={method._id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.displayName}</span>
                            {method.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    You can also pay with a new method during checkout
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No saved payment methods</p>
                  <p className="text-xs text-gray-500 mt-1">You can add a payment method during checkout</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleConfirmOrder}
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white py-3 text-lg font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Confirm Order - ₹${
                      orderData.cart 
                        ? orderData.cart.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
                        : orderData.totalPrice?.toFixed(2) || '0.00'
                    }`
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center mt-2">
                By confirming this order, you agree to our terms and conditions.
                You will be redirected to Razorpay for secure payment.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}