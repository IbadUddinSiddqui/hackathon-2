

import type { Metadata } from "next";
import Hero from "./components/Hero/Hero";
import SponsorSection from "./components/Sponsors/Sponsors";
import NewArrivals from "./components/MensClothing/MensClothing";
import TopSale from "./components/Accessories/Accessories";
import Browse from "./components/Browse/Browse";
import TestimonialCard from "./components/Testiomnials/Tetimonials";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomeRecommendations from "./components/Recommendations/HomeRecommendations";

export const metadata: Metadata = {
  title: "AnK's — Shop the Latest Pakistani Fashion",
  description:
    "Shop AnK's — premium Pakistani fashion: t-shirts, kurtas, streetwear and more with nationwide delivery.",
};

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
