import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "7-day trial",
    features: ["1 child", "7-day curriculum preview", "Basic lessons", "Progress tracking"],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Family",
    price: "$9",
    period: "/month",
    features: ["Up to 3 children", "30-day rolling curriculum", "Full progress tracking", "Streak & badges", "Curriculum adaptation"],
    cta: "Get Family Plan",
    featured: true,
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    features: ["Up to 5 children", "Everything in Family", "Printable worksheets", "Parent guides", "Priority AI generation"],
    cta: "Get Premium",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-card">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-4">
          Simple, parent-friendly pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Start free. Upgrade when you're ready.
        </p>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`rounded-xl ${plan.featured ? "border-primary border-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]" : "shadow-[0_2px_8px_rgba(0,0,0,0.05)]"}`}
            >
              <CardHeader className="pb-4">
                {plan.featured && (
                  <div className="text-xs font-medium text-primary mb-2">Most popular</div>
                )}
                <CardTitle className="font-serif text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-serif text-3xl text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full rounded-lg"
                  variant={plan.featured ? "default" : "outline"}
                  asChild
                >
                  <Link to="/setup">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
