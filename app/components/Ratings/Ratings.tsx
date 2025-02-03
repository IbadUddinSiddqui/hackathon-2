"use client";

import React, { useState } from 'react';

import RatingTestimonial from '../Testiomnials/RatingTestimonial';
import FaqTab from '../FaqTab/Faq';

import ProductDetails from '../ProductDetails/ProductDetails';


// Define the type for the course
// Define the course categories as a record of key-value pairs


const CourseTabs: React.FC = () => {
    const faqData = [
        {
          question: "What is the refund policy?",
          answer:
            "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Distinctio, error!",
        },
        {
          question: "How do I contact support?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quisquam, perferendis.",
        },
        {
          question: "Are there any prerequisites for this course?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae, facere.",
        },
        {
          question: "What is the refund policy?",
          answer:
            "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Distinctio, error!",
        },
        {
          question: "How do I contact support?",
          answer:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quisquam, perferendis.",
        },
        {
          question: "Are there any prerequisites for this course?",
          answer:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae, facere.",
        },
      ];
    // State to manage the active tab
    const [activeTab, setActiveTab] = useState<'popular' | 'newest' | 'cheapest'>('popular');
    const [showAll, setShowAll] = useState(false); // State to control "View More" Button
console.log(showAll)
    // Function to handle tab click
    const handleTabClick = (tab: 'popular' | 'newest' | 'cheapest') => {
        setActiveTab(tab);
        setShowAll(false);
    };

    // Get the courses to display based on the active tab

    // Get the position of the active tab
    const getTabPosition = (tab: 'popular' | 'newest' | 'cheapest') => {
        if (tab === 'popular') return 0;
        if (tab === 'newest') return 1;
        if (tab === 'cheapest') return 2;
        return 0;
    };

    return (
        <div className=" mx-auto mt-16 max-w-screen overflow-hidden border-2 border-t border-gray-500 " >
            

            {/* Tab Navigation */}
            <div className="relative md:w-[40%] mx-auto mt-6">
                <div className="flex justify-around">
                    <button
                        className={`px-4 py-2 ${activeTab === 'popular' ? 'bg-white text-black' : 'bg-white text-black'
                            } rounded-md transition-all hover:text-black`}
                        onClick={() => handleTabClick('popular')}
                    >
                        Product Details
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'newest' ? 'bg-white text-black' : 'bg-white text-black'
                            } rounded-md transition-all hover:text-black`}
                        onClick={() => handleTabClick('newest')}
                    >
                        Reviews & Ratings
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'cheapest' ? 'bg-white text-black' : 'bg-white text-black'
                            } rounded-md transition-all hover:text-black`}
                        onClick={() => handleTabClick('cheapest')}
                    >
                        FAQs
                    </button>
                </div>

                {/* Underline Animation */}
                <span
                    className="absolute bottom-0 left-0 h-[1px] bg-black transition-transform duration-300"
                    style={{
                        width: '33.33%',
                        transform: `translateX(${getTabPosition(activeTab) * 100}%)`,
                    }}
                ></span>
            </div>

            {/* Display Courses Based on Active Tab */}
            {activeTab === 'popular' && (
                <ProductDetails/>
            )}

            {activeTab === 'newest' && (
<RatingTestimonial/>
            )}

            {activeTab === 'cheapest' && (
                <FaqTab faqs={faqData}/>
            )}

            {/* View More Button */}
           
        </div>
    );
};

export default CourseTabs;
