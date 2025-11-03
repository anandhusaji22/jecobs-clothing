'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Calendar, 
  Archive,
  Bell,
  MessageCircle,
  Menu,
  X
} from 'lucide-react'
import Image from 'next/image'

const AdminSidebar = () => {
  const pathname = usePathname()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: Package
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users
    },
    {
      name: 'Available Dates',
      href: '/admin/dates',
      icon: Calendar
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Archive
    },
    {
      name: 'Enquiries',
      href: '/admin/enquiries',
      icon: MessageCircle
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: Bell
    }
  ]

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-black text-white p-4 fixed top-0 left-0 right-0 z-50 font-poppins">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
            <div>
              <h2 className="text-white font-semibold text-lg">Admin</h2>
              <p className="text-gray-400 text-xs">Management</p>
            </div>
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-md text-white hover:text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Open sidebar</span>
            {isMobileSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-black text-white z-50 font-poppins rounded-r-3xl"
          >
            {/* Mobile Logo Section */}
            <div className="p-6 mt-16">
              <div className="flex flex-col space-y-2">
                <Image src="/logo.svg" alt="Logo" width={60} height={60} />
                <div>
                  <h2 className="text-white font-semibold">Admin Management</h2>
                  <p className="text-gray-400 text-sm">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Items */}
            <nav className="mt-6 flex flex-col items-end">
              <div className='bg-gradient-to-r from-black to-white w-[85%]'>
                {sidebarItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const check = (path: string) => {
                    return path === pathname
                  }
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={`flex text-lg items-center space-x-3 px-6 py-4 font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white text-black border-r-2 rounded-l-3xl border-white' 
                          : 'text-gray-300 hover:text-white bg-black'
                        } ${
                        index < sidebarItems.length - 1 && check(sidebarItems[index + 1].href)
                          ? 'rounded-br-3xl'
                          : ''
                        }
                        ${index > 0 && check(sidebarItems[index - 1].href) ? 'rounded-tr-3xl' : ''}
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-96 flex-col bg-black text-white h-screen fixed left-0 top-0 z-40 font-poppins rounded-r-3xl">
        {/* Desktop Logo Section */}
        <div className={`p-6 lg:px-16 ${pathname=="/admin" ? "rounded-br-2xl" : ""}`}>
          <div className="flex  flex-col  space-x-3">
            <Image src="/logo.svg" alt="Logo" width={60} height={60} />
            <div>
              <h2 className="text-white font-semibold">Admin Management</h2>
              <p className="text-gray-400 text-sm">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Items */}
        <nav className="mt-6 flex flex-col items-end">
          <div className='bg-gradient-to-r from-black to-white w-[85%]'>
            {sidebarItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const check = (path: string) => {
                return path === pathname
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex lg:text-2xl items-center space-x-3 px-6 lg:py-6 text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-black border-r-2 rounded-l-3xl border-white' 
                      : 'text-gray-300 hover:text-white bg-black'
                  } ${
                    index < sidebarItems.length - 1 && check(sidebarItems[index + 1].href)
                      ? 'rounded-br-3xl'
                      : ''
                  }
                  ${index > 0 && check(sidebarItems[index - 1].href) ? 'rounded-tr-3xl' : ''}
                  `}
                >
                  <Icon className="w-7 h-7" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className='flex-1'></div>
      </div>
    </>
  )
}

export default AdminSidebar