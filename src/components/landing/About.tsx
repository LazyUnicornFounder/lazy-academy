import { GraduationCap } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-24 border-t border-border/50">
      <div className="container max-w-2xl text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">About Lazy Academy</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Lazy Academy uses AI to build personalized, interest-driven curricula that make learning feel like play. 
          No rigid schedules, no boring worksheets — just daily lessons tailored to what your child actually cares about.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Lazy Academy is part of{" "}
          <a
            href="https://lazyfounderventures.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            Lazy Founder Ventures
          </a>
          , building tools that help families learn, grow, and thrive.
        </p>
      </div>
    </section>
  );
};

export default About;
