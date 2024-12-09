"use client";
/* eslint-disable */
import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const RatingTestimonial = () => {
  const [showAll, setShowAll] = useState(false);

  // Function to toggle testimonials visibility
  const toggleTestimonials = () => {
    setShowAll(!showAll);
  };

  const testimonials = [
    
    
        {     name: "Sarah M.",
          
          review:
            "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
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
              "As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
            rating: 5,
          },
          {
            name: "Mooen",
            review:"As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
            rating: 4,
          },
          {     name: "Sarah M.",
          
            review: "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations.",
          rating: 5,
        },
        {     name: "Sarah M.",
          
          review:
            "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
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
              "As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
            rating: 5,
          },
          {
            name: "Mooen",
            review:"As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
            rating: 4,
          },
          {     name: "Sarah M.",
          
            review: "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations.”",
          rating: 5,
        },
        {     name: "Sarah M.",
          
          review:
            "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
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
              "As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
            rating: 5,
          },
          {
            name: "Mooen",
            review:"As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
            rating: 4,
          },
          {     name: "Sarah M.",
          
            review: "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations.”",
          rating: 5,
        },
        {     name: "Sarah M.",
          
          review:
            "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations",
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
              "As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends",
            rating: 5,
          },
          {
            name: "Mooen",
            review:"As someone whos always on the lookout for unique fashion pieces, Im thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." ,
            rating: 4,
          },
          {     name: "Sarah M.",
          
            review: "Im blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece Ive bought has exceeded my expectations.”",
          rating: 5,
        },
          
      
    
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">What Our Customers Say</h1>
        <p className="text-xl text-gray-600">
          Hear from those who have experienced our services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2  gap-8">
        {testimonials.slice(0, showAll ? testimonials.length : 6).map((testimonial, index) => (
          <div
            key={index}
            className="bg-white shadow-lg p-6 transform h-[300px] transition-transform hover:scale-105 hover:shadow-xl rounded-md"
          >
            <div className="flex items-center mb-4">
              {Array.from({ length: 5 }, (_, starIndex) => (
                <FaStar
                  key={starIndex}
                  className={starIndex < testimonial.rating ? "text-yellow-500" : "text-gray-300"}
                />
              ))}
            </div>
            <p className="text-gray-700 italic mb-4">"{testimonial.review}"</p>
            <h3 className="text-xl font-semibold text-gray-900">{testimonial.name}</h3>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={toggleTestimonials}
          className="bg-black text-white hover:bg-white hover:text-black hover:border-black hover:border-2 px-4"
        >
          {showAll ? "View Fewer Testimonials" : "View All Testimonials"}
        </Button>
      </div>
    </div>
  );
};

export default RatingTestimonial;
