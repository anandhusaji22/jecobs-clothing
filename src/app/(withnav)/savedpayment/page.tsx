'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Lock } from 'lucide-react'

const SavedPaymentPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Saved Payments</h1>
          <p className="text-lg text-gray-600">Manage your payment methods securely</p>
        </div>

        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Payment Management Coming Soon
              </h2>
              
              <p className="text-gray-600 mb-6">
                We&apos;re working on secure payment storage and management features. 
                You&apos;ll be able to save and manage your payment methods safely here.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <Lock className="w-4 h-4" />
                <span>Bank-level security and encryption</span>
              </div>
              
              <Button disabled variant="outline" className="w-full">
                Add Payment Method (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            In the meantime, you can continue to use our secure checkout process for payments.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SavedPaymentPage