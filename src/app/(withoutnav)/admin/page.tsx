"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Package, 
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { makeAuthenticatedRequest } from '@/lib/adminApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface DashboardStats {
  totalCustomers: number
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
}

interface Order {
  status: string
  createdAt: string
  slotAllocation?: Array<{
    date: {
      date: string
    }
  }>
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const [statusData, setStatusData] = useState({
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    overdueCount: 0
  })

  const generateMonthlyData = (orders: Order[]) => {
    const monthlyCount = new Array(8).fill(0)
    const currentDate = new Date(2025, 9, 10) // October 10, 2025
    
    orders.forEach((order: Order) => {
      const orderDate = new Date(order.createdAt)
      
      // Check which of the 8 months (Mar to Oct 2025) this order belongs to
      for (let i = 0; i < 8; i++) {
        const monthStart = new Date(currentDate)
        monthStart.setMonth(currentDate.getMonth() - (7 - i))
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)
        
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        
        if (orderDate >= monthStart && orderDate < monthEnd) {
          monthlyCount[i]++
          break
        }
      }
    })
    
    return monthlyCount
  }

  const calculateOverdueOrders = (orders: Order[]) => {
    const today = new Date()
    let overdueCount = 0
    
    orders.forEach((order: Order) => {
      if (order.slotAllocation && order.slotAllocation.length > 0) {
        const deliveryDate = new Date(order.slotAllocation[0].date.date)
        // Only count as overdue if the order is not completed or cancelled
        if (deliveryDate < today && !['completed', 'cancelled'].includes(order.status.toLowerCase())) {
          overdueCount++
        }
      }
    })
    
    return overdueCount
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [usersResponse, ordersResponse] = await Promise.all([
        makeAuthenticatedRequest('/api/admin/users'),
        makeAuthenticatedRequest('/api/admin/orders')
      ])

      const users = usersResponse.data?.users || []
      const orders = ordersResponse.data?.orders || []

      const pendingCount = orders.filter((order: Order) => order.status.toLowerCase() === 'pending').length
      const processingCount = orders.filter((order: Order) => order.status.toLowerCase() === 'in progress').length
      const completedCount = orders.filter((order: Order) => order.status.toLowerCase() === 'completed').length
      const confirmedCount = orders.filter((order: Order) => order.status.toLowerCase() === 'confirmed').length

      // Update charts with real data
      setMonthlyData(generateMonthlyData(orders))
      setStatusData({
        pendingCount,
        processingCount: processingCount + confirmedCount, // Combine processing and confirmed
        completedCount,
        overdueCount: calculateOverdueOrders(orders)
      })

      setStats({
        totalCustomers: users.length,
        totalOrders: orders.length,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        completedOrders: completedCount
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Generate labels for current month and 7 previous months
  const generateMonthLabels = () => {
    const labels = []
    const currentDate = new Date(2025, 9, 10) // October 10, 2025
    
    for (let i = 7; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(currentDate.getMonth() - i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }))
    }
    return labels
  }

  const monthlyOrdersData = {
    labels: generateMonthLabels(), // ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
    datasets: [
      {
        label: 'Orders',
        data: monthlyData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  }

  const orderStatusData = {
    labels: ['Pending', 'Processing', 'Completed', 'Overdue'],
    datasets: [
      {
        data: [statusData.pendingCount, statusData.processingCount, statusData.completedCount, statusData.overdueCount],
        backgroundColor: [
          '#000000',
          '#A0A0A0',
          '#D0D0D0',
          '#F0F0F0',
        ],
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm lg:text-base text-gray-600 mt-1">Overview of your stitching shop orders and operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
        <Card className="bg-white">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="p-2 lg:p-3 rounded-full bg-gray-100">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Total</p>
                <p className="text-xs lg:text-sm text-gray-500">Customers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="p-2 lg:p-3 rounded-full bg-gray-100">
                <Package className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Total</p>
                <p className="text-xs lg:text-sm text-gray-500">Orders</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="p-2 lg:p-3 rounded-full bg-gray-100">
                <BarChart3 className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Pending</p>
                <p className="text-xs lg:text-sm text-gray-500">Orders</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="p-2 lg:p-3 rounded-full bg-gray-100">
                <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Processing</p>
                <p className="text-xs lg:text-sm text-gray-500">Orders</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.processingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="p-2 lg:p-3 rounded-full bg-gray-100">
                <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Completed</p>
                <p className="text-xs lg:text-sm text-gray-500">Orders</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="bg-white">
          <CardHeader className="p-3 lg:p-6">
            <CardTitle className="text-base lg:text-lg font-medium">Monthly Orders Trend</CardTitle>
            <p className="text-xs lg:text-sm text-gray-500">Order volume over the past 8 months</p>
          </CardHeader>
          <CardContent className="p-3 lg:p-6">
            <div className="h-48 lg:h-64">
              <Line data={monthlyOrdersData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="p-3 lg:p-6">
            <CardTitle className="text-base lg:text-lg font-medium">Order Status Distribution</CardTitle>
            <p className="text-xs lg:text-sm text-gray-500">Current status of all orders</p>
          </CardHeader>
          <CardContent className="p-3 lg:p-6">
            <div className="h-48 lg:h-64">
              <Doughnut data={orderStatusData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="bg-white">
        <CardHeader className="p-3 lg:p-6">
          <CardTitle className="text-base lg:text-lg font-medium">Today&apos;s Schedule</CardTitle>
          <p className="text-xs lg:text-sm text-gray-500">Orders organized by delivery dates</p>
        </CardHeader>
        <CardContent className="p-3 lg:p-6">
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between p-3 lg:p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h4 className="text-sm lg:text-base font-medium text-red-800">Yesterday (Overdue)</h4>
                <p className="text-xs lg:text-sm text-red-600">{statusData.overdueCount} order{statusData.overdueCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-red-500">
                <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <h4 className="text-sm lg:text-base font-medium text-yellow-800">Today</h4>
                <p className="text-xs lg:text-sm text-yellow-600">{statusData.pendingCount} orders due</p>
              </div>
              <div className="text-yellow-500">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 lg:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h4 className="text-sm lg:text-base font-medium text-blue-800">Tomorrow</h4>
                <p className="text-xs lg:text-sm text-blue-600">{statusData.processingCount} orders scheduled</p>
              </div>
              <div className="text-blue-500">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard