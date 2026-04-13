import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-12">
      <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-serif text-sm text-foreground">LazyAcademy</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LazyAcademy. Making learning fun, one day at a time.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
