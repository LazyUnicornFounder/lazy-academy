import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "My son asks to do his 'learning game' every morning before school. That never happened before.",
    name: "Sarah M.",
    detail: "Mom of 2, ages 6 & 9",
  },
  {
    quote: "The lessons actually connect to what my daughter loves. She's learning math through her dinosaur obsession.",
    name: "James K.",
    detail: "Dad, age 7",
  },
  {
    quote: "As a homeschooling parent, this saved me hours of curriculum planning every week.",
    name: "Priya R.",
    detail: "Homeschool mom, age 10",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-12">
          Parents love it
        </h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <Card key={t.name} className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed text-foreground mb-4">"{t.quote}"</p>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.detail}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
