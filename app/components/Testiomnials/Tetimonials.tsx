"use client";
import React, { useState } from "react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa6";
import { FaArrowLeft } from "react-icons/fa6";
import {
  Card,
  CardContent,

  CardHeader,
  
} from "@/components/ui/card"

const TestimonialCard: React.FC = () => {
  const testimonials = [
    
    {     name: "Sarah M.",
      
      review:
        "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
      rating: 5,
    },
    {
      name: "Alex K.",
      review: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions",
      rating: 5,
    },
    {    
           name: "James L.",
        review:
          "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
        rating: 5,
      },
      {
        name: "Mooen",
        review:"As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
        rating: 4,
      },
      {     name: "Sarah M.",
      
        review: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”",
      rating: 5,
    },
    {     name: "Sarah M.",
      
      review:
        "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
      rating: 5,
    },
    {
      name: "Alex K.",
      review: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions",
      rating: 5,
    },
    {    
           name: "James L.",
        review:
          "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
        rating: 5,
      },
      {
        name: "Mooen",
        review:"As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
        rating: 4,
      },
      {     name: "Sarah M.",
      
        review: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”",
      rating: 5,
    },
    {     name: "Sarah M.",
      
      review:
        "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
      rating: 5,
    },
    {
      name: "Alex K.",
      review: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions",
      rating: 5,
    },
    {    
           name: "James L.",
        review:
          "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
        rating: 5,
      },
      {
        name: "Mooen",
        review:"As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
        rating: 4,
      },
      {     name: "Sarah M.",
      
        review: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”",
      rating: 5,
    },
    {     name: "Sarah M.",
      
      review:
        "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
      rating: 5,
    },
    {
      name: "Alex K.",
      review: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions",
      rating: 5,
    },
    {    
           name: "James L.",
        review:
          "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
        rating: 5,
      },
      {
        name: "Mooen",
        review:"As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
        rating: 4,
      },
      {     name: "Sarah M.",
      
        review: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”",
      rating: 5,
    },
      
  ];

  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 3;

  const startIndex = currentPage * testimonialsPerPage;
  const currentTestimonials = testimonials.slice(
    startIndex,
    startIndex + testimonialsPerPage
  );

  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);
  const isPrevDisabled = currentPage === 0;
  const isNextDisabled = startIndex + testimonialsPerPage >= testimonials.length;

  return (
    <div className="relative  p-8 mt-12" id="testimonial ">
        <div className="flex justify-between">
      <h2 className="text-left text-4xl ml-4 m-2 font-extrabold text-black">
        OUR HAPPY CUSTOMERS
      </h2>
       {/* Navigation Buttons */}
<div className="mt-6 ">
      <div className="absolute right-8 -top-[10px]   text-3xl flex space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          disabled={isPrevDisabled}
          className={`px-4 text-black  py-4 text-[22px] md:text-2xl lg:text-3xl ${
            isPrevDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-gray-500"
          }`}
        >
          <FaArrowLeft/>
        </button>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, Math.ceil(testimonials.length / testimonialsPerPage) - 1)
            )
          }
          disabled={isNextDisabled}
          className={`px-2 py-4 text-[22px] text-black md:text-2xl lg:text-3xl ${
            isNextDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-gray-500"
          }`}
        >
          <FaArrowRight />
        </button>
      </div></div></div>

      {/* Testimonial Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center ">
        {currentTestimonials.map((testimonial, index) => (
          <div
            key={index}
            className="p-6  bg-[#F7F7F7] border border-black w-72 md:w-80 lg:w-80 xl:w-96 2xl:w-[420px] rounded-sm shadow-lg"
          >
            <div className="flex mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill={i < testimonial.rating ? "black" : "white"}
                  className="w-6 h-6"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-left text-gray-800 text-lg italic mb-6">{`"${testimonial.review}"`}</p>
            <div className="flex items-center">
              <img
                src={testimonial.avatar}
                alt={`${testimonial.name}'s avatar`}
                className="w-16 h-16 rounded-full border border-black mr-4"
              />
              <div>
                <h3 className="text-lg font-semibold text-black">{testimonial.name}</h3>
                <p className="text-sm text-gray-600">{testimonial.designation}</p>
              </div>
            </div>
          </div>
        ))}
      </div> */}
     
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mt-4">
        
      {currentTestimonials.map((testimonial, index) => (
        <Card
          key={index}
          className="p-6  border h-[400px] md:h-[350px] border-black w-72 md:w-80 lg:w-80 xmd:w-[360px] xl:w-[420px] 2xl:w-[420px] rounded-3xl shadow-lg"
        >
          <CardHeader>
            <div className="flex mb-1 ">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill={i < testimonial.rating ? "gold" : "gray"}
                  className="w-6 h-6"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </CardHeader>
          <CardContent>
          <div className="flex ">
                <h3 className="text-lg font-semibold text-black">{testimonial.name}</h3>
                <Image src="/check.svg" alt="check sign"  width="24" height="25"/>
              </div>
            <p className="text-left text-gray-500 text-lg  mb-6">{`"${testimonial.review}"`}</p>
            <div className="flex items-center">
              
              
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

      {/* Pagination Dots */}
      <div className="flex flex-start ml-8 ">
      <div className="flex justify-center items-center mt-8">
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 mx-1 rounded-full ${
              index === currentPage ? "bg-black" : "bg-gray-300"
            }`}
          />
        ))}
      </div></div>

      
    </div>
  );
};

export default TestimonialCard;
