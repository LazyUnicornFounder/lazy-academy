import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ExampleCards from "@/components/landing/ExampleCards";
import HowItWorks from "@/components/landing/HowItWorks";
import SampleLesson from "@/components/landing/SampleLesson";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ExampleCards />
      <HowItWorks />
      <SampleLesson />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
