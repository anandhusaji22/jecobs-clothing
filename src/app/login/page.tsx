"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { useForm, SubmitHandler } from 'react-hook-form'
import { userLoginSchema, UserLogin } from '@/zodSchemas/userlogin'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useDispatch } from 'react-redux'
import { setUser } from '@/slices/userSlice'
import axios from 'axios'

function Page() {
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();

    // Email/Password form
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UserLogin>({
        resolver: zodResolver(userLoginSchema)
    });

    const emailFormSubmit: SubmitHandler<UserLogin> = async (data: UserLogin) => {
        setIsLoading(true);
        setErrorMessage('');
        
        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Get and store Firebase token
            const token = await user.getIdToken();
            localStorage.setItem('firebaseToken', token);

            // Get user from database to get complete profile
            try {
                const response = await axios.get('/api/auth/user', {
                    params: { firebaseUid: user.uid },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Dispatch complete user data
                const userDataForRedux = {
                    uid: user.uid,
                    name: response.data.name || user.displayName || '',
                    email: user.email || '',
                    phoneNumber: response.data.phoneNumber || user.phoneNumber || '',
                    role: response.data.role || 'customer',
                    photoURL: user.photoURL || '',
                    denomination: response.data.denomination || '',
                    isPhoneVerified: response.data.isPhoneVerified || false,
                    isEmailVerified: user.emailVerified,
                    provider: response.data.authProvider || 'email',
                    createdAt: response.data.createdAt || new Date().toISOString(),

                };
                dispatch(setUser(userDataForRedux));
                        } catch {

                // Fallback: use Firebase user data
                const userDataForRedux = {
                    uid: user.uid,
                    name: user.displayName || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    role: 'customer',
                    photoURL: user.photoURL || '',
                    denomination: '',
                    isPhoneVerified: !!user.phoneNumber,
                    isEmailVerified: user.emailVerified,
                    provider: 'email',
                    createdAt: new Date().toISOString(),
                };
                dispatch(setUser(userDataForRedux));
            }
            
            // Redirect to home page after successful login
            router.push('/');

        } catch (error: unknown) {
            // If Firebase sign-in fails (e.g. wrong password or Firebase key issue), try MongoDB email login (works after password reset via MongoDB fallback)
            const firebaseError = error as { message?: string };
            const isCredentialError =
                firebaseError?.message?.includes('auth/wrong-password') ||
                firebaseError?.message?.includes('auth/user-not-found') ||
                firebaseError?.message?.includes('auth/invalid-credential');
            if (isCredentialError) {
                try {
                    const res = await axios.post<{ success: boolean; token?: string; user?: Record<string, unknown>; error?: string }>('/api/auth/login-email', {
                        email: data.email,
                        password: data.password,
                    });
                    if (res.data.success && res.data.token && res.data.user) {
                        localStorage.setItem('firebaseToken', res.data.token);
                        const u = res.data.user;
                        dispatch(setUser({
                            uid: u.uid as string,
                            name: (u.name as string) || '',
                            email: (u.email as string) || '',
                            phoneNumber: (u.phoneNumber as string) || '',
                            role: (u.role as string) || 'customer',
                            photoURL: (u.photoURL as string) || '',
                            denomination: (u.denomination as string) || '',
                            isPhoneVerified: !!u.isPhoneVerified,
                            isEmailVerified: !!u.isEmailVerified,
                            provider: (u.provider as string) || 'email',
                            createdAt: (u.createdAt as string) || new Date().toISOString(),
                        }));
                        router.push('/');
                        return;
                    }
                    setErrorMessage(res.data.error || 'Invalid email or password. Please try again.');
                } catch {
                    setErrorMessage('Invalid email or password. Please try again.');
                }
            } else {
                let errorMsg = 'Login failed. Please try again.';
                if (firebaseError?.message?.includes('auth/invalid-email')) errorMsg = 'Please enter a valid email address.';
                else if (firebaseError?.message?.includes('auth/user-disabled')) errorMsg = 'This account has been disabled.';
                else if (firebaseError?.message?.includes('auth/too-many-requests')) errorMsg = 'Too many failed attempts. Please try again later.';
                setErrorMessage(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    

    return (
        <div className="flex flex-col min-h-screen w-full justify-center items-center font-poppins py-4 px-4 bg-gray-50">
            {/* logo */}
            <div className='justify-center items-center flex flex-col gap-4 mb-6'>
                <Image src="/logo-black.svg" alt="Logo" width={100} height={100} className='w-auto h-16 md:h-20' />
            </div>

            {/* title */}
            <div className='flex flex-col justify-center items-center mb-6 text-center'>
                <h1 className='font-bold text-2xl md:text-3xl lg:text-4xl mb-2'>Welcome Back</h1>
                <p className='text-gray-600 text-sm md:text-base'>Sign in to your Jacob&apos;s account</p>
            </div>

            {/* form */}
            <div className='flex flex-col gap-4 md:gap-6 items-center justify-center p-6 md:p-8 rounded-xl bg-white shadow-lg w-full max-w-md md:max-w-lg lg:max-w-xl border border-gray-200'>

                {/* heading */}
                <div className='flex flex-col justify-center items-center text-center mb-4'>
                    <h1 className='text-xl md:text-2xl font-bold mb-2'>Sign In</h1>
                    <p className='text-gray-600 text-sm md:text-base'>Enter your credentials to access your account</p>
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleSubmit(emailFormSubmit)} className='w-full flex flex-col gap-3 md:gap-4'>
                    {/* email */}
                    <div className='flex flex-col gap-2 w-full'>
                        <label htmlFor="email" className='font-semibold text-gray-700'>Email</label>
                        <input 
                            type="email" 
                            id='email' 
                            {...register("email")} 
                            className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' 
                            placeholder='Enter your email' 
                        />
                        {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>}
                    </div>

                    {/* password */}
                    <div className='flex flex-col gap-2 w-full'>
                        <label htmlFor="password" className='font-semibold text-gray-700'>Password</label>
                        <input 
                            type="password" 
                            id='password' 
                            {...register("password")} 
                            className='w-full py-3 px-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-500 transition-all duration-200' 
                            placeholder='Enter your password' 
                        />
                        {errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.message}</p>}
                    </div>

                    {/* forgot password link */}
                    <div className='flex justify-end'>
                        <Link href="/forgot-password" className='text-sm text-gray-600 hover:text-black transition-colors'>
                            Forgot Password?
                        </Link>
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
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
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
               

                {/* Sign up link */}
                <div className='flex justify-center items-center w-full'>
                    <p className='text-sm md:text-base text-gray-600 text-center'>
                        Don&apos;t have an account? 
                        <Link href="/signup" className='ml-1 text-black font-semibold hover:underline transition-colors'>
                            Sign Up
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Page