'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TermsConditionsPage = () => {
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
              Terms & Conditions
            </h1>
            <p className="text-gray-600 text-sm">
              Custom Orders Policy
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Custom-Made Garments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Custom-Made Garments
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All garments sold through Jacob&apos;s are custom-manufactured priest clothing made specifically 
              according to each customer&apos;s size, preferences, and selected date.
            </p>
          </section>

          {/* Advance Booking & Production Time */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Advance Booking & Production Time
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Orders must be placed 6 months in advance</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Full advance payment is mandatory to confirm manufacturing</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Production begins immediately after booking due to high demand</p>
              </div>
            </div>
          </section>

          {/* Measurement Responsibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Measurement Responsibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Customers must ensure that the provided measurements are accurate. We are not responsible 
              for fitting issues caused by incorrect measurements given by the customer.
            </p>
          </section>

          {/* No Modification After Confirmation */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Modification After Confirmation
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Once an order is confirmed and payment is completed, no changes to measurements, fabric, 
              design, or delivery date are allowed.
            </p>
          </section>

          {/* Legal Ownership */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Legal Ownership
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All images, designs, and content on our website are the intellectual property of Jacob&apos;s 
              and cannot be copied or reproduced without permission.
            </p>
          </section>

          {/* Disclaimer & Important Notes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Disclaimer & Important Notes
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  Our garments are handcrafted and custom-stitched, hence small variations in color, 
                  pattern, or finish may occur.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  We cannot guarantee delivery on a specific time or hour, only within the date range selected.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  We do not provide trial, alteration, or rejection after production, as the product 
                  is made strictly as per the customer&apos;s measurements.
                </p>
              </div>
            </div>
          </section>

          {/* Agreement */}
          <section className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>By placing an order, the customer fully agrees to all policies listed above, 
              including No Cancellation, No Refund, and No Return.</strong>
            </p>
            <p className="text-gray-700">
              For any queries, please contact us at{' '}
              <a href="mailto:jacobsnettoor@gmail.com" className="text-black hover:underline font-medium">
                jacobsnettoor@gmail.com
              </a>
            </p>
            <p className="text-gray-700 mt-2 font-semibold">
              Jacob&apos;s – Dedicated to Tradition & Excellence.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

export default TermsConditionsPage