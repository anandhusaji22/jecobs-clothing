"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation';
import { IProduct } from '@/types/product';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productOrderSchema, ProductOrder } from '@/zodSchemas/productOrder'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import AddSizeModal from '@/components/AddSizeModal';
import { auth } from '@/lib/firebase/config';

interface IAvailableDate {
  _id: string;
  date: string;
  normalSlots: number;
  emergencySlots: number;
  emergencySlotCost?: number;
  isAvailable: boolean;
  normalBookedSlots: number;
  emergencyBookedSlots: number;
}

interface IUserSize {
  _id: string;
  name: string;
  measurements: {
    chest: string;
    length: string;
    shoulders: string;
    sleeves: string;
    neck: string;
    waist: string;
    backPleatLength: string;
  };
  isDefault: boolean;
}

function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [additionalDates, setAdditionalDates] = useState<Date[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [productLoading, setProductLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<IAvailableDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [userSizes, setUserSizes] = useState<IUserSize[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [slotTypeFilter, setSlotTypeFilter] = useState<'normal' | 'emergency'>('emergency');
  
  // Initialize currentMonth based on slot type
  const getInitialMonth = () => {
    const today = new Date();
    const emergencyMinDate = new Date(2025, 10, 1); // November 2025
    
    // Default to emergency (November 2025) or today if later
    if (today < emergencyMinDate) {
      return new Date(emergencyMinDate);
    }
    return new Date(today);
  };
  
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  
  // Get user from Redux to access saved sizes
  const user = useSelector((state: RootState) => state.user);

  // Helper function to compare dates by UTC components (timezone-safe)
  const datesMatch = (date1: Date, date2: Date): boolean => {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductOrder>({
    resolver: zodResolver(productOrderSchema),
    defaultValues: {
      size: '',
      clothesProvided: 'no', // Default to no, will be set automatically based on product
      quantity: 1
    }
  });

  const watchClothesProvided = watch('clothesProvided');

  useEffect(() => {
    const getProduct = async () => {
      setProductLoading(true);
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data.data);
        console.log('Product data:', response.data);
        console.log('Product showClothsProvided:', response.data.data?.showClothsProvided);
        
        // Automatically set clothesProvided based on product setting
        if (response.data.data?.showClothsProvided === false) {
          // If product doesn't allow cloths provided option, force it to "no"
          setValue('clothesProvided', 'no');
        } else {
          // If product allows cloths provided option, default to "no" but user can change
          setValue('clothesProvided', 'no');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setProductLoading(false);
      }
    }
    getProduct();
  }, [id, setValue]);

  // Available colors

  // Get available materials from product
  const materials = product?.pricing?.clothType?.materials?.filter(material => material.isAvailable) || [];

  // Fetch available dates from API
  useEffect(() => {
    const fetchAvailableDates = async () => {
      setLoadingDates(true);
      try {
        // First, cleanup past dates
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        
        await axios.delete('/api/admin/available-dates/cleanup', {
          data: { beforeDate: yesterday.toISOString() }
        });
        
        // Then fetch current month data
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const response = await axios.get(`/api/available-dates?month=${month}&year=${year}`);
        if (response.data.success) {
          setAvailableDates(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      } finally {
        setLoadingDates(false);
      }
    };
    fetchAvailableDates();
  }, [currentMonth]);

  // Fetch user sizes (only when logged in; stop "Loading sizes..." when not)
  useEffect(() => {
    if (!user.uid) {
      setLoadingSizes(false);
      setUserSizes([]);
      return;
    }
    let cancelled = false;
    setLoadingSizes(true);
    const fetchUserSizes = async () => {
      try {
        const response = await axios.get(`/api/user/sizes?userId=${user.uid}`);
        if (cancelled) return;
        if (response.data?.success && Array.isArray(response.data.data)) {
          setUserSizes(response.data.data);
        } else {
          setUserSizes([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching user sizes:', error);
          setUserSizes([]);
        }
      } finally {
        if (!cancelled) setLoadingSizes(false);
      }
    };
    fetchUserSizes();
    return () => { cancelled = true; };
  }, [user.uid]);

  // Update currentMonth when slot type filter changes
  useEffect(() => {
    const today = new Date();
    const normalMinDate = new Date(2026, 1, 1); // February 2026
    const emergencyMinDate = new Date(2025, 10, 1); // November 2025
    
    let minDate: Date;
    if (slotTypeFilter === 'normal') {
      minDate = normalMinDate;
    } else {
      minDate = emergencyMinDate;
    }
    
    // If current month is before minimum date for this slot type, jump to minimum
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    if (currentMonthStart < minMonthStart) {
      setCurrentMonth(new Date(minDate));
    }
    // If current month is before today, jump to today (or min date if today is before min)
    else if (currentMonthStart < new Date(today.getFullYear(), today.getMonth(), 1)) {
      const targetDate = today > minDate ? today : minDate;
      setCurrentMonth(new Date(targetDate));
    }
  }, [slotTypeFilter, currentMonth]);

  // Refresh functions for modals
  const refreshSizes = async () => {
    if (!user.uid) return;
    try {
      const response = await axios.get(`/api/user/sizes?userId=${user.uid}`);
      if (response.data.success) {
        setUserSizes(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing sizes:', error);
    }
  };

  const onSubmit: SubmitHandler<ProductOrder> = async (data) => {
    // Validate that we have enough slots for the quantity
    const totalSlots = getTotalSelectedSlots();
    if (totalSlots < quantity) {
      alert(`Insufficient slots selected. You need ${quantity - totalSlots} more slots for quantity ${quantity}.`);
      return;
    }

    if (!product) {
      alert('Product information not available. Please refresh the page.');
      return;
    }

    if (!user.uid) {
      alert('Please login to add items to cart.');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const allocation = calculateSlotAllocation(quantity);
      const priceInfo = calculateTotalPrice(quantity);
      
      // Calculate emergency slot costs
      let emergencySlotsCost = 0;
      let emergencyCharges = 0;
      allocation.forEach(item => {
        const emergencySlotCost = item.date.emergencySlotCost || 0;
        emergencySlotsCost += item.emergencySlotsUsed * (priceInfo.basePrice + emergencySlotCost);
        emergencyCharges += item.emergencySlotsUsed * emergencySlotCost;
      });

      const cartItem = {
        productId: id as string,
        productName: product.name,
        productImage: product.images[0],
        productDescription: product.description,
        quantity: quantity,
        size: data.size,
        material: data.material,
        clothesProvided: data.clothesProvided,
        specialNotes: data.specialNotes || '',
        selectedDates: [selectedDate, ...additionalDates].filter(Boolean).map(d => d!.toISOString()),
        normalSlotsTotal: priceInfo.normalSlotsTotal,
        emergencySlotsTotal: priceInfo.emergencySlotsTotal,
        basePrice: priceInfo.basePrice,
        normalSlotsCost: priceInfo.normalSlotsTotal * priceInfo.basePrice,
        emergencySlotsCost: emergencySlotsCost,
        emergencyCharges: emergencyCharges,
        totalPrice: priceInfo.totalPrice
      };

      // Get Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Authentication error. Please login again.');
        router.push('/login');
        return;
      }

      // Add item to cart via API
      const response = await axios.post('/api/cart', { item: cartItem }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert('Item added to cart successfully!');
        router.push('/cart');
      } else {
        alert('Failed to add item to cart. Please try again.');
      }

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (dateData: IAvailableDate) => {
    // Normalize date to UTC midnight to avoid timezone issues
    // This ensures the selected date matches exactly with how we match dates in the calendar
    const dbDate = new Date(dateData.date);
    const selectedDateObj = new Date(Date.UTC(
      dbDate.getUTCFullYear(),
      dbDate.getUTCMonth(),
      dbDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const availableSlots = getAvailableSlots(dateData);
    
    // Check if this date is already the primary date - clicking again removes it
    if (selectedDate && datesMatch(selectedDate, selectedDateObj)) {
      // Remove primary date
      setSelectedDate(undefined);
      setValue('availableDate', null as unknown as Date);
      
      // If there are additional dates, promote the first one to primary
      if (additionalDates.length > 0) {
        const newPrimary = additionalDates[0];
        const remainingAdditional = additionalDates.slice(1);
        setSelectedDate(newPrimary);
        setValue('availableDate', newPrimary);
        setAdditionalDates(remainingAdditional);
        setValue('additionalDates', remainingAdditional);
      }
      return;
    }
    
    // Check if this date is already in additional dates - clicking again removes it
    const additionalIndex = additionalDates.findIndex(date => 
      datesMatch(date, selectedDateObj)
    );
    
    if (additionalIndex !== -1) {
      // Remove from additional dates
      const newAdditionalDates = additionalDates.filter((_, i) => i !== additionalIndex);
      setAdditionalDates(newAdditionalDates);
      setValue('additionalDates', newAdditionalDates);
      return;
    }
    
    // If no primary date selected yet, set as primary
    if (!selectedDate) {
      setSelectedDate(selectedDateObj);
      setValue('availableDate', selectedDateObj);
      
      // Check if we need additional dates for the quantity
      if (quantity > availableSlots) {
        const remainingQuantity = quantity - availableSlots;
        const message = `Selected date has only ${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available. You need ${remainingQuantity} more slot${remainingQuantity !== 1 ? 's' : ''} for quantity ${quantity}. Please select additional dates.`;
        alert(message);
      }
    } else {
      // Primary date exists, add this as additional date if we need more slots
      const currentMainSlots = getAvailableSlots(availableDates.find(d => {
        const dbDate = new Date(d.date);
        return datesMatch(dbDate, selectedDate);
      }) || dateData);
      
      const currentAdditionalSlots = additionalDates.reduce((total, date) => {
        const foundDateData = availableDates.find(d => {
          const dbDate = new Date(d.date);
          return datesMatch(dbDate, date);
        });
        return total + (foundDateData ? getAvailableSlots(foundDateData) : 0);
      }, 0);
      
      const totalCurrentSlots = currentMainSlots + currentAdditionalSlots;
      
      if (totalCurrentSlots < quantity) {
        const newAdditionalDates = [...additionalDates, selectedDateObj];
        setAdditionalDates(newAdditionalDates);
        setValue('additionalDates', newAdditionalDates);
        
        const newTotalSlots = totalCurrentSlots + availableSlots;
        if (newTotalSlots >= quantity) {
          alert(`Great! You now have enough slots (${newTotalSlots}) for your quantity (${quantity}).`);
        }
      } else {
        alert(`You already have enough slots (${totalCurrentSlots}) for your quantity (${quantity}). No need to select more dates.`);
      }
    }
  };

  const getAvailableSlots = (dateData: IAvailableDate) => {
    if (slotTypeFilter === 'normal') {
      return dateData.normalSlots - dateData.normalBookedSlots;
    } else if (slotTypeFilter === 'emergency') {
      return dateData.emergencySlots - dateData.emergencyBookedSlots;
    }
    // 'all' - return total available slots
    const totalSlots = dateData.normalSlots + dateData.emergencySlots;
    const bookedSlots = dateData.normalBookedSlots + dateData.emergencyBookedSlots;
    return totalSlots - bookedSlots;
  };

  const isDateAvailable = (dateData: IAvailableDate) => {
    if (!dateData.isAvailable) return false;
    
    if (slotTypeFilter === 'normal') {
      return (dateData.normalSlots - dateData.normalBookedSlots) > 0;
    } else if (slotTypeFilter === 'emergency') {
      return (dateData.emergencySlots - dateData.emergencyBookedSlots) > 0;
    }
    // 'all' - check if any slots available
    return getAvailableSlots(dateData) > 0;
  };

  const getTotalSelectedSlots = () => {
    let totalSlots = 0;
    
    if (selectedDate) {
      const mainDateData = availableDates.find(d => {
        const dbDate = new Date(d.date);
        return datesMatch(dbDate, selectedDate);
      });
      if (mainDateData) {
        totalSlots += getAvailableSlots(mainDateData);
      }
    }
    
    additionalDates.forEach(date => {
      const dateData = availableDates.find(d => {
        const dbDate = new Date(d.date);
        return datesMatch(dbDate, date);
      });
      if (dateData) {
        totalSlots += getAvailableSlots(dateData);
      }
    });
    
    return totalSlots;
  };

  // Calculate slot allocation based on selected slot type
  const calculateSlotAllocation = (requestedQuantity: number) => {
    const allSelectedDates = [];
    
    // Add primary date first
    if (selectedDate) {
      const mainDateData = availableDates.find(d => {
        const dbDate = new Date(d.date);
        return datesMatch(dbDate, selectedDate);
      });
      if (mainDateData) {
        allSelectedDates.push(mainDateData);
      }
    }
    
    // Add additional dates
    additionalDates.forEach(date => {
      const dateData = availableDates.find(d => {
        const dbDate = new Date(d.date);
        return datesMatch(dbDate, date);
      });
      if (dateData) {
        allSelectedDates.push(dateData);
      }
    });

    const allocation: Array<{
      date: IAvailableDate;
      normalSlotsUsed: number;
      emergencySlotsUsed: number;
      totalSlotsUsed: number;
    }> = [];

    let remainingQuantity = requestedQuantity;

    // Allocate based on selected slot type filter
    if (slotTypeFilter === 'normal') {
      // ONLY use normal slots
      for (const dateData of allSelectedDates) {
        if (remainingQuantity <= 0) break;
        
        const availableNormalSlots = dateData.normalSlots - dateData.normalBookedSlots;
        const normalSlotsToUse = Math.min(remainingQuantity, availableNormalSlots);
        
        allocation.push({
          date: dateData,
          normalSlotsUsed: normalSlotsToUse,
          emergencySlotsUsed: 0,
          totalSlotsUsed: normalSlotsToUse
        });
        
        remainingQuantity -= normalSlotsToUse;
      }
    } else if (slotTypeFilter === 'emergency') {
      // ONLY use emergency slots
      for (const dateData of allSelectedDates) {
        if (remainingQuantity <= 0) break;
        
        const availableEmergencySlots = dateData.emergencySlots - dateData.emergencyBookedSlots;
        const emergencySlotsToUse = Math.min(remainingQuantity, availableEmergencySlots);
        
        allocation.push({
          date: dateData,
          normalSlotsUsed: 0,
          emergencySlotsUsed: emergencySlotsToUse,
          totalSlotsUsed: emergencySlotsToUse
        });
        
        remainingQuantity -= emergencySlotsToUse;
      }
    }

    return allocation;
  };

  // Calculate total price based on slot allocation
  const calculateTotalPrice = (requestedQuantity: number) => {
    if (!product?.pricing) {
      return {
        totalPrice: 0,
        normalSlotsTotal: 0,
        emergencySlotsTotal: 0,
        basePrice: 0,
        allocation: []
      };
    }

    const allocation = calculateSlotAllocation(requestedQuantity);
    
    let basePrice = product.pricing.basePrice || 0;
    
    // Add material cost when user chose "no" for clothes provided
    if (watchClothesProvided === 'no' && watch('material')) {
      const selectedMaterial = materials.find(m => m.name === watch('material'));
      if (selectedMaterial) {
        basePrice += selectedMaterial.additionalCost;
      }
    }
    
    // Apply discount when user chose "yes" for clothes provided
    if (watchClothesProvided === 'yes' && product.pricing.clothProvidedDiscount > 0) {
      if (product.pricing.clothProvidedDiscount <= 1) {
        // Percentage discount
        basePrice = basePrice * (1 - product.pricing.clothProvidedDiscount);
      } else {
        // Fixed amount discount
        basePrice = Math.max(0, basePrice - product.pricing.clothProvidedDiscount);
      }
    }

    let totalPrice = 0;
    let normalSlotsTotal = 0;
    let emergencySlotsTotal = 0;

    // Calculate pricing for each date allocation separately
    // to account for different emergency slot costs per date
    allocation.forEach(item => {
      normalSlotsTotal += item.normalSlotsUsed;
      emergencySlotsTotal += item.emergencySlotsUsed;
      
      // Add normal slots cost
      totalPrice += item.normalSlotsUsed * basePrice;
      
      // Add emergency slots cost (basePrice + emergency cost for this specific date)
      const emergencySlotCost = item.date.emergencySlotCost || 0;
      totalPrice += item.emergencySlotsUsed * (basePrice + emergencySlotCost);
    });

    return {
      totalPrice,
      normalSlotsTotal,
      emergencySlotsTotal,
      basePrice,
      allocation
    };
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    setValue('quantity', newQuantity);
    
    // Check if current selected dates can accommodate the new quantity
    const totalSlots = getTotalSelectedSlots();
    
    if (selectedDate && newQuantity > totalSlots) {
      const remainingQuantity = newQuantity - totalSlots;
      alert(`You need ${remainingQuantity} more slot${remainingQuantity !== 1 ? 's' : ''}. Please select additional dates.`);
    } else if (selectedDate && newQuantity <= totalSlots) {
      // If quantity is reduced and we have excess additional dates, keep only what's needed
      // This is optional - we can keep all selected dates for user convenience
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const normalMinDate = new Date(2026, 1, 1); // February 2026
    const emergencyMinDate = new Date(2025, 10, 1); // November 2025
    
    const minDate = slotTypeFilter === 'normal' ? normalMinDate : emergencyMinDate;
    const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
      // Don't go before minimum date for current slot type
      const newMonthStart = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
      if (newMonthStart < minMonthStart) {
        return; // Don't navigate if it would go before minimum
      }
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Show loading spinner while product is being loaded
  if (productLoading) {
    return (
      <div className='font-poppins lg:py-20'>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Loading product details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='font-poppins py-4 lg:py-20'>
      {product && (
        <div className="max-w-7xl mx-auto p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Product Image Gallery & Order Section - Left Side */}
            <div className="flex-shrink-0 space-y-4">
              {/* Main Image Display with Navigation */}
              <div className="relative w-full lg:w-[500px] h-[400px] lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden group">
                <Image 
                  src={`${product.images[currentImageIndex]}`} 
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows - Show only if multiple images */}
                {product.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === 0 ? product.images.length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === product.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery - Show only if multiple images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-black ring-2 ring-black' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image 
                        src={image} 
                        alt={`${product.name} thumbnail ${index + 1}`}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Product Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Denomination:</span> {product.denomination}</p>
                  {product.pricing?.clothType && (
                    <>
                      
                      {watch('material') && (
                        <p><span className="font-medium">Selected Material:</span> {watch('material')}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Form Container - Right Side */}
            <div className="flex-1">
              <form id="product-order-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">


                {/* Product Title & Price */}
              <div className="space-y-2 lg:space-y-3">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-base lg:text-2xl font-bold text-black">
                  Starting from ₹{product.pricing?.basePrice?.toFixed(2) || '0.00'}
                </p>
              </div>
                {/* Product Description */}
                <div className="space-y-2">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Description</h2>
                  <p className="text-sm lg:text-base text-gray-600 leading-relaxed">{product.description}</p>
                </div>
                

                {/* 1. Quantity Selection */}
                <div className="space-y-2">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    <Label className="text-sm lg:text-lg font-semibold lg:min-w-[120px]">Quantity :</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newQuantity = Math.max(1, quantity - 1);
                          handleQuantityChange(newQuantity);
                        }}
                        className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-sm lg:text-base"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <Input
                        {...register('quantity', { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            handleQuantityChange(newQuantity);
                          }
                        })}
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        className="w-12 lg:w-16 text-center text-sm lg:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newQuantity = Math.min(10, quantity + 1);
                          handleQuantityChange(newQuantity);
                        }}
                        className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-sm lg:text-base"
                        disabled={quantity >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {errors.quantity && <p className="text-red-500 text-xs lg:text-sm lg:ml-[136px]">{errors.quantity.message}</p>}
                  
                  {/* Multi-Date Selection Instructions */}
                  {quantity > 1 && (
                    <div className="lg:ml-[136px] bg-blue-50 p-2 lg:p-3 rounded-lg">
                      <p className="text-xs lg:text-sm text-blue-700">
                        💡 <strong>Multi-Date Selection:</strong> If a single date doesn&apos;t have enough slots for your quantity ({quantity}), 
                        you can select multiple dates. Click on additional dates after selecting your primary date.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Measurement (Size Selection) */}
                <div className="space-y-2">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    <Label className="text-sm lg:text-lg font-semibold lg:min-w-[120px]">Measurement :</Label>
                    <div className="flex flex-1 gap-2">
                      <Select
                          value={watch('size') ?? ''}
                          onValueChange={(value) => setValue('size', value)}
                          disabled={loadingSizes}
                        >
                        <SelectTrigger className="flex-1 text-sm lg:text-base">
                          <SelectValue placeholder={loadingSizes ? "Loading sizes..." : "Choose Measurement"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {userSizes.map((size) => (
                            <SelectItem key={size._id} value={size.name} className="max-w-[90vw] lg:max-w-none">
                              <div className="flex flex-col">
                                <span className="font-medium text-sm lg:text-base">{size.name}</span>
                                <span className="text-xs text-gray-500 break-words">
                                  Chest: {size.measurements.chest}, Length: {size.measurements.length}
                                  {size.measurements.shoulders && `, Shoulders: ${size.measurements.shoulders}`}
                                  {size.measurements.sleeves && `, Sleeves: ${size.measurements.sleeves}`}
                                  {size.measurements.neck && `, Neck: ${size.measurements.neck}`}
                                  {size.measurements.waist && `, Waist: ${size.measurements.waist}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {user.uid ? (
                        <AddSizeModal userId={user.uid} onSizeAdded={refreshSizes} />
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-2 px-2 py-1 h-8"
                          onClick={() => router.push('/login')}
                          title="Log in to add measurements"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.size && <p className="text-red-500 text-xs lg:text-sm lg:ml-[136px]">{errors.size.message}</p>}
                </div>

                {/* 3. Clothes Provided - Only show if product allows this option */}
                {product?.showClothsProvided === true && (
                <div className="space-y-2">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    <Label className="text-sm lg:text-lg font-semibold lg:min-w-[120px]">Clothes Provided :</Label>
                    <div className="flex gap-4 lg:gap-6">
                      <label className="flex items-center space-x-2">
                        <input
                          {...register('clothesProvided')}
                          type="radio"
                          value="yes"
                          className="w-3 h-3 lg:w-4 lg:h-4 text-black"
                        />
                        <span className="text-sm lg:text-lg">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          {...register('clothesProvided')}
                          type="radio"
                          value="no"
                          defaultChecked
                          className="w-3 h-3 lg:w-4 lg:h-4 text-black"
                        />
                        <span className="text-sm lg:text-lg">No</span>
                      </label>
                    </div>
                  </div>
                  {errors.clothesProvided && <p className="text-red-500 text-xs lg:text-sm lg:ml-[136px]">{errors.clothesProvided.message}</p>}
                </div>
                )}

                {/* 4. Material Selection - Show when user chose "no" */}
                {watchClothesProvided === 'no' && (
                  <div className="space-y-2">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                      <Label className="text-sm lg:text-lg font-semibold lg:min-w-[120px]">Material :</Label>
                      <Select onValueChange={(value) => setValue('material', value)}>
                        <SelectTrigger className="flex-1 text-sm lg:text-base">
                          <SelectValue placeholder="Choose Material" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {materials.map((material) => (
                            <SelectItem key={material.name} value={material.name} className="max-w-[90vw] lg:max-w-none">
                              <div className="flex flex-col">
                                <span className="font-medium text-sm lg:text-base">{material.name}</span>
                                <span className="text-xs text-gray-500">
                                  +₹{material.additionalCost.toFixed(2)} additional cost
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.material && <p className="text-red-500 text-xs lg:text-sm lg:ml-[136px]">{errors.material.message}</p>}
                  </div>
                )}

                {/* 5. Calendar (Available Dates) */}
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <Label className="text-sm lg:text-lg font-semibold">Available Dates :</Label>
                    {quantity > 1 && (
                      <div className="text-xs lg:text-sm text-blue-600 bg-blue-50 px-2 lg:px-3 py-1 rounded">
                        Select dates for {quantity} items
                      </div>
                    )}
                  </div>
                  
                  {/* Slot Type Filter Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Slot Type:</span>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        type="button"
                        onClick={() => setSlotTypeFilter('normal')}
                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                          slotTypeFilter === 'normal'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Normal Slots
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSlotTypeFilter('emergency')}
                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                          slotTypeFilter === 'emergency'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Emergency Slots
                      </Button>
                    </div>
                  </div>

                  {/* Instructions based on quantity and filter */}
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                    <p className="font-medium mb-1">📅 How to Select Dates:</p>
                    {quantity > 1 ? (
                      <>
                        <p>1. Use the buttons above to filter between Normal and Emergency slots</p>
                        <p>2. Click a date to select it (primary date shown in black)</p>
                        <p>3. Click additional dates if you need more slots (shown in blue)</p>
                        <p>4. Click any selected date again to remove it</p>
                      </>
                    ) : (
                      <>
                        <p>1. Use the buttons above to filter between Normal and Emergency slots</p>
                        <p>2. Click a date to select it</p>
                        <p>3. Click the selected date again to remove it and choose another</p>
                      </>
                    )}
                  </div>
                  
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      disabled={(() => {
                        const normalMinDate = new Date(2026, 1, 1);
                        const emergencyMinDate = new Date(2025, 10, 1);
                        const minDate = slotTypeFilter === 'normal' ? normalMinDate : emergencyMinDate;
                        const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                        const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                        return currentMonthStart <= minMonthStart;
                      })()}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold bg-black text-white px-4 py-1 rounded">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Slot Legend */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {slotTypeFilter === 'normal' && (
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            <span className="text-green-700">Showing Normal Slots Only</span>
                          </div>
                        )}
                        {slotTypeFilter === 'emergency' && (
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                            <span className="text-red-700">Showing Emergency Slots Only (Extra Cost)</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 ">
                        Click dates to select/remove
                      </div>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {loadingDates ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-2 text-center">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="lg:text-lg  text-[14px] font-medium text-gray-500 p-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar dates */}
                        {(() => {
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);
                          const daysInMonth = lastDay.getDate();
                          const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
                          
                          // Get today's date using UTC to avoid timezone issues
                          // This ensures consistent behavior across different server timezones (local vs Vercel UTC)
                          const now = new Date();
                          const todayYear = now.getUTCFullYear();
                          const todayMonth = now.getUTCMonth();
                          const todayDate = now.getUTCDate();
                          
                          // Minimum dates for slot types
                          const normalSlotsMinDate = new Date(2026, 1, 1); // February 1, 2026 (month is 0-indexed)
                          normalSlotsMinDate.setHours(0, 0, 0, 0);
                          
                          const emergencySlotsMinDate = new Date(2025, 10, 1); // November 1, 2025
                          emergencySlotsMinDate.setHours(0, 0, 0, 0);
                          
                          const calendarDays = [];
                          
                          // Helper function to compare dates by date components only (timezone-safe)
                          // Compares year, month, and day components directly
                          const isDateBefore = (dateYear: number, dateMonth: number, dateDay: number, 
                                               compareYear: number, compareMonth: number, compareDay: number): boolean => {
                            if (dateYear !== compareYear) return dateYear < compareYear;
                            if (dateMonth !== compareMonth) return dateMonth < compareMonth;
                            return dateDay < compareDay;
                          };
                          
                          // Add empty cells for days before the first day of the month
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            calendarDays.push(
                              <div key={`empty-${i}`} className="lg:h-20"></div>
                            );
                          }
                          
                          // Add days of the month
                          for (let date = 1; date <= daysInMonth; date++) {
                            const currentDate = new Date(year, month, date);
                            currentDate.setHours(0, 0, 0, 0);
                            
                            // Check if date is in the past using timezone-safe comparison
                            // Compare using UTC date components to avoid timezone mismatches
                            const isPastDate = isDateBefore(year, month, date, todayYear, todayMonth, todayDate);
                            
                            // Check if date is before minimum allowed date for selected slot type
                            let isBeforeMinDate = false;
                            if (slotTypeFilter === 'normal') {
                              isBeforeMinDate = currentDate < normalSlotsMinDate;
                            } else if (slotTypeFilter === 'emergency') {
                              isBeforeMinDate = currentDate < emergencySlotsMinDate;
                            }
                            
                            // Match dates using UTC methods to avoid timezone mismatches
                            // This ensures dates from MongoDB (stored in UTC) match correctly
                            const dateData = availableDates.find(d => {
                              const dbDate = new Date(d.date);
                              return dbDate.getUTCDate() === date &&
                                     dbDate.getUTCMonth() === month &&
                                     dbDate.getUTCFullYear() === year;
                            });
                            
                            // Date is available only if it's not in past, not before min date, and has available slots
                            const isAvailable = !isPastDate && !isBeforeMinDate && dateData && isDateAvailable(dateData);
                            // Use UTC methods for comparison to match how we match dates from database
                            const isSelected = selectedDate && 
                                             selectedDate.getUTCDate() === date &&
                                             selectedDate.getUTCMonth() === month &&
                                             selectedDate.getUTCFullYear() === year;
                            
                            const isAdditionalSelected = additionalDates.some(d => 
                              d.getUTCDate() === date && 
                              d.getUTCMonth() === month &&
                              d.getUTCFullYear() === year
                            );
                            
                            calendarDays.push(
                              <button
                                key={date}
                                type="button"
                                onClick={() => !isPastDate && !isBeforeMinDate && dateData && isAvailable && handleDateSelect(dateData)}
                                disabled={isPastDate || isBeforeMinDate || !isAvailable}
                                className={`lg:p-2 p-1 lg:text-lg text-xs rounded-md transition-colors flex flex-col items-center justify-center lg:h-20 ${
                                  isPastDate || isBeforeMinDate
                                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                    : isSelected
                                    ? 'bg-black/89 text-white' 
                                    : isAdditionalSelected
                                    ? 'bg-blue-500/50 text-white'
                                    : isAvailable
                                    ? 'text-black hover:bg-green-200' 
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                              >
                                <span className="font-medium">{date}</span>
                                {isPastDate ? (
                                  <span className="text-[10px] lg:text-xs text-gray-400 mt-1">Past</span>
                                ) : isBeforeMinDate ? (
                                  <span className="text-[10px] lg:text-xs text-gray-400 mt-1">N/A</span>
                                ) : (
                                  dateData && isAvailable && (
                                    <div className="text-xs mt-1 space-y-1">
                                      {/* Show slots based on filter */}
                                      {slotTypeFilter === 'normal' && (
                                        <div className="text-green-600 text-[10px]">
                                          {dateData.normalSlots - dateData.normalBookedSlots} slot{(dateData.normalSlots - dateData.normalBookedSlots) !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                      {slotTypeFilter === 'emergency' && (
                                        <div className="text-red-600 text-[10px]">
                                          {dateData.emergencySlots - dateData.emergencyBookedSlots} slot{(dateData.emergencySlots - dateData.emergencyBookedSlots) !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </button>
                            );
                          }
                          
                          return calendarDays;
                        })()}
                      </div>
                    )}
                  </div>
                  {errors.availableDate && <p className="text-red-500 text-sm">{errors.availableDate.message || 'Please select an available date'}</p>}
                  {!selectedDate && (
                    <p className="text-orange-500 text-sm">Please select a date to continue with your order</p>
                  )}
                  
                  {/* Selected Dates Summary */}
                  {selectedDate && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Selected Dates & Slots:</h4>
                      <div className="space-y-2">
                        {/* Main Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            📅 {format(selectedDate, 'MMM dd, yyyy')} (Primary)
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            {(() => {
                              const dateData = availableDates.find(d => {
                                const dbDate = new Date(d.date);
                                return datesMatch(dbDate, selectedDate);
                              });
                              return dateData ? `${getAvailableSlots(dateData)} slots` : '0 slots';
                            })()}
                          </span>
                        </div>
                        
                        {/* Additional Dates */}
                        {additionalDates.map((date, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">
                              📅 {format(date, 'MMM dd, yyyy')} (Additional)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 font-medium">
                                {(() => {
                                  const dateData = availableDates.find(d => {
                                    const dbDate = new Date(d.date);
                                    return datesMatch(dbDate, date);
                                  });
                                  return dateData ? `${getAvailableSlots(dateData)} slots` : '0 slots';
                                })()}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newAdditionalDates = additionalDates.filter((_, i) => i !== index);
                                  setAdditionalDates(newAdditionalDates);
                                  setValue('additionalDates', newAdditionalDates);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Summary */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-sm">Total Available Slots:</span>
                            <span className="text-sm text-blue-600">{getTotalSelectedSlots()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Required Quantity:</span>
                            <span className="text-sm text-gray-600">{quantity}</span>
                          </div>
                          {getTotalSelectedSlots() < quantity && (
                            <p className="text-red-500 text-xs mt-1">
                              ⚠️ Need {quantity - getTotalSelectedSlots()} more slots. Please select additional dates.
                            </p>
                          )}
                          {getTotalSelectedSlots() >= quantity && (
                            <p className="text-green-600 text-xs mt-1">
                              ✅ Sufficient slots selected for your order.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Special Notes */}
                <div className="space-y-2">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4">
                    <Label className="text-sm lg:text-lg font-semibold lg:min-w-[120px] lg:pt-2">Special Notes :</Label>
                    <Textarea
                      {...register('specialNotes')}
                      placeholder="Any special measurements or requests"
                      className="flex-1 h-12 lg:h-16 text-sm lg:text-lg resize-none"
                    />
                  </div>
                  {errors.specialNotes && <p className="text-red-500 text-xs lg:text-sm lg:ml-[136px]">{errors.specialNotes.message}</p>}
                </div>

                {/* Dynamic Pricing Section with Slot-based Pricing */}  
                {product && selectedDate && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h3 className="text-lg font-semibold">Order Summary</h3>
                    <div className="space-y-1">
                      {(() => {
                        const priceInfo = calculateTotalPrice(quantity);
                        console.log('Price calculation debug:', {
                          quantity,
                          priceInfo,
                          watchClothesProvided,
                          watchMaterial: watch('material')
                        });
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Base Price:</span>
                              <span>₹{product.pricing?.basePrice?.toFixed(2) || '0.00'}</span>
                            </div>
                            
                            {watchClothesProvided === 'no' && watch('material') && (
                              <div className="flex justify-between text-blue-600">
                                <span>Material ({watch('material')}):</span>
                                <span>
                                  +₹{materials.find(m => m.name === watch('material'))?.additionalCost?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            )}
                            
                            {watchClothesProvided === 'yes' && product.pricing?.clothProvidedDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Clothes Provided Discount:</span>
                                <span>
                                  -₹{product.pricing.clothProvidedDiscount <= 1 
                                    ? (product.pricing.basePrice * product.pricing.clothProvidedDiscount).toFixed(2)
                                    : product.pricing.clothProvidedDiscount.toFixed(2)
                                  }
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between font-medium border-t pt-2">
                              <span>Price per item:</span>
                              <span>₹{priceInfo.basePrice.toFixed(2)}</span>
                            </div>
                            
                            <hr className="border-gray-300" />
                            
                            {/* Slot Breakdown */}
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-medium text-sm mb-2">Slot Allocation (Quantity: {quantity})</h4>
                              
                              {priceInfo.normalSlotsTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    Normal Slots: {priceInfo.normalSlotsTotal}
                                  </span>
                                  <span>₹{(priceInfo.normalSlotsTotal * priceInfo.basePrice).toFixed(2)}</span>
                                </div>
                              )}
                              
                              {priceInfo.emergencySlotsTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="flex items-center">
                                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                    Emergency Slots: {priceInfo.emergencySlotsTotal}
                                  </span>
                                  <span>₹{(() => {
                                    // Calculate emergency slot cost based on each date's specific cost
                                    let emergencyCost = 0;
                                    priceInfo.allocation.forEach(item => {
                                      const emergencySlotCost = item.date.emergencySlotCost || 0;
                                      emergencyCost += item.emergencySlotsUsed * (priceInfo.basePrice + emergencySlotCost);
                                    });
                                    return emergencyCost.toFixed(2);
                                  })()}</span>
                                </div>
                              )}
                              
                              {priceInfo.emergencySlotsTotal > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  * Emergency slots include extra charges per slot (varies by date)
                                </div>
                              )}
                            </div>
                            
                            <hr className="border-gray-300" />
                            
                            {/* Manual Verification */}
                            <div className="bg-gray-100 p-2 rounded text-xs">
                              <div className="font-medium mb-1">Calculation Verification:</div>
                              <div>Normal: {priceInfo.normalSlotsTotal} × ₹{priceInfo.basePrice.toFixed(2)} = ₹{(priceInfo.normalSlotsTotal * priceInfo.basePrice).toFixed(2)}</div>
                              {priceInfo.emergencySlotsTotal > 0 && priceInfo.allocation.map((item, index) => 
                                item.emergencySlotsUsed > 0 && (
                                  <div key={index}>
                                    Emergency ({format(new Date(item.date.date), 'MMM dd')}): {item.emergencySlotsUsed} × ₹{(priceInfo.basePrice + (item.date.emergencySlotCost || 0)).toFixed(2)} = ₹{(item.emergencySlotsUsed * (priceInfo.basePrice + (item.date.emergencySlotCost || 0))).toFixed(2)}
                                  </div>
                                )
                              )}
                              <div className="border-t pt-1 mt-1">
                                Manual Total: ₹{(() => {
                                  let total = priceInfo.normalSlotsTotal * priceInfo.basePrice;
                                  priceInfo.allocation.forEach(item => {
                                    const emergencySlotCost = item.date.emergencySlotCost || 0;
                                    total += item.emergencySlotsUsed * (priceInfo.basePrice + emergencySlotCost);
                                  });
                                  return total.toFixed(2);
                                })()}
                              </div>
                            </div>
                            
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total Price:</span>
                              <span className="text-green-600">₹{priceInfo.totalPrice.toFixed(2)}</span>
                            </div>
                            
                            {/* Detailed breakdown by date */}
                            {priceInfo.allocation.length > 1 && (
                              <div className="mt-3 text-xs bg-blue-50 p-2 rounded">
                                <div className="font-medium mb-1">Date-wise Breakdown:</div>
                                {priceInfo.allocation.map((item, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{format(new Date(item.date.date), 'MMM dd')}: </span>
                                    <span>
                                      {item.normalSlotsUsed > 0 && `${item.normalSlotsUsed}N`}
                                      {item.normalSlotsUsed > 0 && item.emergencySlotsUsed > 0 && ' + '}
                                      {item.emergencySlotsUsed > 0 && `${item.emergencySlotsUsed}E`}
                                    </span>
                                  </div>
                                ))}
                                <div className="text-xs mt-1 text-gray-600">N=Normal, E=Emergency</div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    

                  </div>
                )}

                {/* Add to Cart Button - Shown after Total Price */}
                <div className="w-full">
                  <Button 
                    type="submit"
                    form="product-order-form"
                    className="w-full bg-black text-white hover:bg-gray-800 py-3 lg:py-6 text-base lg:text-lg font-semibold disabled:opacity-50"
                    disabled={
                      !selectedDate || 
                      productLoading || 
                      isLoading || 
                      getTotalSelectedSlots() < quantity ||
                      !user.uid
                    }
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding to Cart...
                      </div>
                    ) : productLoading ? (
                      'Loading...'
                    ) : getTotalSelectedSlots() < quantity ? (
                      `Need ${quantity - getTotalSelectedSlots()} More Slots`
                    ) : !selectedDate ? (
                      'Select Date First'
                    ) : !user.uid ? (
                      'Please Login'
                    ) : (
                      `Add to Cart (${quantity} item${quantity !== 1 ? 's' : ''})`
                    )}
                  </Button>
                  
                  {/* Slot Status Indicator */}
                  {selectedDate && (
                    <div className="text-center text-xs lg:text-sm text-gray-600 mt-2">
                      {getTotalSelectedSlots() >= quantity ? (
                        <span className="text-green-600">
                          ✅ Ready to order {quantity} item{quantity !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          ⚠️ Select {quantity - getTotalSelectedSlots()} more slot{(quantity - getTotalSelectedSlots()) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                

              </form>
            </div>
          </div>


        </div>
      )}  
    </div>
  )
}

export default Page