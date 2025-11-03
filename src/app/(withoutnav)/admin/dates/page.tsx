'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Calendar, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { auth } from '@/lib/firebase/config'
import { Label } from '@/components/ui/label'

interface AvailableDate {
  _id?: string
  date: Date
  normalSlots: number
  emergencySlots: number
  emergencySlotCost?: number
  isAvailable: boolean
  normalBookedSlots?: number
  emergencyBookedSlots?: number
}

const AvailableDatesPage = () => {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })
  const [defaultNormalSlots, setDefaultNormalSlots] = useState(4)
  const [defaultEmergencySlots, setDefaultEmergencySlots] = useState(1)
  const [defaultEmergencySlotCost, setDefaultEmergencySlotCost] = useState(0)
  const [loading, setLoading] = useState(false)
  const [applyingDefault, setApplyingDefault] = useState(false)
  const [applyingIndividual, setApplyingIndividual] = useState<Set<string>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<AvailableDate>>>(new Map())

  // Generate months from current month onwards
  const generateMonths = () => {
    const months = []
    const today = new Date()
    for (let i = 0; i < 18; i++) { // Increased from 12 to 18 months (1.5 years)
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      months.push({ value, label })
    }
    return months
  }

  // Generate all dates for the selected month
  const generateMonthDates = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const dates = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Only include dates from today onwards
      if (date >= today) {
        dates.push(date)
      }
    }
    return dates
  }



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Get authentication token
        const user = auth.currentUser
        if (!user) {
          console.error('No authenticated user found')
          setLoading(false)
          return
        }
        const token = await user.getIdToken()
        
        // Cleanup past dates first
        await cleanupPastDates()
        
        // Then fetch current month data
        const [year, month] = selectedMonth.split('-').map(Number)
        const response = await fetch(`/api/admin/available-dates?month=${month}&year=${year}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setAvailableDates(result.data.map((date: { date: string; normalSlots: number; emergencySlots: number; isAvailable: boolean; normalBookedSlots?: number; emergencyBookedSlots?: number }) => ({
              ...date,
              date: new Date(date.date)
            })))
          }
        }
      } catch (error) {
        console.error('Error fetching dates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedMonth])

  // Get date data (from API, pending changes, or default)
  const getDateData = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    const existingDate = availableDates.find(d => 
      d.date.toDateString() === date.toDateString()
    )
    const pendingChange = pendingChanges.get(dateKey)
    
    const baseData = existingDate || {
      date,
      normalSlots: defaultNormalSlots,
      emergencySlots: defaultEmergencySlots,
      emergencySlotCost: defaultEmergencySlotCost,
      isAvailable: true,
      normalBookedSlots: 0,
      emergencyBookedSlots: 0
    }
    
    return pendingChange ? { ...baseData, ...pendingChange } : baseData
  }
  
  // Check if date has pending changes
  const hasPendingChanges = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return pendingChanges.has(dateKey)
  }

  // Track individual date changes locally
  const updateDateSettings = (date: Date, updates: Partial<AvailableDate>) => {
    const dateKey = date.toISOString().split('T')[0]
    setPendingChanges(prev => {
      const newChanges = new Map(prev)
      const existingChanges = newChanges.get(dateKey) || {}
      newChanges.set(dateKey, { ...existingChanges, ...updates })
      return newChanges
    })
  }

  // Apply individual date changes to database
  const applyIndividualChanges = async (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    const changes = pendingChanges.get(dateKey)
    
    if (!changes) return
    
    setApplyingIndividual(prev => new Set(prev).add(dateKey))
    
    const dateData = getDateData(date)
    const updatedDate = { ...dateData, ...changes }
    
    try {
      const user = auth.currentUser
      if (!user) {
        console.error('No authenticated user found')
        return
      }
      const token = await user.getIdToken()

      const response = await fetch('/api/admin/available-dates', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          dates: [{
            date: date.toISOString(),
            normalSlots: updatedDate.normalSlots,
            emergencySlots: updatedDate.emergencySlots,
            emergencySlotCost: updatedDate.emergencySlotCost,
            isAvailable: updatedDate.isAvailable
          }]
        })
      })
      
      if (response.ok) {
        // Update local state and clear pending changes
        setAvailableDates(prev => {
          const filtered = prev.filter(d => d.date.toDateString() !== date.toDateString())
          return [...filtered, updatedDate].sort((a, b) => a.date.getTime() - b.date.getTime())
        })
        
        setPendingChanges(prev => {
          const newChanges = new Map(prev)
          newChanges.delete(dateKey)
          return newChanges
        })
      }
    } catch (error) {
      console.error('Error saving individual date changes:', error)
    } finally {
      setApplyingIndividual(prev => {
        const newSet = new Set(prev)
        newSet.delete(dateKey)
        return newSet
      })
    }
  }

  // Cleanup past dates from database
  const cleanupPastDates = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999)
      
      await fetch('/api/admin/available-dates/cleanup', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ beforeDate: yesterday.toISOString() })
      })
    } catch (error) {
      console.error('Error cleaning up past dates:', error)
    }
  }

  // Apply default slots to all dates in month (preserve existing availability)
  const applyDefaultSlots = async () => {
    setApplyingDefault(true)
    try {
      const monthDates = generateMonthDates()
      const datesToUpdate = monthDates.map(date => {
        const existingDate = getDateData(date)
        return {
          date: date.toISOString(),
          normalSlots: defaultNormalSlots,
          emergencySlots: defaultEmergencySlots,
          emergencySlotCost: defaultEmergencySlotCost,
          isAvailable: existingDate.isAvailable // Preserve existing availability status
        }
      })

      const user = auth.currentUser
      if (!user) {
        console.error('No authenticated user found')
        return
      }
      const token = await user.getIdToken()

      const response = await fetch('/api/admin/available-dates', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dates: datesToUpdate })
      })

      if (response.ok) {
        // Refresh the data by triggering useEffect
        const [year, month] = selectedMonth.split('-').map(Number)
        const refreshResponse = await fetch(`/api/admin/available-dates?month=${month}&year=${year}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (refreshResponse.ok) {
          const result = await refreshResponse.json()
          if (result.success) {
            setAvailableDates(result.data.map((date: { date: string; normalSlots: number; emergencySlots: number; isAvailable: boolean; normalBookedSlots?: number; emergencyBookedSlots?: number }) => ({
              ...date,
              date: new Date(date.date)
            })))
          }
        }
      }
    } catch (error) {
      console.error('Error applying default slots:', error)
    } finally {
      setApplyingDefault(false)
    }
  }

  const monthDates = generateMonthDates()
  const months = generateMonths()

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Available Dates</h1>
        <p className="text-gray-600 text-xs lg:text-sm mt-1">Manage which dates are available for new orders</p>
      </div>

      {/* Month Selection */}
      <Card className="p-3 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 gap-3 lg:gap-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <Label className="text-sm lg:text-base">Select Month:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Default Slots Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div>
            <Label htmlFor="normalSlots" className="text-sm lg:text-base">Normal slots/day:</Label>
            <Select value={defaultNormalSlots.toString()} onValueChange={(value) => setDefaultNormalSlots(Number(value))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num} slots</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm lg:text-base">Emergency slots/day:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[1, 2, 3, 4].map(num => (
                <label key={num} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="emergencySlots"
                    value={num}
                    checked={defaultEmergencySlots === num}
                    onChange={() => setDefaultEmergencySlots(num)}
                    className="text-red-600"
                  />
                  <span className="text-xs lg:text-sm">{num} slot{num > 1 ? 's' : ''}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="emergencySlotCost" className="text-sm lg:text-base">Emergency Cost (₹):</Label>
            <input
              type="number"
              id="emergencySlotCost"
              value={defaultEmergencySlotCost}
              onChange={(e) => setDefaultEmergencySlotCost(Number(e.target.value))}
              min="0"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0"
            />
          </div>

          <div className="flex lg:items-end">
            <Button onClick={applyDefaultSlots} disabled={applyingDefault} className="bg-black hover:bg-gray-800 text-white text-sm lg:text-base w-full lg:w-auto">
              {applyingDefault ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Currently Available Dates */}
      <div>
        <h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Currently Available Dates</h2>
        <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">These dates will be shown to customers when placing orders</p>
        
        {loading ? (
          <div className="flex items-center justify-center p-6 lg:p-8">
            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-4">
            {monthDates.map((date) => {
              const dateData = getDateData(date)
              const totalSlots = dateData.normalSlots + dateData.emergencySlots
              const totalBooked = (dateData.normalBookedSlots || 0) + (dateData.emergencyBookedSlots || 0)
              
              return (
                <Card key={date.toISOString()} className="p-3 lg:p-4 min-h-[140px] lg:min-h-[160px]">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs lg:text-sm font-medium">
                        {date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </span>
                      <button
                        onClick={() => updateDateSettings(date, { isAvailable: !dateData.isAvailable })}
                        className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          dateData.isAvailable 
                            ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                            : 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {dateData.isAvailable ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : <X className="w-3 h-3 lg:w-4 lg:h-4" />}
                      </button>
                    </div>
                    
                    <div className="text-xs lg:text-xs text-gray-600 space-y-2">
                      <div className="flex justify-between lg:flex-row flex-col items-center">
                        <span className="text-xs font-medium">Normal:</span>
                        <Select
                          value={dateData.normalSlots.toString()}
                          onValueChange={(value) => updateDateSettings(date, { normalSlots: Number(value) })}
                        >
                          <SelectTrigger className="w-16 lg:w-20 h-7 lg:h-8 text-xs border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-between lg:flex-row flex-col items-center">
                        <span className="text-xs font-medium">Emergency:</span>
                        <Select
                          value={dateData.emergencySlots.toString()}
                          onValueChange={(value) => updateDateSettings(date, { emergencySlots: Number(value) })}
                        >
                          <SelectTrigger className="w-16 lg:w-20 h-7 lg:h-8 text-xs border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-between lg:flex-row flex-col items-center">
                        <span className="text-xs font-medium">E-Cost (₹):</span>
                        <input
                          type="number"
                          value={dateData.emergencySlotCost || 0}
                          onChange={(e) => updateDateSettings(date, { emergencySlotCost: Number(e.target.value) })}
                          min="0"
                          className="w-16 lg:w-20 h-7 lg:h-8 text-xs border border-gray-300 rounded px-1 text-center"
                        />
                      </div>
                      <div className="text-xs pt-2 font-medium">
                        <span className={`px-2 py-1 rounded ${totalBooked >= totalSlots ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                          {totalSlots - totalBooked}/{totalSlots} available
                        </span>
                      </div>
                      {hasPendingChanges(date) && (
                        <Button 
                          size="sm" 
                          onClick={() => applyIndividualChanges(date)}
                          disabled={applyingIndividual.has(date.toISOString())}
                          className="w-full h-6 lg:h-7 text-xs mt-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          {applyingIndividual.has(date.toISOString()) ? 'Applying...' : 'Apply'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AvailableDatesPage