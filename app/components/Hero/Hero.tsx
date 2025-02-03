import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

function Hero() {
  return (
    <section className="bg-[#F2F0F1] w-full flex flex-col md:flex-row max-w-screen">
     {/* Left Side Div */}
     <div
        className="w-full md:w-[50%] h-auto md:h-[663px] flex justify-center items-center flex-col p-6 md:p-12"
        aria-label="Content"
      >
        <div className="flex  flex-col justify-center items-start text-left">
          <h1 className="font-extrabold text-4xl lg:w-[20rem] xl:w-[25rem] sm:text-4xl md:text-5xl lg:text-6 xl mt-4 md:ml-8 leading-snug">
            FIND CLOTHES THAT MATCH YOUR STYLE
          </h1>
          <p className="font-medium text-sm sm:text-base lg:text-lg mt-4 md:ml-8 leading-relaxed">
            Browse through our diverse range of meticulously crafted garments, designed <br />
            to bring out your individuality and cater to your sense of style.
          </p>
          <div className="flex justify-start mt-6 md:ml-8">
            <Button
              variant="outline"
              className="bg-black py-3 px-8 rounded-full w-[80vw] ml-8 sm:w-auto text-white text-sm sm:text-base"
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>


      {/* Image Div */}
      <div
        className="w-full  h-[400px] md:h-[663px] bg-[url('/hero.svg')] background"
        aria-label="Background"
      >
        <Image
          src="/vector.svg"
          width={100}
          height={56}
          alt="star-vector"
          className="hidden lg:block absolute top-1/3 right-8"
        />
        <Image
          src="/vector.svg"
          width={56}
          height={56}
          alt="star-vector"
          className="hidden lg:block absolute top-3/4 right-[700px]"
        />
      </div>
    </section>
  );
}

export default Hero;
