'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  MessageCircle, 
  Eye, 
  Trash2, 
  Clock,
  CheckCircle,
  Filter,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { makeAuthenticatedFetch } from '@/lib/adminApi'

interface IContact {
  _id: string
  name: string
  email: string
  phoneNumber?: string
  message: string
  status: 'unread' | 'read' | 'replied'
  priority: 'low' | 'medium' | 'high'
  adminNotes?: string
  repliedAt?: string
  createdAt: string
  updatedAt: string
}

interface ContactStats {
  total: number
  unread: number
  read: number
  replied: number
}

const EnquiriesPage = () => {
  const [contacts, setContacts] = useState<IContact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<ContactStats>({ total: 0, unread: 0, read: 0, replied: 0 })
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const fetchContacts = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      
      const response = await makeAuthenticatedFetch(`/api/admin/contacts?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setContacts(result.data)
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])



  const viewContact = async (contact: IContact) => {
    setSelectedContact(contact)
    setAdminNotes(contact.adminNotes || '')
    setDialogOpen(true)
    
    // Mark as read if unread
    if (contact.status === 'unread') {
      await updateContactStatus(contact._id, 'read')
    }
  }

  const updateContactStatus = async (id: string, status: string, priority?: string) => {
    setUpdating(true)
    try {
      const response = await makeAuthenticatedFetch(`/api/admin/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          priority,
          adminNotes: adminNotes,
          repliedAt: status === 'replied' ? new Date().toISOString() : undefined
        })
      })
      
      if (response.ok) {
        fetchContacts()
        if (selectedContact && selectedContact._id === id) {
          setSelectedContact({ ...selectedContact, status: status as 'unread' | 'read' | 'replied', adminNotes })
        }
      }
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await makeAuthenticatedFetch(`/api/admin/contacts/${id}`, { method: 'DELETE' })
        fetchContacts()
        setDialogOpen(false)
      } catch (error) {
        console.error('Error deleting contact:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800'
      case 'read': return 'bg-yellow-100 text-yellow-800'
      case 'replied': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Customer Enquiries</h1>
        <p className="text-gray-600 text-xs lg:text-sm mt-1">Manage and respond to customer contact form submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="p-3 lg:p-4">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 lg:p-4">
          <div className="flex items-center">
            <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Unread</p>
              <p className="text-lg lg:text-2xl font-bold text-red-600">{stats.unread}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 lg:p-4">
          <div className="flex items-center">
            <Eye className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Read</p>
              <p className="text-lg lg:text-2xl font-bold text-yellow-600">{stats.read}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 lg:p-4">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Replied</p>
              <p className="text-lg lg:text-2xl font-bold text-green-600">{stats.replied}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 lg:p-4">
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Enquiries List */}
      <Card className="p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No enquiries found</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="border border-gray-200 rounded-lg p-3 lg:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm lg:text-base text-gray-900">{contact.name}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(contact.priority)}`}>
                          {contact.priority}
                        </span>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">{contact.email}</p>
                      {contact.phoneNumber && (
                        <p className="text-xs lg:text-sm text-gray-600 mb-1">{contact.phoneNumber}</p>
                      )}
                      <p className="text-xs lg:text-sm text-gray-700 mb-2 line-clamp-2">
                        {contact.message.length > 100 
                          ? `${contact.message.substring(0, 100)}...` 
                          : contact.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(contact.createdAt), 'MMM dd, yyyy at HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full lg:w-auto justify-end">
                      <Dialog open={dialogOpen && selectedContact?._id === contact._id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewContact(contact)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs sm:max-w-md lg:max-w-2xl mx-4 lg:mx-auto max-h-[90vh] overflow-y-auto font-poppins">
                          {selectedContact && (
                            <>
                              <DialogHeader>
                                <DialogTitle>Enquiry Details</DialogTitle>
                                <DialogDescription>
                                  View and manage customer enquiry information and status.
                                </DialogDescription>
                              </DialogHeader>
                                <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold text-sm">Name</Label>
                                    <p className="mt-1 text-sm">{selectedContact.name}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold text-sm">Email</Label>
                                    <p className="mt-1 text-sm break-all">{selectedContact.email}</p>
                                  </div>
                                  {selectedContact.phoneNumber && (
                                    <div>
                                      <Label className="font-semibold text-sm">Phone</Label>
                                      <p className="mt-1 text-sm">{selectedContact.phoneNumber}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="font-semibold text-sm">Date</Label>
                                    <p className="mt-1 text-sm">
                                      {format(new Date(selectedContact.createdAt), 'MMM dd, yyyy at HH:mm')}
                                    </p>
                                  </div>
                                </div>                                <div>
                                  <Label className="font-semibold text-sm">Message</Label>
                                  <p className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap text-sm">
                                    {selectedContact.message}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold text-sm">Status</Label>
                                    <Select 
                                      value={selectedContact.status} 
                                      onValueChange={(value) => updateContactStatus(selectedContact._id, value)}
                                      disabled={updating}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unread">Unread</SelectItem>
                                        <SelectItem value="read">Read</SelectItem>
                                        <SelectItem value="replied">Replied</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="font-semibold text-sm">Priority</Label>
                                    <Select 
                                      value={selectedContact.priority} 
                                      onValueChange={(value) => updateContactStatus(selectedContact._id, selectedContact.status, value)}
                                      disabled={updating}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div>
                                  <Label className="font-semibold text-sm">Admin Notes</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes..."
                                    className="mt-1 text-sm"
                                    rows={3}
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => updateContactStatus(selectedContact._id, selectedContact.status)}
                                    disabled={updating}
                                  >
                                    {updating ? 'Saving...' : 'Save Notes'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteContact(selectedContact._id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default EnquiriesPage