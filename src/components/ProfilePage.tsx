'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { 
  User, 
  Ruler, 
  MapPin, 
  CreditCard, 
  Edit2, 
  LogOut,
  Phone,
  Mail,
  Trash2,
  Smartphone,
  Building2,
  Wallet
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/app/store'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { clearUser, setUser } from '@/slices/userSlice'
import axios from 'axios'

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  denomination: string;
}

interface SavedPaymentMethod {
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

const ProfilePage = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phoneNumber: '',
    denomination: ''
  })
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phoneNumber: '',
    denomination: ''
  })
  const [savedPayments, setSavedPayments] = useState<SavedPaymentMethod[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isMobile, setIsMobile] = useState(false)

  const user = useSelector((state: RootState) => state.user)
  const dispatch = useDispatch()

  useEffect(() => {
    if (user.isLoggedIn) {
      const userData = {
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        denomination: user.denomination || ''
      }
      setProfileData(userData)
      setOriginalProfileData(userData)
    }
  }, [user])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (activeSection === 'payments' && isOpen) {
      fetchSavedPayments()
    }
  }, [activeSection, isOpen])

  const validateProfile = () => {
    const newErrors: Record<string, string> = {}

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (profileData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(profileData.name.trim())) {
      newErrors.name = 'Name should contain only letters and spaces'
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
      newErrors.email = 'Invalid email format'
    }

    if (profileData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(profileData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Invalid phone number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('firebaseToken')
      
      // Update user profile via API
      const response = await axios.put('/api/profile', {
        name: profileData.name.trim(),
        phoneNumber: profileData.phoneNumber.trim() || null,
        denomination: profileData.denomination
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        // Update Redux store
        dispatch(setUser({
          ...user,
          name: profileData.name.trim(),
          phoneNumber: profileData.phoneNumber.trim(),
          denomination: profileData.denomination
        }))
        
        setOriginalProfileData(profileData)
        setIsEditingProfile(false)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setProfileData(originalProfileData)
    setErrors({})
    setIsEditingProfile(false)
  }

  const fetchSavedPayments = async () => {
    setLoadingPayments(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return
      
      const idToken = await currentUser.getIdToken()
      const response = await axios.get('/api/user/payment-methods', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      if (response.data.success) {
        setSavedPayments(response.data.paymentMethods)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return
      
      const idToken = await currentUser.getIdToken()
      const response = await axios.delete(`/api/user/payment-methods?id=${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      
      if (response.data.success) {
        setSavedPayments(prev => prev.filter(p => p._id !== paymentId))
        alert('Payment method deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to delete payment method')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('firebaseToken')
      dispatch(clearUser())
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleNavigation = (sectionId: string, path?: string) => {
    if (isMobile && path) {
      // On mobile, always navigate to external pages for sizes, addresses, payments
      setIsOpen(false)
      window.location.href = path
    } else if (path && !isMobile) {
      // On desktop, navigate to external page
      setIsOpen(false)
      window.location.href = path  
    } else {
      // Stay within dialog (desktop behavior or profile/orders on mobile)
      setActiveSection(sectionId)
    }
  }

  // Different navigation items for mobile vs desktop
  const mobileNavItems = [
    { id: 'profile', label: 'Profile', icon: User },

  ]

  const desktopNavItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'sizes', label: 'Saved Size', icon: Ruler },
    { id: 'addresses', label: 'Saved Address', icon: MapPin },
    { id: 'payments', label: 'Saved Payments', icon: CreditCard }
  ]

  const sidebarItems = isMobile ? mobileNavItems : desktopNavItems

  const ProfileContent = () => (
    <div className="space-y-4 lg:space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Profile Information</h2>
        {!isEditingProfile ? (
          <Button onClick={() => setIsEditingProfile(true)} variant="outline" size="sm" className="sm:size-default">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="flex-1 sm:flex-none">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 lg:pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm lg:text-base">Name</Label>
              {isEditingProfile ? (
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className={`text-sm lg:text-base ${errors.name ? 'border-red-500' : ''}`}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm lg:text-base truncate">{profileData.name || 'Not set'}</span>
                </div>
              )}
              {errors.name && <p className="text-red-500 text-xs lg:text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm lg:text-base">Email</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm lg:text-base truncate flex-1">{profileData.email || 'Not set'}</span>
                <span className="text-xs text-gray-500 hidden sm:inline">(Cannot be changed)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm lg:text-base">Phone Number</Label>
              {isEditingProfile ? (
                <Input
                  id="phone"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className={`text-sm lg:text-base ${errors.phoneNumber ? 'border-red-500' : ''}`}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm lg:text-base truncate">{profileData.phoneNumber || 'Not set'}</span>
                </div>
              )}
              {errors.phoneNumber && <p className="text-red-500 text-xs lg:text-sm">{errors.phoneNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="denomination" className="text-sm lg:text-base">Denomination</Label>
              {isEditingProfile ? (
                <Select 
                  value={profileData.denomination} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, denomination: value }))}
                >
                  <SelectTrigger className="text-sm lg:text-base">
                    <SelectValue placeholder="Select your denomination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Orthodox & Jacobite">Orthodox & Jacobite</SelectItem>
                    <SelectItem value="Mar Thoma">Mar Thoma</SelectItem>
                    <SelectItem value="CSI">CSI</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-md bg-gray-50">
                  <span className="text-sm lg:text-base">{profileData.denomination || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 lg:pt-6 border-t">
        <Button onClick={handleSignOut} variant="destructive" className="w-full" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  const SizesContent = () => (
    <div className="space-y-4 lg:space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Saved Sizes</h2>
        <Button onClick={() => handleNavigation('sizes', '/saved-sizes')} size="sm" className="sm:size-default">
          Manage Sizes
        </Button>
      </div>
      <p className="text-gray-600 text-sm lg:text-base">
        View and manage your saved measurement profiles for easy ordering.
      </p>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigation('sizes', '/saved-sizes')}>
        <CardContent className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <Ruler className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm lg:text-base">View All Saved Sizes</h3>
              <p className="text-xs lg:text-sm text-gray-600">Manage your measurement profiles</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg lg:text-xl">→</span>
        </CardContent>
      </Card>
    </div>
  )

  const AddressesContent = () => (
    <div className="space-y-4 lg:space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Saved Addresses</h2>
        <Button onClick={() => handleNavigation('addresses', '/saved-addresses')} size="sm" className="sm:size-default">
          Manage Addresses
        </Button>
      </div>
      <p className="text-gray-600 text-sm lg:text-base">
        View and manage your delivery addresses for easy ordering.
      </p>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigation('addresses', '/saved-addresses')}>
        <CardContent className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm lg:text-base">View All Saved Addresses</h3>
              <p className="text-xs lg:text-sm text-gray-600">Manage your delivery locations</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg lg:text-xl">→</span>
        </CardContent>
      </Card>
    </div>
  )

  const PaymentsContent = () => {
    const getPaymentIcon = (type: string) => {
      switch (type) {
        case 'card':
          return <CreditCard className="w-5 h-5 text-blue-600" />
        case 'upi':
          return <Smartphone className="w-5 h-5 text-purple-600" />
        case 'netbanking':
          return <Building2 className="w-5 h-5 text-green-600" />
        case 'wallet':
          return <Wallet className="w-5 h-5 text-orange-600" />
        default:
          return <CreditCard className="w-5 h-5 text-gray-600" />
      }
    }

    if (loadingPayments) {
      return (
        <div className="text-center py-8 lg:py-12 font-poppins">
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      )
    }

    if (savedPayments.length === 0) {
      return (
        <div className="text-center py-8 lg:py-12 font-poppins">
          <CreditCard className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No Saved Payment Methods</h3>
          <p className="text-gray-600 mb-6 text-sm lg:text-base px-4">
            Your payment methods will be automatically saved when you make a purchase.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4 lg:space-y-6 font-poppins">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl lg:text-2xl font-bold">Saved Payment Methods</h2>
        </div>
        <p className="text-gray-600 text-sm lg:text-base">
          Manage your saved payment methods for faster checkout.
        </p>
        <div className="space-y-3">
          {savedPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4 lg:p-6">
                <div className="flex items-center gap-3 flex-1">
                  {getPaymentIcon(payment.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm lg:text-base">{payment.displayName}</h3>
                      {payment.isDefault && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 capitalize">{payment.type}</p>
                    {payment.lastUsedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last used: {new Date(payment.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePayment(payment._id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    // On mobile, only show profile content (others navigate to separate pages)
    if (isMobile) {
      // Mobile only shows profile details, no saved items sections
      return <ProfileContent />
    }

    // On desktop, show all sections
    switch (activeSection) {
      case 'profile':
        return <ProfileContent />
      case 'sizes':
        return <SizesContent />
      case 'addresses':
        return <AddressesContent />
      case 'payments':
        return <PaymentsContent />
      default:
        return <ProfileContent />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} >
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.34277 25.0272C1.34277 23.1961 2.07017 21.44 3.36494 20.1452C4.65971 18.8504 6.4158 18.123 8.24688 18.123H22.0551C23.8862 18.123 25.6423 18.8504 26.937 20.1452C28.2318 21.44 28.9592 23.1961 28.9592 25.0272C28.9592 25.9427 28.5955 26.8207 27.9481 27.4681C27.3007 28.1155 26.4227 28.4792 25.5072 28.4792H4.79483C3.87929 28.4792 3.00124 28.1155 2.35386 27.4681C1.70647 26.8207 1.34277 25.9427 1.34277 25.0272Z" stroke="#D2D2D2" strokeWidth="1.72603" strokeLinejoin="round"/>
            <path d="M15.1507 11.2185C18.0105 11.2185 20.3288 8.90016 20.3288 6.04039C20.3288 3.18061 18.0105 0.862305 15.1507 0.862305C12.291 0.862305 9.97266 3.18061 9.97266 6.04039C9.97266 8.90016 12.291 11.2185 15.1507 11.2185Z" stroke="#D2D2D2" strokeWidth="1.72603"/>
          </svg>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 font-poppins w-[95vw] sm:w-full">
        <VisuallyHidden>
          <DialogTitle>Profile Management</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col lg:flex-row h-[80vh]">
          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-gray-50 border-b lg:border-r lg:border-b-0 flex flex-col">
            {/* Profile Header */}
            <div className="p-4 lg:p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-sm lg:text-base">{user.name || 'User'}</h3>
                  <p className="text-xs lg:text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-2 lg:p-4 max-h-48 lg:max-h-none overflow-y-auto lg:overflow-visible">
              <nav className="flex lg:flex-col gap-2 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const itemWithPath = item as { id: string; label: string; icon: React.ComponentType; path?: string }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id, itemWithPath.path)}
                      className={`flex-shrink-0 lg:flex-shrink lg:w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                        activeSection === item.id && !isMobile
                          ? 'bg-white shadow-sm border'
                          : 'hover:bg-white/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="font-medium text-sm lg:text-base">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b">
              <h1 className="text-xl lg:text-2xl font-bold">Profile</h1>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProfilePage