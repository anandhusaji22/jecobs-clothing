"use client"
import React,{useEffect,useState} from 'react'
import { useAppSelector } from '@/app/hooks'
import axios from 'axios';
import Image from 'next/image';

// Product interface based on the actual API response structure
interface Color {
  color: string;
  colorCode: string;
  _id: string;
}

interface Size {
  size: string;
  stock: number;
  _id: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  pricing: {
    basePrice: number;
    clothProvidedDiscount: number;
    clothType: {
      name: string;
      description?: string;
      materials: Array<{
        name: string;
        additionalCost: number;
        isAvailable: boolean;
      }>;
    };
  };
  images: string[];
  colors: Color[];
  sizes: Size[];
  denomination: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}





function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((state) => state.user);

  // Debug: Log user state
  console.log('Home component - User state:', {
    isLoggedIn: user.isLoggedIn,
    denomination: user.denomination,
    role: user.role,
    email: user.email
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // If user is logged in and has a denomination, fetch denomination-specific products
        if (user.isLoggedIn && user.denomination && user.denomination.trim() !== '') {
          console.log('Fetching products for denomination:', user.denomination);
          const res = await axios.get(`/api/products/denomination/${encodeURIComponent(user.denomination)}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('firebaseToken')}` }
          });
          
          if (res.data && res.data.success && res.data.data.products) {
            setProducts(res.data.data.products);
           
          }
        } else {
          // Fetch all products for guests or users without denomination
          console.log('Fetching all products for guest or user without denomination');
          const res = await axios.get('/api/products');
          
          if (res.data && res.data.success && res.data.data.products) {
            setProducts(res.data.data.products);
            
          }
        }
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('Error fetching products:', err);
        // Make sure products is always an array even on error
        setProducts([]);
      }
    };
    
    // Only fetch products if we have determined the user state
    // Don't fetch immediately if user.isLoggedIn is false but we're still loading auth state
    fetchProducts();

  }, [user.denomination, user.isLoggedIn]);



const handleClick = (productId: string) => {

  if(!user.isLoggedIn){
    // login and return here
    window.location.href = '/login';
    return;
  }
  else{
    window.location.href = `/products/${productId}`;
  }
}


  return (
    <div className='font-poppins lg:py-10 py-5 lg:px-10 flex flex-col lg:gap-10 items-center'>
      <div className='w-full'>
        <h1 className='lg:text-3xl text-xl font-bold text-center'>Our Priest Vestments</h1>
        <p className='text-center text-[#727272] lg:text-lg text-[8px]'>Handcrafted with reverence and precision, our liturgical vestments honor <br /> tradition  while providing comfort and dignity for sacred ceremonies.</p>
      </div>

      <div>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className='flex flex-wrap lg:gap-4 gap-2 max-w-7xl lg:px-0 px-3 py-3 justify-center '>
            {products.map((product: Product) => (
              <div key={product._id} className="border  rounded-lg shadow-[0px_0px_14px_0px_#0000004D]  transition-shadow lg:w-xl">
                <div className="relative lg:w-full lg:h-[500px]  mb-4 flex justify-center">
                  <Image 
                    onClick={() => handleClick(product._id)}
                    src={product.images && product.images.length > 0 ? `${product.images[0]}` : '/placeholder-image.jpg'} 
                    alt={product.name} 
                      width={700}
                    height={500}
                    className="object-fit  object-center rounded lg:w-full h-[350px] lg:h-auto "
                    
                    
                  />
                </div>


                {/* second section */}
                <div className='lg:p-4 p-2 flex flex-col lg:gap-2 gap-1'>
<div className='flex justify-between'>
                  <h2 className="lg:text-2xl text-lg font-semibold mb-2">{product.name}</h2>

                                {/* Available Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-2">
                    
                    <div className="flex gap-1">
                      {product.colors.slice(0, 3).map((color: Color) => (
                        <div 
                          key={color._id}
                          className="w-4 h-4 rounded-full border border-[#727272]"
                          style={{ backgroundColor: color.colorCode }}
                          title={color.color}
                        />
                      ))}
                      {product.colors.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                </div>

                <p className="text-[#696969] mb-2 line-clamp-2 lg:text-xl text-xs">{product.description}</p>
                

                
                {/* Available Sizes
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-1">Sizes:</p>
                    <div className="flex gap-1 flex-wrap">
                      {product.sizes.map((size: Size) => (
                        <span 
                          key={size._id}
                          className={`text-xs px-2 py-1 rounded ${
                            size.stock > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800 line-through'
                          }`}
                        >
                          {size.size}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
                
                <div className="flex justify-between items-center">
                  <p className="lg:text-lg text-xs font-bold">₹{product.pricing?.basePrice?.toFixed(2) || '0.00'}</p>
                  <span className="text-xs text-gray-500 uppercase">{product.denomination}</span>
                </div>

                  <div>
                    <button className='bg-black text-white w-full rounded-lg lg:py-2 py-1'
                    onClick={() => handleClick(product._id)}>
                      Order Now
                    </button>
                  </div>


                </div>


              </div>
            ))}
          </div>
        )}  
      </div>
    </div>
  )
}

export default Home