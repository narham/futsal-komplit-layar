import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
  { icon: CalendarDays, label: "Event", path: "/referee/events" },
  { icon: BookOpen, label: "Belajar", path: "/referee/learning" },
  { icon: MessageSquare, label: "Diskusi", path: "/referee/discussions" },
  { icon: User, label: "Profil", path: "/referee/profile" },
];

export const RefereeNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
