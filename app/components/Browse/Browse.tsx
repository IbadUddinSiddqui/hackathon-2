import React from 'react';
import Link from 'next/link';

function Browse() {
    return (
        <div className="min-w-screen flex justify-center items-center">
            <div className="w-[85%] rounded-md shadow-md bg-[#F0F0F0] p-12">
                <div className="text-center mb-10 mt-12">
                    <h2 className="text-5xl font-extrabold mb-4">BROWSE BY DRESS STYLE</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
                        
                    <Link href="/products/casual" className="bg-[#FFFFFF] text-bold text-start  bg-cover bg-bottom h-[290px] text-xl">
                            <div className="bg-[#FFFFFF] text-bold text-start p-6 bg-cover bg-bottom h-[290px] text-xl" style={{ backgroundImage: 'url("/image-11.svg")' }}>
                                <p className='font-bold'>Casual</p>
                            </div>
                        </Link>
                        <Link href="/products/formal" className='bg-[#FFFFFF] text-bold text-start  md:col-span-2 bg-cover bg-center h-[290px] text-xl md:bg-left-top'>
                        <div   className='bg-[#FFFFFF] text-bold text-start p-6 md:col-span-2 bg-cover bg-center h-[290px] text-xl md:bg-left-top' style={{ backgroundImage: 'url("/image-13.svg")' }}>
                            <p className='font-bold'>Formal</p>
                        </div></Link>
                        <Link href="/products/party" className='bg-[#FFFFFF] text-bold text-start md:col-span-2 bg-cover bg-center h-[290px] text-xl'>
                        <div className='bg-[#FFFFFF] text-bold text-start p-6 md:col-span-2 bg-cover bg-center h-[290px] text-xl' style={{ backgroundImage: 'url("/image-12.svg")' }}>
                            <p className='font-bold'>Party</p>
                        </div></Link>
                        <Link href="/products/gym"  className="bg-[#FFFFFF] text-bold text-start  bg-cover bg-center h-[290px] text-xl">
                        <div  className="bg-[#FFFFFF] text-bold text-start p-6 bg-cover bg-center h-[290px] text-xl" style={{ backgroundImage: 'url("/image-14.svg")' }}>
                            <p className='font-bold absolute'>Gym</p>
                        </div></Link>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Browse;
