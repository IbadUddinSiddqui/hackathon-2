import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from '@/components/ui/button'
import { BsGithub } from "react-icons/bs";
import { LuInstagram } from "react-icons/lu";
import { FaFacebook } from "react-icons/fa";
import { TiSocialTwitter } from "react-icons/ti";

function Footer() {
  return (
    <>
    <div className='w-full min-w-full mt-44 '>
        <div className='flex justify-center  min-w-screen max-w-screen'>
        <div className=' w-[80%] h-80 lg:h-48 bg-black items-center justify-center lg:justify-between flex flex-col md:flex-row  top-16 right-4 rounded-lg relative   z-50'>
            <div className='w-[100%] md:w-[60%] lg:w-[50%]'>
                <p className='text-white mt-3 font-extrabold text-4xl  text-center'>STAY UPTO DATE ABOUT OUR LATEST OFFERS</p>
            </div>
            <div>
                <form >
                    <div className='flex- flex-col items-center justify-center'>
                    <input 
    type="email" 
    placeholder="Enter your email address" 
    className=" pl-12 py-2 border border-gray-300 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white bg-[url('/email.svg')] bg-no-repeat bg-left"
  /> </div> </form> 
  <Button variant={'outline'} className='py-2 px-12 rounded-full mt-1'>Subscribe To Newsletter</Button> 
  </div></div></div>
    <div className='w-full max-w-full  border-b-2 border-black   md:flex-row overflow-hidden  bg-[#F0F0F0]  py-16'>
     

      <div className='grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-4 p-4 '>
      <div className='flex flex-col col-span-2 md:col-span-1 items-center md:items-left text-center md:text-left text-black'>
          <div className=''><Image width={150} height={50} src='/logo-full-black.svg' alt='logo '  /></div>
          <p className='mt-2 text-base text-gray-500'>We have clothes that suits your style and which youre proud to wear. From women to men.</p>
          <div className='flex mt-4 gap-2'>
            <Link href='/' className='my-2'><TiSocialTwitter /></Link>
            <Link href='/'className='my-2'><FaFacebook /></Link>
            <Link href='/' className='my-2'><LuInstagram /></Link>
          <Link href='/' className='my-2  '><BsGithub /></Link>
          </div>
      </div>
        <div className='flex flex-col  text-center md:text-left text-black '>
            <h4 className='font-semibold my-3  '>COMPANY</h4>
            <Link href='/' className='my-2  '>About</Link>
            <Link href='/' className='my-2'>Features</Link>
            <Link href='/'className='my-2'>Works</Link>
            <Link href='/' className='my-2'>Carrer</Link>
            
        </div>
        <div className='flex flex-col  text-center md:text-left text-black '>
            <h4 className='font-semibold my-3'>HELP</h4>
            <Link href='/' className='my-2'>Customer Support</Link>
            <Link href='/' className='my-2'>Delivery Details</Link>
            <Link href='/'className='my-2'>Terms & Conditions</Link>
            <Link href='/' className='my-2'>Privacy Policy</Link>
        </div>
        <div className='flex flex-col  text-center md:text-left text-black '>
            <h4 className='font-semibold my-3'>FAQ</h4>
            <Link href='/' className='my-2'>Account</Link>
            <Link href='/' className='my-2'>Manage Deliveries</Link>
            <Link href='/'className='my-2'>Orders</Link>
            <Link href='/' className='my-2'>Payemnts</Link>
           
        </div>
        <div className='flex flex-col  text-center md:text-left text-black '>
            <h4 className='font-semibold my-3'>Resources</h4>
            <Link href='/' className='my-2'>Free Ebooks</Link>
            <Link href='/' className='my-2'>Development Tutorials</Link>
            <Link href='/'className='my-2'>How-To-Blog</Link>
            <Link href='/' className='my-2'>Youtube Playlist</Link>
           
        </div>

      </div>
    </div>
    <div className='max-w-screen bg-[#F0F0F0] flex flex-col md:flex-row md:justify-between mt-4'> 
        <p className='text-center m-4'>© 2000-2021, All rights reserved.</p>
        
            <div className='flex items-center justify-center m-4'>
                <Image width="66" height="49"  alt="logo" src='/visa.svg'/>
                <Image width="66" height="49"  alt="logo"src='/master.svg'/>
                <Image width="66" height="49"  alt="logo" src='/paypal.svg'/>
                <Image width="66" height="49"  alt="logo"src='/apple.svg'/>
                <Image width="66" height="49" alt="logo"src='/gpay.svg'/>
            </div>
            </div></div> 
    </>)
}

export default Footer
