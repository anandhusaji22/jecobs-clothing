import React from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      
      <Nav />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      
    </div>
  )
}

export default layout