import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 px-8 lg:px-16 font-poppins">
      <div className=" mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-60">
          
          {/* Left Section - Logo and Description */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Image 
                src="/footer.svg" 
                alt="Jacob's Logo" 
                width={80} 
                height={80} 
                className="w-auto h-14 h-16 lg:h-24 mb-4"
              />
              <h3 className="text-xl font-semibold mb-4">Jacob&apos;s</h3>
            </div>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Crafting traditional priest vestments with reverence and precision. Each garment is 
              tailored with the highest quality materials and attention to liturgical requirements.
            </p>
            
            {/* Business Hours */}
            <div className="space-y-1 text-gray-300">
              <p>Mon-Fri: 9AM-6PM</p>
              <p>Saturday: 10AM-4PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          {/* Middle Section - Quick Links */}
          <div className="lg:col-span-1">
            {/* Spacing to align with description text */}
            <div className="mb-6 lg:mt-24">
              <h3 className="text-xl font-semibold mb-6">Quick links</h3>
            </div>
            <nav className="space-y-3 lg:mt-6">
              <Link href="/" className="block text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
             
              <Link href="/about" className="block text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contactus" className="block text-gray-300 hover:text-white transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Right Section - Contact Us */}
          <div className="lg:col-span-1">
            {/* Spacing to align with description text */}
            <div className="mb-6 lg:mt-24">
              <h3 className="text-xl font-semibold mb-6">Contact Us</h3>
            </div>
            <div className="space-y-4 lg:mt-6">
              
              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex-shrink-0">
                  {/* Phone Icon */}
                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </div>
                <span className="text-gray-300">9446612313</span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex-shrink-0">
                  {/* Email Icon */}
                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </div>
                <span className="text-gray-300">jacobsnettoor@gmail.com</span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  {/* Location Icon */}
                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="text-gray-300">
                  <p>NMRA-71, Nettoor, Maradu,</p>
                  <p>Kochi, Ernakulam,</p>
                  <p>Kerala 682040</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-gray-400 text-sm">
              © 2025 Jacob&apos;s. All rights reserved.
            </div>
            <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-conditions" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/cancellation-refund" className="text-gray-400 hover:text-white transition-colors">
                Cancellation & Refund
              </Link>
              <Link href="/shipping-delivery" className="text-gray-400 hover:text-white transition-colors">
                Shipping & Delivery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer