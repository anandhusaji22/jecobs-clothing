import React from 'react'
import Image from 'next/image';

function Page() {

    const items = [
        { name: 'Expert Craftsmanship',desc:"Over 25 years of experience in creating liturgical vestments with traditional techniques and modern precision.", href: 'scis.svg' },
        { name: 'Premium Materials',desc:"We use only the finest fabrics and materials, sourced from trusted suppliers who understand ecclesiastical requirements.", href: 'badge.svg' },
        { name: 'Timely Delivery',desc:"Committed to delivering your vestments on schedule for important liturgical seasons and ceremonies.", href: 'clock.svg' },
        { name: 'Sacred Dedication', desc:"Each garment is crafted with reverence and respect for its sacred purpose in religious ceremonies.",href: 'heart.svg' },
    ];

  return (
    <div className='lg:px-16 font-poppins'>
        <div className='flex flex-col lg:gap-10 lg:py-10 gap-3 py-5 px-3 lg:px-20'>
            <h1 className='text-center lg:text-5xl text-xl font-bold'>
            About Us
        </h1>
        <p className='text-center text-lg text-[#727272] text lg:block hidden'>
            Jacob&apos;s has been serving parish priests with trust and dedication since 1995. <br />
            For nearly three decades, we&apos;ve been known for our craftsmanship, perfect fitting, <br />
            and sincere commitment to quality. <br />
        </p>
        <p className='text-center text-[8px] text-[#727272]   lg:hidden'>
            Jacob&apos;s has been serving parish priests with trust and dedication since 1995. 
            For nearly three decades, we&apos;ve been known for our craftsmanship, perfect fitting, 
            and sincere commitment to quality. 
        </p>

        <p className='text-center lg:text-lg lg:block hidden '>
            We proudly serve priests from Orthodox, Jacobite, Mar Thoma, and CSI <br />
            communities — understanding the traditions, values, and grace each <br />
            parish represents. What started as a small tailoring unit has grown <br />
            into a name respected for its faithful service and timeless workmanship. <br />
            At Jacob&apos;s, every stitch carries a story of faith, devotion, and <br />
            tradition — a legacy we&apos;re truly blessed to continue. <br />
            <br />
            <strong>Address:</strong> NMRA-71, Nettoor, Maradu, Kochi, Ernakulam, Kerala 682040 <br />
            <strong>Email:</strong> jacobsnettoor@gmail.com

        </p>

         <p className='text-center text-[8px]  lg:hidden '>
            We proudly serve priests from Orthodox, Jacobite, Mar Thoma, and CSI 
            communities — understanding the traditions, values, and grace each 
            parish represents. What started as a small tailoring unit has grown 
            into a name respected for its faithful service and timeless workmanship. 
            At Jacob&apos;s, every stitch carries a story of faith, devotion, and 
            tradition — a legacy we&apos;re truly blessed to continue. 
            <br />
            <strong>Address:</strong> NMRA-71, Nettoor, Maradu, Kochi, Ernakulam, Kerala 682040 
            <br />
            <strong>Email:</strong> jacobsnettoor@gmail.com

        </p>
        </div>

            <div className=' w-full flex justify-center lg:py-10 py-5 lg:px-0 px-3'>
                <div className='flex max-w-7xl flex-wrap lg:gap-8 gap-3 items-center justify-center '>

                {items.map((item) => (
                    <div key={item.name} className="flex items-center  lg:w-[39rem] lg:h-80  bg-[#424242] rounded-3xl lg:p-10 p-5 text-white">
                        <div className='flex '>
                            <Image src={`/${item.href}`} alt={item.name} width={48} height={50} className="lg:w-12 w-6 h-6 mr-2 lg:h-12 lg:mr-4" />
                        <div className='flex flex-col lg:gap-4 gap-1  '>
                            <h3 className='lg:text-3xl text-lg font-semibold'>{item.name}</h3>
                            <p className='text-[#D2CDCD] lg:text-xl text-xs'>{item.desc}</p>
                        </div>
                        </div>
                        
                    </div>
                ))}
                </div>
            </div>

    </div>
  )
}

export default Page