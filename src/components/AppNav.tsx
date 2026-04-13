import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Trophy, Users, Settings, GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { path: "/app", label: "Lessons", icon: BookOpen },
  { path: "/app/my-stuff", label: "My Stuff", icon: Trophy },
  { path: "/app/parent", label: "Parent", icon: Users },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

const AppNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app" || location.pathname.startsWith("/app/lesson");
    return location.pathname === path;
  };

  return (
    <header className="border-b border-[#e5e4de] bg-[#faf9f5] sticky top-0 z-40">
      <div className="container flex h-14 items-center justify-between">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 shrink-0"
        >
          <GraduationCap className="h-5 w-5 text-[#c96442]" />
          <span className="font-serif text-base text-[#141413] hidden sm:inline">Lazy Academy</span>
        </button>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#c96442]/10 text-[#c96442]"
                    : "text-[#87867f] hover:text-[#141413] hover:bg-[#e5e4de]/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#87867f] hover:text-[#141413] hover:bg-[#e5e4de]/50 transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppNav;
