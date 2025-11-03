"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import axios from 'axios'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AddAddressModal from '@/components/AddAddressModal'
import { auth } from '@/lib/firebase/config'

interface ICartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  productDescription: string;
  quantity: number;
  size: string;
  material?: string;
  clothesProvided: 'yes' | 'no';
  specialNotes?: string;
  selectedDates: Date[];
  normalSlotsTotal: number;
  emergencySlotsTotal: number;
  basePrice: number;
  normalSlotsCost: number;
  emergencySlotsCost: number;
  emergencyCharges: number;
  totalPrice: number;
}

interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
  deliveryAddress?: string;
}

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
}

function CartPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const [cart, setCart] = useState<ICart | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAddresses, setUserAddresses] = useState<IUserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserAddresses = useCallback(async () => {
    try {
      const response = await axios.get(`/api/user/addresses?userId=${user.uid}`);
      if (response.data.success) {
        setUserAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user.uid]);

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (user.authLoading) return;
    
    if (!user.uid) {
      router.push('/login');
      return;
    }
    fetchCart();
    fetchUserAddresses();
  }, [user.uid, user.authLoading, router, fetchCart, fetchUserAddresses]);

  const refreshAddresses = async () => {
    try {
      const response = await axios.get(`/api/user/addresses?userId=${user.uid}`);
      if (response.data.success) {
        setUserAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing addresses:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      const response = await axios.delete(`/api/cart?itemId=${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data.data);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from cart');
    }
  };

  const handleUpdateAddress = async (addressId: string) => {
    try {
      const selectedAddress = userAddresses.find(addr => addr._id === addressId);
      if (!selectedAddress) return;

      const fullAddress = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}, ${selectedAddress.country}`;
      
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      const response = await axios.put('/api/cart', {
        deliveryAddress: fullAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data.data);
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update delivery address');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!cart.deliveryAddress) {
      alert('Please select a delivery address');
      return;
    }

    setProcessingCheckout(true);
    
    try {
      // Navigate to checkout page with cart data
      router.push('/checkout');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to proceed to checkout');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const getTotalAmount = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalItems = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 font-poppins">
        <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started</p>
        <Link href="/">
          <Button className="bg-black text-white hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 lg:px-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{getTotalItems()} items in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex lg:flex-row flex-col lg:gap-4 gap-2">
                  {/* Product Image */}
                  <div className="relative w-full h-[20rem] lg:w-32 lg:h-32 flex-shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg lg:text-xl font-semibold">{item.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.productDescription}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <p><span className="font-medium">Size:</span> {item.size}</p>
                        <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
                        {item.material && (
                          <p><span className="font-medium">Material:</span> {item.material}</p>
                        )}
                        <p><span className="font-medium">Cloths Provided:</span> {item.clothesProvided === 'yes' ? 'Yes' : 'No'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Delivery Dates:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.selectedDates.map((date, index) => {
                            // Helper function to format date using UTC components (timezone-safe)
                            const formatDateUTC = (dateInput: Date | string): string => {
                              const date = new Date(dateInput);
                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              const day = String(date.getUTCDate()).padStart(2, '0');
                              const month = monthNames[date.getUTCMonth()];
                              const year = date.getUTCFullYear();
                              return `${month} ${day}, ${year}`;
                            };
                            return (
                              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                {formatDateUTC(date)}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {item.specialNotes && (
                        <p className="text-gray-600">
                          <span className="font-medium">Notes:</span> {item.specialNotes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2">
                        {item.normalSlotsTotal > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {item.normalSlotsTotal} Normal Slots
                          </span>
                        )}
                        {item.emergencySlotsTotal > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            {item.emergencySlotsTotal} Emergency Slots
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Base: ₹{item.basePrice.toFixed(2)}</p>
                        {item.emergencyCharges > 0 && (
                          <p className="text-red-600">Emergency Charges: +₹{item.emergencyCharges.toFixed(2)}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold">₹{item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {/* Delivery Address Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Delivery Address</label>
                <div className="space-y-2">
                  <Select onValueChange={handleUpdateAddress} disabled={loadingAddresses}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingAddresses ? "Loading addresses..." : "Select Address"} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                      {userAddresses.map((address) => (
                        <SelectItem key={address._id} value={address._id} className="max-w-full">
                          <div className="flex flex-col max-w-full overflow-hidden">
                            <span className="font-medium truncate">{address.name}</span>
                            <span className="text-xs text-gray-500 break-words whitespace-normal">
                              {address.street}, {address.city}, {address.state} {address.zipCode}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AddAddressModal userId={user.uid} onAddressAdded={refreshAddresses} />
                </div>
                {cart.deliveryAddress && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">Selected Address:</p>
                    <p className="text-gray-600 break-words whitespace-normal">{cart.deliveryAddress}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Items</span>
                  <span>{getTotalItems()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={!cart.deliveryAddress || processingCheckout}
                className="w-full mt-6 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
              >
                {processingCheckout ? 'Processing...' : 'Proceed to Checkout'}
              </Button>

              <Link href="/">
                <Button variant="outline" className="w-full mt-3">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
