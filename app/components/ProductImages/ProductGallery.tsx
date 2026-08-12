import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FreeMode, Thumbs } from 'swiper/modules';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
}

// P10 — editorial gallery: the product is the page. Full-bleed 4/5 main
// image (no white 400×400 card, no rounded chrome), sharp corners, and a
// quiet vertical thumbnail rail. Main image scales on hover — a restrained
// material cue, not a decorative loop.
const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Thumbnails Slider — vertical rail, sharp, hairline borders */}
      <Swiper
        onSwiper={(swiper) => setThumbsSwiper(swiper)}
        direction="vertical"
        spaceBetween={8}
        slidesPerView={4}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Thumbs]}
        className="h-[28rem] w-20 overflow-hidden lg:w-24"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
              width={100}
              height={140}
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="h-full w-full cursor-pointer border border-brand-line object-cover transition-opacity hover:opacity-80"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Main Slider — full-bleed 4/5 editorial frame */}
      <Swiper
        loop={true}
        spaceBetween={10}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[Thumbs]}
        className="aspect-[4/5] w-full overflow-hidden bg-brand-surface-alt dark:bg-brand-charcoal"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
              width={800}
              height={1000}
              src={image}
              alt={`Product Image ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out hover:scale-[1.03]"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductGallery;
