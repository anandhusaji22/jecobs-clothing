"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import ProfilePage from './ProfilePage';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { auth } from '@/lib/firebase/config';

const Nav = () => {
    const pathname = usePathname();
    const user = useSelector((state: RootState) => state.user);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    
    const links = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' }
    ];

    useEffect(() => {
        if (user.uid) {
            fetchCartCount();
        }
    }, [user.uid, pathname]); // Refetch when pathname changes (after adding to cart)

    const fetchCartCount = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const token = await currentUser.getIdToken();
            const response = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success && response.data.data) {
                const totalItems = response.data.data.items.reduce(
                    (total: number, item: { quantity: number }) => total + item.quantity,
                    0
                );
                setCartItemCount(totalItems);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    const isActive = (href: string) => {
        return pathname === href;
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    }



  return (
    <>
        {/* Desktop Navigation */}
        <div className=' items-center justify-between p-4 lg:flex hidden px-20 bg-black h-36 font-poppins '>
        <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={100} height={100} className='w-auto h-24' priority />
        </Link>

            <div>
                <ul className='flex list-none gap-20 text-2xl'>
                    {links.map((link) => (
                        <Link key={link.name} href={link.href}>
                            <li className={` mx-4 text-white font-semibold hover:text-gray-400 cursor-pointer 
                        ${isActive(link.href) ? 'underline underline-offset-6 ' : ''}`}>
                                {link.name}
                            </li>
                        </Link>
                    ))}

                </ul>
            </div>
            
            {/* Desktop Icons */}
            <div className='flex gap-6 items-center'>
                <Link href="/orders" className={`cursor-pointer hover:opacity-75 transition-opacity ${isActive('/orders') ? 'opacity-100' : ''}`}>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="black"    xmlns="http://www.w3.org/2000/svg" >
                    <path fillRule="evenodd"   clipRule="evenodd" 
                    d="M14.6712 0C13.8455 0 13.0854 0.204715 12.2542 0.548636C11.4504 0.881639 10.5169 1.37159 9.35547 1.98164L6.53313 3.46241C5.10695 4.2103 3.96737 4.80943 3.08437 5.39765C2.17271 6.0077 1.46849 6.64914 0.956701 7.5185C0.446278 8.38512 0.216998 9.32408 0.106452 10.4418C-7.11781e-08 11.5268 0 12.8602 0 14.5389V14.8036C0 16.4823 -7.11781e-08 17.8157 0.106452 18.9006C0.216998 20.0198 0.447643 20.9573 0.956701 21.824C1.46849 22.6933 2.17134 23.3348 3.08574 23.9448C3.96601 24.533 5.10695 25.1322 6.53313 25.8801L9.35547 27.3608C10.5169 27.9709 11.4504 28.4608 12.2542 28.7938C13.0867 29.1378 13.8455 29.3425 14.6712 29.3425C15.4969 29.3425 16.2571 29.1378 17.0882 28.7938C17.8921 28.4608 18.8256 27.9709 19.987 27.3608L22.8093 25.8814C24.2355 25.1322 25.3751 24.533 26.2567 23.9448C27.1711 23.3348 27.874 22.6933 28.3858 21.824C28.8962 20.9573 29.1255 20.0184 29.236 18.9006C29.3425 17.8157 29.3425 16.4823 29.3425 14.805V14.5375C29.3425 12.8602 29.3425 11.5268 29.236 10.4418C29.1255 9.32272 28.8948 8.38512 28.3858 7.5185C27.874 6.64914 27.1711 6.0077 26.2567 5.39765C25.3765 4.80943 24.2355 4.2103 22.8093 3.46241L19.987 1.98164C18.8256 1.37159 17.8921 0.881639 17.0882 0.548636C16.2557 0.204715 15.4969 0 14.6712 0ZM10.263 3.81589C11.4777 3.17854 12.3293 2.73363 13.0362 2.44157C13.7241 2.15633 14.2086 2.04715 14.6712 2.04715C15.1353 2.04715 15.6184 2.15633 16.3062 2.44157C17.0132 2.73363 17.8634 3.17854 19.0781 3.81589L21.8076 5.24889C23.2952 6.02817 24.3392 6.57817 25.1212 7.09951C25.5061 7.35745 25.8077 7.59629 26.0534 7.83649L21.5073 10.1088L9.90684 4.00286L10.263 3.81589ZM7.77234 5.12333L7.53487 5.24889C6.04728 6.02817 5.00323 6.57817 4.22259 7.09951C3.88974 7.3158 3.57769 7.56252 3.29045 7.83649L14.6712 13.5276L19.2528 11.2348L8.05348 5.34169C7.94845 5.28478 7.85348 5.21101 7.77234 5.12333ZM2.30372 9.63115C2.23549 9.92321 2.18226 10.2549 2.14405 10.6411C2.04851 11.6155 2.04715 12.8479 2.04715 14.5907V14.7504C2.04715 16.4946 2.04715 17.7269 2.14405 18.7C2.23822 19.6513 2.417 20.2668 2.72134 20.7854C3.02432 21.2999 3.46241 21.7353 4.22259 22.243C5.00323 22.7643 6.04728 23.3143 7.53487 24.0936L10.2644 25.5266C11.479 26.1639 12.3293 26.6088 13.0362 26.9009C13.2582 26.9928 13.4621 27.0679 13.6477 27.1261V15.3031L2.30372 9.63115ZM15.6948 27.1247C15.8804 27.0674 16.0842 26.9928 16.3062 26.9009C17.0132 26.6088 17.8634 26.1639 19.0781 25.5266L21.8076 24.0936C23.2952 23.3129 24.3392 22.7643 25.1212 22.243C25.8801 21.7353 26.3181 21.2999 26.6225 20.7854C26.9268 20.2668 27.1043 19.6526 27.1984 18.7C27.294 17.7269 27.2953 16.4946 27.2953 14.7518V14.5921C27.2953 12.8479 27.2953 11.6155 27.1984 10.6424C27.1663 10.3028 27.113 9.9655 27.0387 9.63252L22.5186 11.8912V16.036C22.5186 16.3075 22.4108 16.5678 22.2188 16.7598C22.0269 16.9517 21.7665 17.0596 21.4951 17.0596C21.2236 17.0596 20.9632 16.9517 20.7713 16.7598C20.5793 16.5678 20.4715 16.3075 20.4715 16.036V12.9161L15.6948 15.3045V27.1247Z" fill="#D2D2D2"/>
                    </svg>
                </Link>

                {/* Cart Icon */}
                <Link href="/cart" className="relative cursor-pointer hover:opacity-75 transition-opacity">
                    <ShoppingCart className="w-7 h-7 text-gray-300" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cartItemCount > 9 ? '9+' : cartItemCount}
                        </span>
                    )}
                </Link>

                {user.isLoggedIn ? (
                    <ProfilePage />
                ) : (
                    <Link href="/login">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.34277 25.0272C1.34277 23.1961 2.07017 21.44 3.36494 20.1452C4.65971 18.8504 6.4158 18.123 8.24688 18.123H22.0551C23.8862 18.123 25.6423 18.8504 26.937 20.1452C28.2318 21.44 28.9592 23.1961 28.9592 25.0272C28.9592 25.9427 28.5955 26.8207 27.9481 27.4681C27.3007 28.1155 26.4227 28.4792 25.5072 28.4792H4.79483C3.87929 28.4792 3.00124 28.1155 2.35386 27.4681C1.70647 26.8207 1.34277 25.9427 1.34277 25.0272Z" stroke="#D2D2D2" strokeWidth="1.72603" strokeLinejoin="round"/>
                            <path d="M15.1507 11.2185C18.0105 11.2185 20.3288 8.90016 20.3288 6.04039C20.3288 3.18061 18.0105 0.862305 15.1507 0.862305C12.291 0.862305 9.97266 3.18061 9.97266 6.04039C9.97266 8.90016 12.291 11.2185 15.1507 11.2185Z" stroke="#D2D2D2" strokeWidth="1.72603"/>
                        </svg>
                    </Link>
                )}

                <Link href="/contactus" className={` px-3 lg:text-xl py-3 ${isActive('/contactus')?"bg-[#A6A5A5]":"bg-white"}  rounded-2xl`}>
                    Contact Us
                </Link>
            </div>
        </div>

        {/* Mobile Navigation */}
        <div className='lg:hidden bg-black font-poppins'>
            <div className='flex items-center justify-between p-4 px-6 h-16'>
                {/* Mobile Logo */}
                <Link href="/">
                    <Image src="/logo.svg" alt="Logo" width={60} height={60} className='w-auto h-12' priority />
                </Link>

                {/* Cart Icon and Menu button */}
                <div className="flex items-center gap-4">
                    {/* Mobile Cart Icon */}
                    <Link href="/cart" className="relative cursor-pointer">
                        <ShoppingCart className="w-6 h-6 text-gray-300" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cartItemCount > 9 ? '9+' : cartItemCount}
                            </span>
                        )}
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open main menu</span>
                        {isMobileMenuOpen ? (
                            <X className="block h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Menu className="block h-6 w-6" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="fixed top-16 right-0 w-full h-screen bg-black border-t border-gray-800 z-50"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-4">
                            {/* Navigation Links */}
                            {links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className={`block px-3 py-3 rounded-md text-lg font-semibold transition-colors ${
                                        isActive(link.href)
                                        ? 'text-white underline underline-offset-4'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                        </div>
                        
                        {/* Mobile Actions Section */}
                        <div className="border-t border-gray-800 px-4 py-4">
                            <div className="space-y-4">
                                {/* Orders Link */}
                                <Link
                                    href="/orders"
                                    onClick={closeMobileMenu}
                                    className="flex items-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 30 30" fill="currentColor" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" 
                                        d="M14.6712 0C13.8455 0 13.0854 0.204715 12.2542 0.548636C11.4504 0.881639 10.5169 1.37159 9.35547 1.98164L6.53313 3.46241C5.10695 4.2103 3.96737 4.80943 3.08437 5.39765C2.17271 6.0077 1.46849 6.64914 0.956701 7.5185C0.446278 8.38512 0.216998 9.32408 0.106452 10.4418C-7.11781e-08 11.5268 0 12.8602 0 14.5389V14.8036C0 16.4823 -7.11781e-08 17.8157 0.106452 18.9006C0.216998 20.0198 0.447643 20.9573 0.956701 21.824C1.46849 22.6933 2.17134 23.3348 3.08574 23.9448C3.96601 24.533 5.10695 25.1322 6.53313 25.8801L9.35547 27.3608C10.5169 27.9709 11.4504 28.4608 12.2542 28.7938C13.0867 29.1378 13.8455 29.3425 14.6712 29.3425C15.4969 29.3425 16.2571 29.1378 17.0882 28.7938C17.8921 28.4608 18.8256 27.9709 19.987 27.3608L22.8093 25.8814C24.2355 25.1322 25.3751 24.533 26.2567 23.9448C27.1711 23.3348 27.874 22.6933 28.3858 21.824C28.8962 20.9573 29.1255 20.0184 29.236 18.9006C29.3425 17.8157 29.3425 16.4823 29.3425 14.805V14.5375C29.3425 12.8602 29.3425 11.5268 29.236 10.4418C29.1255 9.32272 28.8948 8.38512 28.3858 7.5185C27.874 6.64914 27.1711 6.0077 26.2567 5.39765C25.3765 4.80943 24.2355 4.2103 22.8093 3.46241L19.987 1.98164C18.8256 1.37159 17.8921 0.881639 17.0882 0.548636C16.2557 0.204715 15.4969 0 14.6712 0ZM10.263 3.81589C11.4777 3.17854 12.3293 2.73363 13.0362 2.44157C13.7241 2.15633 14.2086 2.04715 14.6712 2.04715C15.1353 2.04715 15.6184 2.15633 16.3062 2.44157C17.0132 2.73363 17.8634 3.17854 19.0781 3.81589L21.8076 5.24889C23.2952 6.02817 24.3392 6.57817 25.1212 7.09951C25.5061 7.35745 25.8077 7.59629 26.0534 7.83649L21.5073 10.1088L9.90684 4.00286L10.263 3.81589ZM7.77234 5.12333L7.53487 5.24889C6.04728 6.02817 5.00323 6.57817 4.22259 7.09951C3.88974 7.3158 3.57769 7.56252 3.29045 7.83649L14.6712 13.5276L19.2528 11.2348L8.05348 5.34169C7.94845 5.28478 7.85348 5.21101 7.77234 5.12333ZM2.30372 9.63115C2.23549 9.92321 2.18226 10.2549 2.14405 10.6411C2.04851 11.6155 2.04715 12.8479 2.04715 14.5907V14.7504C2.04715 16.4946 2.04715 17.7269 2.14405 18.7C2.23822 19.6513 2.417 20.2668 2.72134 20.7854C3.02432 21.2999 3.46241 21.7353 4.22259 22.243C5.00323 22.7643 6.04728 23.3143 7.53487 24.0936L10.2644 25.5266C11.479 26.1639 12.3293 26.6088 13.0362 26.9009C13.2582 26.9928 13.4621 27.0679 13.6477 27.1261V15.3031L2.30372 9.63115ZM15.6948 27.1247C15.8804 27.0674 16.0842 26.9928 16.3062 26.9009C17.0132 26.6088 17.8634 26.1639 19.0781 25.5266L21.8076 24.0936C23.2952 23.3129 24.3392 22.7643 25.1212 22.243C25.8801 21.7353 26.3181 21.2999 26.6225 20.7854C26.9268 20.2668 27.1043 19.6526 27.1984 18.7C27.294 17.7269 27.2953 16.4946 27.2953 14.7518V14.5921C27.2953 12.8479 27.2953 11.6155 27.1984 10.6424C27.1663 10.3028 27.113 9.9655 27.0387 9.63252L22.5186 11.8912V16.036C22.5186 16.3075 22.4108 16.5678 22.2188 16.7598C22.0269 16.9517 21.7665 17.0596 21.4951 17.0596C21.2236 17.0596 20.9632 16.9517 20.7713 16.7598C20.5793 16.5678 20.4715 16.3075 20.4715 16.036V12.9161L15.6948 15.3045V27.1247Z" />
                                    </svg>
                                    <span className="text-lg font-medium">Orders</span>
                                </Link>

                                {/* Saved Addresses Link */}
                                <Link
                                    href="/saved-addresses"
                                    onClick={closeMobileMenu}
                                    className="flex items-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                                    </svg>
                                    <span className="text-lg font-medium">Saved Addresses</span>
                                </Link>

                                {/* Saved Sizes Link */}
                                <Link
                                    href="/saved-sizes"
                                    onClick={closeMobileMenu}
                                    className="flex items-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 17v2h18v-2H3zM3 5v2h18V5H3zm0 6v2h18v-2H3z" fill="currentColor"/>
                                        <path d="M7 14h10v-4H7v4z" fill="currentColor"/>
                                    </svg>
                                    <span className="text-lg font-medium">Saved Sizes</span>
                                </Link>

                                {/* Saved Payments Link */}
                                <Link
                                    href="/savedpayment"
                                    onClick={closeMobileMenu}
                                    className="flex items-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>
                                    </svg>
                                    <span className="text-lg font-medium">Saved Payments</span>
                                </Link>

                                {/* Auth Section */}
                                {user.isLoggedIn ? (
                                    <div className="px-3 py-3">
                                        <ProfilePage />
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={closeMobileMenu}
                                        className="flex items-center px-3 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 30 30" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.34277 25.0272C1.34277 23.1961 2.07017 21.44 3.36494 20.1452C4.65971 18.8504 6.4158 18.123 8.24688 18.123H22.0551C23.8862 18.123 25.6423 18.8504 26.937 20.1452C28.2318 21.44 28.9592 23.1961 28.9592 25.0272C28.9592 25.9427 28.5955 26.8207 27.9481 27.4681C27.3007 28.1155 26.4227 28.4792 25.5072 28.4792H4.79483C3.87929 28.4792 3.00124 28.1155 2.35386 27.4681C1.70647 26.8207 1.34277 25.9427 1.34277 25.0272Z" stroke="currentColor" strokeWidth="1.72603" strokeLinejoin="round"/>
                                            <path d="M15.1507 11.2185C18.0105 11.2185 20.3288 8.90016 20.3288 6.04039C20.3288 3.18061 18.0105 0.862305 15.1507 0.862305C12.291 0.862305 9.97266 3.18061 9.97266 6.04039C9.97266 8.90016 12.291 11.2185 15.1507 11.2185Z" stroke="currentColor" strokeWidth="1.72603"/>
                                        </svg>
                                        <span className="text-lg font-medium">Login</span>
                                    </Link>
                                )}

                                {/* Contact Us */}
                                <Link
                                    href="/contactus"
                                    onClick={closeMobileMenu}
                                    className={`block px-3 py-3 rounded-2xl text-center font-medium transition-colors ${
                                        isActive('/contactus')
                                        ? 'bg-[#A6A5A5] text-black'
                                        : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </>
  )
}

export default Nav