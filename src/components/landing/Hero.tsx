import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container text-center">
        <h1 className="mx-auto max-w-3xl text-4xl leading-tight md:text-6xl md:leading-tight text-foreground">
          Your kid's personalized school. Built in 60 seconds.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Pick their age. Pick their interests. AI creates a 30-day curriculum with daily lessons they'll actually enjoy.
        </p>
        <div className="mt-10">
          <Button size="lg" className="h-14 px-8 text-base rounded-xl" asChild>
            <Link to="/setup">
              Create a Curriculum — Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
