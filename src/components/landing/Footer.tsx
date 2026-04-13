import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-start">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-serif text-sm text-foreground">LazyAcademy</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#safety" className="hover:text-foreground transition-colors">Safety</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} LazyAcademy. Making learning fun, one day at a time.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
