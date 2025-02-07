import React, { useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import the Swiper class type
import { Swiper as SwiperClass } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

// Import required modules
import { FreeMode, Thumbs } from 'swiper/modules';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  // Correctly type the thumbsSwiper state
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);

  return (
    <div className="flex items-center justify-between gap-2 p-6 max-w-4xl mx-auto">
      {/* Thumbnails Slider */}
      <Swiper
        onSwiper={(swiper) => setThumbsSwiper(swiper)} // Pass the swiper instance to the state
        direction="vertical"
        spaceBetween={10}
        slidesPerView={4}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Thumbs]}
        className="w-24 h-96 overflow-hidden rounded-md"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
            width={100}
            height={100}
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full   h-full object-cover cursor-pointer transition-transform hover:scale-110 rounded-md"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Main Slider */}
      <Swiper
    
        loop={true}
        spaceBetween={10}
        thumbs={{ swiper: thumbsSwiper }} // Use the typed swiper state
        modules={[Thumbs]}
        className="w-96 h-96 rounded-lg"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
            width={400}
            height={400}
              src={image}
              alt={`Product Image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductGallery;
