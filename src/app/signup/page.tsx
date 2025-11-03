"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm, SubmitHandler } from 'react-hook-form'
import { userSignupSchema, UserSignup } from '@/zodSchemas/usersignup'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, deleteUser } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useDispatch } from 'react-redux'
import { setUser } from '@/slices/userSlice'
import axios from 'axios'
import { useRouter } from 'next/navigation'


function Page (){
        const [isLoading, setIsLoading] = useState(false);
        const [errorMessage, setErrorMessage] = useState('');
        const dispatch = useDispatch();
        const router = useRouter();
        
        
        
    const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<UserSignup>(
        {resolver: zodResolver(userSignupSchema)}
      );    

      const formSubmit: SubmitHandler<UserSignup> = async (data: UserSignup) => {
        setIsLoading(true);
        setErrorMessage('');
        let firebaseUser = null;
        
        try {
          // 1. Create Firebase user
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          firebaseUser = userCredential.user;
          
          // 1.5. Get and store Firebase token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);
          
          // 2. Prepare user data for database
          const userData = {
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber || "",
            password: data.password,
            role: "customer",
            avatar: "",
            denomination: data.denomination,
            isPhoneVerified: false,
            authProvider: "email",
            firebaseUid: firebaseUser.uid
          };
          
          console.log('Prepared user data for registration:', userData);
          // 3. Store user in database
          const res = await axios.post('/api/auth/register', userData);
          console.log('User registration response:', res.data);
          // 4. Dispatch to Redux immediately - no need for re-signin
          const userDataForRedux = {
            uid: firebaseUser.uid,
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            role: userData.role,
            photoURL: userData.avatar,
            denomination: userData.denomination,
            isPhoneVerified: userData.isPhoneVerified,
            isEmailVerified: firebaseUser.emailVerified,
            provider: userData.authProvider,
            createdAt: new Date().toISOString(),
          };
          dispatch(setUser(userDataForRedux));
          console.log('Dispatched user to Redux:', userDataForRedux);
          router.push('/');
          console.log('Signup successful!');
          
        } catch (error: unknown) {
          let errorMsg = 'Signup failed. Please try again.';
          
          // Handle axios errors (database conflicts)
          if (axios.isAxiosError(error)) {
            // If Firebase user was created but database save failed, clean up Firebase user
            if (firebaseUser) {
              try {
                await deleteUser(firebaseUser);
                // Cleaned up Firebase user due to database conflict
              } catch (deleteError) {
                console.error('Failed to clean up Firebase user:', deleteError);
              }
            }
            
            if (error.response?.status === 409) {
              errorMsg = error.response.data?.error || 'User already exists. Please try logging in instead.';
            } else if (error.response?.status === 400) {
              errorMsg = error.response.data?.error || 'Invalid registration data.';
            } else {
              errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
            }
          }
          // Handle Firebase auth errors
          else if (error instanceof Error) {
            if (error.message.includes('auth/email-already-in-use')) {
              errorMsg = 'Email already in use. Please try a different email.';
            } else if (error.message.includes('auth/weak-password')) {
              errorMsg = 'Password is too weak. Please choose a stronger password.';
            } else if (error.message.includes('auth/invalid-email')) {
              errorMsg = 'Please enter a valid email address.';
            } else {
              errorMsg = `Signup error: ${error.message}`;
            }
          }
          
          setErrorMessage(errorMsg);
          console.error('Signup error:', error);
        } finally {
          setIsLoading(false);
        }
      };

  
  return (
    <div className="flex flex-col min-h-screen w-full justify-center items-center font-poppins py-4 px-4 bg-gray-50">
        {/* logo */}
        <div className='justify-center items-center flex flex-col gap-4 mb-6'>
            <Image src="/logo-black.svg" alt="Logo" width={100} height={100} className='w-auto h-16 md:h-20'/>
        </div>

        {/* title */}
        <div className='flex flex-col justify-center items-center mb-6 text-center'>
            <h1 className='font-bold text-2xl md:text-3xl lg:text-4xl mb-2'>Create Account</h1>
            <p className='text-gray-600 text-sm md:text-base px-4'>Join our community of sacred vestment craftsmanship</p>
        </div>

        {/* form */}
        <div className='flex flex-col gap-4 md:gap-6 items-center justify-center p-6 md:p-8 rounded-xl bg-white shadow-lg w-full max-w-md md:max-w-lg lg:max-w-xl border border-gray-200'>

            {/* heading  */}
            <div className='flex flex-col justify-center items-center text-center mb-4'>
                <h1 className='text-xl md:text-2xl font-bold mb-2'>Sign Up</h1>
                <p className='text-gray-600 text-sm md:text-base'>Enter your details to create your account</p>
            </div>

            <form action="" onSubmit={handleSubmit(formSubmit)} className='w-full flex flex-col gap-3 md:gap-4'>

                {/* name */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="name" className='font-semibold text-gray-700'>Name</label>
                    <input type="text" id='name' {...register("name")} 
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' placeholder='Enter your name' />
                    {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
                </div>

                {/* email */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="email" className='font-semibold text-gray-700'>Email</label>
                    <input type="email" id='email' {...register("email")} 
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' placeholder='Enter your email' />
                    {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>}
                </div>

                {/* phone number */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="phoneNumber" className='font-semibold text-gray-700'>Phone Number</label>
                    <input type="text" id='phoneNumber' {...register("phoneNumber")} 
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' placeholder='Enter your phone number' />
                    {errors.phoneNumber && <p className='text-red-500 text-sm mt-1'>{errors.phoneNumber.message}</p>}
                </div>


                {/* password */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="password" className='font-semibold text-gray-700'>Password</label>
                    <input type="password" id='password' {...register("password")} 
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' placeholder='Enter your password' />
                    {errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.message}</p>}
                </div>

                {/* confirm password */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="confirmPassword" className='font-semibold text-gray-700'>Confirm Password</label>
                    <input type="password" id='confirmPassword' {...register("confirmPassword")} 
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' placeholder='Confirm your password' />
                    {errors.confirmPassword && <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword.message}</p>}
                </div>

                {/* denomination */}
                <div className='flex flex-col gap-2 w-full'>
                    <label htmlFor="denomination" className='font-semibold text-gray-700'>Denomination</label>
                    <select id="denomination" {...register("denomination")}
                    className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700 transition-all duration-200' defaultValue="">
                        <option value="" disabled>Select your denomination</option>
                        <option value="Orthodox & Jacobite">Orthodox & Jacobite</option>
                        <option value="Mar Thoma">Mar Thoma</option>
                        <option value="CSI">CSI</option>
                    </select>
                    {errors.denomination && <p className='text-red-500 text-sm mt-1'>{errors.denomination.message}</p>}
                </div>

                {/* Error message */}
                {errorMessage && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                        <p className='text-red-600 text-sm font-medium'>{errorMessage}</p>
                    </div>
                )}

                {/* submit button */}
                <div className='w-full'>
                    <button 
                        type='submit'
                        disabled={isLoading}
                        className={`py-3 px-4 rounded-lg w-full font-semibold transition duration-300 ease-in-out ${
                            isLoading 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-black text-white hover:bg-gray-800'
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating Account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </div>

                
            </form>

            <div className='relative flex items-center w-full'>
                <div className='flex-grow border-t border-gray-300'></div>
                <span className='flex-shrink mx-4 text-gray-500 bg-white px-2 text-sm'>OR CONTINUE WITH</span>
                <div className='flex-grow border-t border-gray-300'></div>
            </div>

            {/* social buttons */}
            

            <div className='flex justify-center items-center w-full'>
                <p className='text-sm md:text-base text-gray-600 text-center'>Already have an account? 
                    <Link href="/login" className='ml-1 text-black font-semibold hover:underline transition-colors'>
                        Sign In
                    </Link>
                </p>
            </div>

        </div>



    </div>
  )
}

export default Page