import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ExampleCards from "@/components/landing/ExampleCards";
import HowItWorks from "@/components/landing/HowItWorks";
import SampleLesson from "@/components/landing/SampleLesson";

import Safety from "@/components/landing/Safety";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import About from "@/components/landing/About";
import Footer from "@/components/landing/Footer";
import OpenSourceBanner from "@/components/OpenSourceBanner";
import PortfolioFooter from "@/components/PortfolioFooter";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ExampleCards />
      <HowItWorks />
      <SampleLesson />
      
      <Safety />
      <Pricing />
      <FAQ />
      <About />
      <Footer />
          <OpenSourceBanner />
          <PortfolioFooter />
    </div>
  );
};

export default Index;
