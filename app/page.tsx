

import type { Metadata } from "next";
import { getActiveTenant } from "@/lib/tenants";
import { SITE_NAME } from "@/lib/site";
import Hero from "./components/Hero/Hero";
import SponsorSection from "./components/Sponsors/Sponsors";
import NewArrivals from "./components/MensClothing/MensClothing";
import TopSale from "./components/Accessories/Accessories";
import Browse from "./components/Browse/Browse";
import TestimonialCard from "./components/Testiomnials/Tetimonials";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomeRecommendations from "./components/Recommendations/HomeRecommendations";

// P4-05 — tenant-branded homepage metadata (title/description use the active
// tenant's name instead of a hardcoded brand). `absolute` keeps the layout's
// `%s | {name}` template from appending a redundant suffix.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getActiveTenant();
  const name = tenant.name || SITE_NAME;
  return {
    title: { absolute: `${name} — Shop the Latest Pakistani Fashion` },
    description: `Shop ${name} — premium Pakistani fashion: t-shirts, kurtas, streetwear and more with nationwide delivery.`,
  };
}

export default function Home() {
  return (

    <>
        <Header></Header>
        <Hero></Hero>
        <SponsorSection/>
        <NewArrivals/>
        <TopSale/>
        <HomeRecommendations/>
        <Browse/>
        <TestimonialCard/>
        <Footer></Footer>
        
    </>
  );
}
