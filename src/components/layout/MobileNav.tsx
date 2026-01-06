import { useState } from "react";
import { Home, Calendar, Users, ClipboardCheck, MoreHorizontal, Building2, UserCog, UserCheck, Database } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingCount } from "@/hooks/useRegistrations";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileNav = () => {
  const navigate = useNavigate();
  const { isAdminProvinsi, isAdmin } = useAuth();
  const { data: pendingCount } = usePendingCount();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Main nav items (max 5)
  const mainNavItems = [
    { icon: Home, label: "Beranda", path: "/dashboard" },
    { icon: Calendar, label: "Event", path: "/events" },
    { icon: Users, label: "Wasit", path: "/referees" },
    { icon: ClipboardCheck, label: "Evaluasi", path: "/evaluations" },
  ];

  // Additional items for "More" menu
  const moreNavItems = [
    ...(isAdminProvinsi() ? [
      { icon: Building2, label: "Organisasi", path: "/organization" },
      { icon: UserCog, label: "Manajemen User", path: "/users" },
      { icon: Database, label: "Export Database", path: "/database-export" },
    ] : []),
    ...(isAdmin() ? [
      { icon: UserCheck, label: "User Approval", path: "/user-approvals", badge: pendingCount },
    ] : []),
  ];

  const hasMoreItems = moreNavItems.length > 0;

  const handleMoreItemClick = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden pb-safe">
      <div className="flex items-center justify-around py-2">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px] relative",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground active:bg-muted"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}

        {hasMoreItems && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px] relative",
                  "text-muted-foreground hover:text-foreground active:bg-muted"
                )}
              >
                <div className="relative">
                  <MoreHorizontal className="h-5 w-5" />
                  {pendingCount && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">Lainnya</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-safe">
              <SheetHeader className="pb-4">
                <SheetTitle>Menu Lainnya</SheetTitle>
              </SheetHeader>
              <div className="space-y-1">
                {moreNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted active:bg-muted transition-colors min-h-[48px]"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {'badge' in item && item.badge && item.badge > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};
