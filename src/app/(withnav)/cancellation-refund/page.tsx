'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

const CancellationRefundPage = () => {
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
              Cancellation & Refund Policy
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Alert Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Important Notice</h3>
              <p className="text-red-700">
                By placing an order, the customer agrees to these strict non-cancellation and 
                non-refundable conditions.
              </p>
            </div>
          </div>

          {/* No Cancellation */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="text-red-500">✕</span>
              No Cancellation
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Once the order is placed and paid, it <strong>cannot be canceled under any circumstances</strong>.
            </p>
          </section>

          {/* No Refund */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="text-red-500">✕</span>
              No Refund
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Since garments are <strong>custom-made for each individual</strong>, no refunds will be provided.
            </p>
          </section>

          {/* No Return/Exchange */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="text-red-500">✕</span>
              No Return/Exchange
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Returns or exchanges are <strong>not accepted</strong>, as the product is tailored to 
              personal measurements and cannot be resold.
            </p>
          </section>

          {/* Why These Policies Exist */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Why These Policies Exist
            </h3>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Each garment is custom-made specifically for individual measurements</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Production begins immediately after order confirmation</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Custom-tailored items cannot be resold to other customers</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Materials and labor are committed upon order placement</p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Questions or Concerns?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our policies, please contact us{' '}
              <strong>before placing your order</strong>:<br />
              Email: <a href="mailto:jacobsnettoor@gmail.com" className="text-black hover:underline font-medium">jacobsnettoor@gmail.com</a><br />
              Phone: <a href="tel:+919446612313" className="text-black hover:underline font-medium">+91 9446612313</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

export default CancellationRefundPage