import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What ages is this for?",
    a: "LazyAcademy works for kids ages 3-16. The AI adjusts language complexity, activity types, and topics based on your child's age group.",
  },
  {
    q: "How long is each lesson?",
    a: "You choose — 15, 30, or 45 minutes per lesson. Each lesson has four sections (read, activity, listen, create) that you can do all at once or spread throughout the day.",
  },
  {
    q: "Do I need special materials?",
    a: "Most lessons use common household items like paper, pencils, and scissors. The AI avoids requiring anything unusual. Each lesson lists materials needed upfront.",
  },
  {
    q: "Can I change interests mid-curriculum?",
    a: "Yes! You can update interests anytime in Settings, and the AI will adapt the remaining lessons to incorporate the new topics.",
  },
  {
    q: "Is this a replacement for school?",
    a: "No — LazyAcademy is designed as a fun supplement to school, homeschool enrichment, or summer learning. It's meant to spark curiosity and make learning enjoyable.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-card">
      <div className="container max-w-2xl">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-12">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
