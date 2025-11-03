'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Calendar, MapPin, Clock } from 'lucide-react'

const ShippingDeliveryPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      <div className="max-w-4xl mx-auto py-12 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shipping & Delivery Policy
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Shipping Schedule */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <Calendar className="text-blue-600" size={28} />
              Shipping Schedule
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 font-medium mb-2">
                The product will be shipped on the exact month/date selected by the customer during order placement.
              </p>
              <p className="text-blue-700">
                <strong>Delivery time after dispatch:</strong> 0–7 days, depending on location.
              </p>
            </div>
          </section>

          {/* Delivery Partner */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <Truck className="text-green-600" size={28} />
              Delivery Partner
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Orders are shipped through trusted courier services. A <strong>tracking number will be provided</strong> once dispatched.
            </p>
          </section>

          {/* Address Accuracy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <MapPin className="text-orange-600" size={28} />
              Address Accuracy
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <p className="text-orange-800 font-medium">
                Customers are responsible for providing accurate shipping information.
              </p>
              <p className="text-orange-700 mt-2">
                We are <strong>not liable for failed delivery</strong> due to incorrect address or contact details.
              </p>
            </div>
          </section>

          {/* Delays */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <Clock className="text-red-600" size={28} />
              Delays
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-medium mb-2">
                Unforeseen delays due to weather, transport issues, or public holidays are beyond our control.
              </p>
              <p className="text-red-700">
                <strong>No compensation</strong> will be provided for courier delays.
              </p>
            </div>
          </section>

          {/* Shipping Process Timeline */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Shipping Process Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Order Completion</h4>
                  <p className="text-gray-600">Your custom garment is manufactured according to specifications</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Quality Check</h4>
                  <p className="text-gray-600">Final inspection and packaging on your selected shipping date</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Dispatch & Tracking</h4>
                  <p className="text-gray-600">Item shipped with tracking number provided via email/SMS</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Delivery</h4>
                  <p className="text-gray-600">Product delivered within 0-7 days to your provided address</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help with Shipping?
            </h3>
            <p className="text-gray-700 leading-relaxed">
              For shipping inquiries or tracking updates, please contact us at:<br />
              Email: <a href="mailto:jacobsnettoor@gmail.com" className="text-black hover:underline font-medium">jacobsnettoor@gmail.com</a><br />
              Phone: <a href="tel:+919446612313" className="text-black hover:underline font-medium">+91 9446612313</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

export default ShippingDeliveryPage