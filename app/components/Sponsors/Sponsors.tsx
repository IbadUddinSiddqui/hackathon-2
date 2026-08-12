import React from 'react';
import Image from 'next/image';

const SponsorSection = () => {
  return (
    /* Floating frosted bar instead of a hard edge-to-edge band: the
       translucent dark glass + blur reads as an overlaid element against the
       page (the logos are white-filled, so the backdrop stays dark in both
       modes). No new tokens — existing black-2/white + alpha. */
    <div className="min-w-full overflow-hidden py-5">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-center overflow-hidden rounded-2xl bg-black-2/85 px-4 shadow-lg shadow-black/10 ring-1 ring-white/10 backdrop-blur-xl dark:shadow-black/40 dark:ring-white/15 lg:px-8">
        <div className="flex animate-scroll gap-4 md:gap-6">
          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />

          {/* Repeat logos to ensure smooth animation */}
          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />

          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />

          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />

          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />

          <Image className="m-4" src="/brand.svg" width="194" height="32" alt="logo1" />
          <Image className="m-4" src="/brand1.svg" width="157" height="34" alt="logo2" />
          <Image className="m-4" src="/brand2.svg" width="92" height="38" alt="logo3" />
          <Image className="m-4" src="/brand3.svg" width="167" height="34" alt="logo4" />
          <Image className="m-4" src="/brand4.svg" width="208" height="34" alt="logo5" />
        </div>
      </div>
    </div>
  );
};

export default SponsorSection;
