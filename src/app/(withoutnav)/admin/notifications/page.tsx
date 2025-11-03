"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { makeAuthenticatedRequest } from '@/lib/adminApi'

interface Notification {
  id: string
  type: 'urgent' | 'warning' | 'info'
  title: string
  message: string
  orderId: string
  daysLeft: number
  status: string
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await makeAuthenticatedRequest('/api/admin/notifications')
      if (response.data.success) {
        setNotifications(response.data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationBadge = (notification: Notification) => {
    switch (notification.type) {
      case 'urgent':
        if (notification.daysLeft < 0) {
          return <Badge className="bg-red-500 text-white text-xs">{Math.abs(notification.daysLeft)} days overdue</Badge>
        }
        return <Badge className="bg-red-500 text-white text-xs">Due Today!</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500 text-white text-xs">{notification.daysLeft} {notification.daysLeft === 1 ? 'day' : 'days'} left</Badge>
      case 'info':
        return <Badge className="bg-blue-500 text-white text-xs">{notification.daysLeft} {notification.daysLeft === 1 ? 'day' : 'days'} left</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{notification.status}</Badge>
    }
  }

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50'
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-4 border-l-gray-300 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] font-poppins p-4 lg:p-0">
        <div className="text-base lg:text-lg">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold">Notifications & Reminders</h1>
          <p className="text-gray-600 text-xs lg:text-sm mt-1">Orders due within 3 days (excludes cancelled/completed)</p>
        </div>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 lg:py-12">
              <CheckCircle className="w-12 h-12 lg:w-16 lg:h-16 text-green-500 mb-3 lg:mb-4" />
              <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500 text-center text-sm lg:text-base">No urgent notifications at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 lg:p-4 rounded-lg ${getNotificationBorderColor(notification.type)} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 lg:gap-3 flex-1 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base break-words">{notification.title}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1 break-words">{notification.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  {getNotificationBadge(notification)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationsPage