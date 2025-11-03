'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PrivacyPolicyPage = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600 text-sm">
              Last Updated: 12 October 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              At Jacob&apos;s, we are committed to protecting the privacy and personal data of our customers. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use 
              our website and services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Personal Details:</strong> Name, contact number, email address, shipping address
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Measurement Details:</strong> Body measurements needed for custom tailoring
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Order & Payment Details:</strong> Order history, payment status
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Communication Data:</strong> Messages, queries, and feedback
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  To process and manufacture your customized priest garments
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  To confirm orders, payments, and delivery schedules
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  To communicate updates on order status or shipping
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  To improve our services and customer support
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use secure systems to protect your personal and payment information. Your data will 
              never be sold or shared with third parties, except for logistics and payment processing partners.
            </p>
          </section>

          {/* Payment Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Payment Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All payments are processed through secure payment gateways. We do not store sensitive 
              payment details such as credit/debit card numbers.
            </p>
          </section>

          {/* Your Consent */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Consent
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By using our website and placing an order, you consent to our collection and use of 
              your data as outlined in this policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy concerns, please contact:<br />
              Email: <a href="mailto:jacobsnettoor@gmail.com" className="text-black hover:underline font-medium">jacobsnettoor@gmail.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage