import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { label: "Number of children", free: "1", pro: "Unlimited" },
  { label: "Curriculum modules", free: "1 per week", pro: "All modules" },
  { label: "Daily lessons & exercises", free: true, pro: true },
  { label: "Progress tracking", free: true, pro: true },
  { label: "Streaks & badges", free: true, pro: true },
  { label: "Parent dashboard", free: true, pro: true },
  { label: "Weekly email reports", free: false, pro: true },
  { label: "Printable worksheets", free: false, pro: true },
  { label: "Spaced repetition reviews", free: false, pro: true },
  { label: "Module capstone projects", free: false, pro: true },
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
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Free */}
          <Card className="rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-xl">Free</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="font-serif text-3xl text-foreground">$0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.map((f) => {
                  const val = f.free;
                  const supported = val === true || typeof val === "string";
                  return (
                    <li key={f.label} className={`flex items-start gap-2 text-sm ${!supported ? "opacity-40" : ""}`}>
                      {supported ? (
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <span className="text-muted-foreground">
                        {f.label}
                        {typeof val === "string" && <span className="text-foreground font-medium"> — {val}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-12" asChild>
                <Link to="/setup">Start Free</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="rounded-2xl border-primary border-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <CardHeader className="pb-4">
              <div className="text-xs font-medium text-primary mb-2">Most popular</div>
              <CardTitle className="font-serif text-xl">Pro</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="font-serif text-3xl text-foreground">$9</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.map((f) => {
                  const val = f.pro;
                  return (
                    <li key={f.label} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        {f.label}
                        {typeof val === "string" && <span className="text-foreground font-medium"> — {val}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Button className="w-full rounded-xl h-12" asChild>
                <Link to="/setup">Get Pro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
