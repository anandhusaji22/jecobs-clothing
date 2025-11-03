"use client"
import React from 'react'
import Image from 'next/image'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactUsSchema,ContactUs } from '@/zodSchemas/contactus'

const Page = () => {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [submitMessage, setSubmitMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset
    }= useForm<ContactUs>({
      resolver: zodResolver(contactUsSchema)
    })

    const onSubmit: SubmitHandler<ContactUs> = async (data) => {
      // Contact form should work for both logged-in and guest users
      setIsSubmitting(true)
      setSubmitMessage(null)
      
      try {
        const response = await fetch('/api/admin/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        const result = await response.json()
        
        if (result.success) {
          setSubmitMessage({ type: 'success', text: result.message })
          reset()
        } else {
          setSubmitMessage({ type: 'error', text: result.error || 'Failed to submit enquiry' })
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        setSubmitMessage({ type: 'error', text: 'Failed to submit enquiry. Please try again.' })
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <div className='font-poppins lg:py-24 py-5 lg:px-0 px-3 '>
        <h1 className='text-center lg:text-5xl text-2xl font-bold'>Contact Us</h1>
        <p className='text-center text-[#727272] lg:text-xl text-xs pt-2'>Have questions about our vestments or need a custom order? We&apos;re here to help <br /> with all your liturgical clothing needs.</p>


        <div className='lg:px-10 flex lg:flex-row flex-col lg:gap-10 gap-4 justify-center  w-full '>
            {/* form */}
            <div className='max-w-5xl lg:w-5xl  mt-8 border lg:p-6 rounded-lg shadow-lg'>
              <form onSubmit={handleSubmit(onSubmit)} className=' flex flex-col lg:gap-5 p-4'>

                <div className='flex  lg:flex-row flex-col lg:gap-6'>
                  <div className='flex flex-col lg:gap-2 my-2 w-full'>
                    <label htmlFor="name" className='font-semibold'>Name</label>
                    <input type="text" id='name' {...register("name")} 
                    className='lg:min-w-full py-3 px-4 rounded-sm border border-[#C2B9B9] bg-[#DEDEDE] focus:outline-none focus:ring-1
                    placeholder:text-[#848484] ' placeholder='Enter your name' />
                    {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                  </div>

                  <div className='flex flex-col lg:gap-2 my-2 w-full'>
                    <label htmlFor="phone" className='font-semibold'>Phone Number</label>
                    <input type="tel" id='phone' {...register("phoneNumber")} 
                    className='lg:min-w-full py-3 px-4 rounded-sm border border-[#C2B9B9] bg-[#DEDEDE] focus:outline-none focus:ring-1
                    placeholder:text-[#848484]' placeholder='Enter your phone number' />
                    {errors.phoneNumber && <p className='text-red-500 text-sm'>{errors.phoneNumber.message}</p>}
                  </div>


                </div>


                <div className='flex flex-col lg:gap-2 my-2 w-full'>
                  <label htmlFor="email" className='font-semibold'>Email</label>
                  <input type="email" id='email' {...register("email")} 
                  className='lg:min-w-full py-3 px-4 rounded-sm border border-[#C2B9B9] bg-[#DEDEDE] focus:outline-none focus:ring-1
                  placeholder:text-[#848484]' placeholder='Enter your email' />
                  {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
                </div>

                <div className='flex flex-col lg:gap-2 my-2 w-full'>
                  <label htmlFor="message" className='font-semibold'>Message</label>
                  <textarea id='message' {...register("message")} rows={4}
                  className='lg:min-w-full py-3 px-4 rounded-sm border border-[#C2B9B9] bg-[#DEDEDE] focus:outline-none focus:ring-1
                  placeholder:text-[#848484]' placeholder='Enter your message' />
                  {errors.message && <p className='text-red-500 text-sm'>{errors.message.message}</p>}
                </div>

                <button type="submit" 
                disabled={isSubmitting}
                className='mt-4 bg-black text-white py-3 px-6 rounded-sm hover:bg-[#2B2828] transition-colors w-full disabled:bg-gray-400 disabled:cursor-not-allowed'>
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>

                {submitMessage && (
                  <div className={`mt-4 p-4 rounded-sm ${
                    submitMessage.type === 'success' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {submitMessage.text}
                  </div>
                )}

                </form>
            </div>

        {/* details */}
        <div className=' mt-8 lg:gap-2 gap-2 flex flex-col justify-between h-full'>

          <div className=" border-1 lg:w-2xl lg:p-5 p-2 flex items-center rounded-xl shadow-lg ">
            <div className='flex gap-4 '>
              <Image src="/location.svg" width={16} height={16} alt="Location Icon" className='w-7 h-7' />
              <div className='flex flex-col lg:gap-4  '>
                <h1 className='lg:text-xl font-bold'>Address</h1>
                <p className='lg:text-lg text-[#4E4E4E]'>NMRA-71, Nettoor, Maradu<br /> Kochi, Ernakulam,<br /> Kerala 682040</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 border-1 max-w-2xl lg:p-5 p-2 flex items-center rounded-xl shadow-lg ">
            <div className='flex gap-4 '>
              <Image src="/location.svg" width={16} height={16} alt="Phone Icon" className='w-7 h-7' />
              <div className='flex flex-col lg:gap-4  '>
                <h1 className='lg:text-xl font-bold'>Phone</h1>
                <p className='lg:text-lg text-[#4E4E4E]'>+91 9446612313</p>
              </div>
            </div>
          </div>

          <div className="flex-1 border-1 max-w-2xl lg:p-5 p-2 flex items-center rounded-xl shadow-lg ">
            <div className='flex gap-4 '>
              <Image src="/location.svg" width={16} height={16} alt="Email Icon" className='w-7 h-7' />
              <div className='flex flex-col lg:gap-4  '>
                <h1 className='lg:text-xl font-bold'>Email</h1>
                <p className='lg:text-lg text-[#4E4E4E]'>jacobsnettoor@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="flex-1 border-1 max-w-2xl lg:p-5 p-2 flex items-center rounded-xl shadow-lg ">
            <div className='flex gap-4 '>
              <Image src="/clock.svg" width={16} height={16} alt="Business Hours Icon" className='w-7 h-7' />
              <div className='flex flex-col lg:gap-4  '>
                <h1 className='lg:text-xl font-bold'>Business Hours</h1>
                <p className='lg:text-lg text-[#4E4E4E]'>
                      Monday - Friday: 9:00 AM - 6:00 PM <br />
                      Saturday: 10:00 AM - 4:00 PM <br /> 
                      Sunday: Closed
                      </p>
              </div>
            </div>
          </div>


        </div>

        </div>


    </div>
  )
}

export default Page