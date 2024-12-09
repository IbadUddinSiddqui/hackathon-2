
import Header from "./components/Header/Header";

import Hero from "./components/Hero/Hero";
import SponsorSection from "./components/Sponsors/Sponsors";
import NewArrivals from "./components/NewArrivals/NewArrivals";
import TopSale from "./components/TopSale/TopSale";
import Browse from "./components/Browse/Browse";
import TestimonialCard from "./components/Testiomnials/Tetimonials";
import Footer from "./components/Footer/Footer";

export default function Home() {
  return (

    <>
        <Header/>
        <Hero></Hero>
        <SponsorSection/>
        <NewArrivals/>
        <TopSale/>
        <Browse/>
        <TestimonialCard/>
        <Footer/>
    </>
  );
}
