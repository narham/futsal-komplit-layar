import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuickActionGrid, QuickActionItem } from "@/components/ui/quick-action-grid";
import {
  CalendarDays,
  Trophy,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Bell,
  Loader2,
  AlertCircle,
  BookOpen,
  MessageSquare,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useHonorStats, useHonors } from "@/hooks/useHonors";
import { useUpcomingRefereeEvents, usePendingAssignments } from "@/hooks/useRefereeEvents";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RefereeNav } from "@/components/layout/RefereeNav";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getHonorStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <StatusBadge status="success">Terverifikasi</StatusBadge>;
    case "submitted":
      return <StatusBadge status="warning">Menunggu</StatusBadge>;
    case "draft":
      return <StatusBadge status="neutral">Draft</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
};

const getLicenseLabel = (level: string | null) => {
  if (!level) return "Belum ada lisensi";
  const labels: Record<string, string> = {
    level_1: "Lisensi Level 1",
    level_2: "Lisensi Level 2", 
    level_3: "Lisensi Level 3",
  };
  return labels[level] || level;
};

export default function RefereeDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: honorStats } = useHonorStats();
  const { data: honors } = useHonors();
  const { data: upcomingEvents } = useUpcomingRefereeEvents();
  const { data: pendingAssignments } = usePendingAssignments();

  // Get completed honors
  const completedHonors = honors?.filter(h => h.status === "verified") || [];
  const pendingHonors = honors?.filter(h => h.status === "submitted") || [];
  
  const pendingAmount = pendingHonors.reduce((sum, h) => sum + h.amount, 0);

  // Quick action items
  const quickActions: QuickActionItem[] = [
    { 
      icon: CalendarDays, 
      label: "Event Saya", 
      path: "/referee/events",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary",
      badge: pendingAssignments?.length || undefined
    },
    { 
      icon: BookOpen, 
      label: "Belajar", 
      path: "/referee/learning",
      iconBgClass: "bg-info/10",
      iconColorClass: "text-info"
    },
    { 
      icon: MessageSquare, 
      label: "Diskusi", 
      path: "/referee/discussions",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
    { 
      icon: DollarSign, 
      label: "Honor", 
      path: "/referee/honor",
      iconBgClass: "bg-success/10",
      iconColorClass: "text-success",
      badge: pendingHonors.length > 0 ? pendingHonors.length : undefined
    },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground p-4 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary-foreground/30 shadow-lg">
              <AvatarImage src={profile?.profile_photo_url || ""} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-lg">
                {profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs opacity-80">Selamat datang,</p>
              <h1 className="font-bold text-lg">{profile?.full_name || "Wasit"}</h1>
              <StatusBadge status="primary" className="mt-1 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-[10px]">
                {getLicenseLabel(profile?.license_level || null)}
              </StatusBadge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-10 space-y-4">
        {/* Summary Stats Card */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="text-center px-2">
                <div className="icon-circle-sm bg-primary/10 mx-auto mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-bold">{honors?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Event</p>
              </div>
              <div className="text-center px-2">
                <div className="icon-circle-sm bg-success/10 mx-auto mb-2">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <p className="text-lg font-bold">
                  {honorStats?.total_earned 
                    ? (honorStats.total_earned / 1000000).toFixed(1) + "jt" 
                    : "0"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">Total Honor</p>
              </div>
              <div className="text-center px-2">
                <div className="icon-circle-sm bg-info/10 mx-auto mb-2">
                  <CheckCircle2 className="h-4 w-4 text-info" />
                </div>
                <p className="text-lg font-bold text-success">
                  {completedHonors.length > 0 ? "✓" : "-"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Akses Cepat
          </h3>
          <QuickActionGrid items={quickActions} columns={4} />
        </section>

        {/* Pending Assignment Alert */}
        {pendingAssignments && pendingAssignments.length > 0 && (
          <Link to="/referee/events">
            <Alert className="bg-warning/10 border-warning/30 cursor-pointer hover:bg-warning/15 active:bg-warning/20 transition-colors">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning flex items-center justify-between">
                <span>{pendingAssignments.length} penugasan menunggu konfirmasi</span>
                <ChevronRight className="h-4 w-4" />
              </AlertDescription>
            </Alert>
          </Link>
        )}

        {/* Upcoming Events Preview */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Event Mendatang
                </CardTitle>
                <Link to="/referee/events">
                  <Button variant="ghost" size="sm" className="text-xs min-h-[36px] h-8">
                    Lihat Semua
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.slice(0, 2).map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                >
                  <div className="icon-circle-sm bg-primary/10 flex-shrink-0">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {assignment.event?.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {assignment.event?.start_date 
                          ? format(new Date(assignment.event.start_date), "dd MMM yyyy", { locale: id })
                          : "-"
                        }
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={assignment.role === "UTAMA" ? "primary" : "info"}>
                    {assignment.role}
                  </StatusBadge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Honor Alert */}
        {pendingAmount > 0 && (
          <Link to="/referee/honor">
            <Card className="bg-warning/10 border-warning/30 active:bg-warning/15 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-circle-sm bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Honor Menunggu</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(pendingAmount)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Honor History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Riwayat Honor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="active" className="min-h-[40px]">
                    Menunggu ({pendingHonors.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="min-h-[40px]">
                    Selesai ({completedHonors.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0 p-4 pt-3 space-y-3">
                {pendingHonors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada honor menunggu</p>
                  </div>
                ) : (
                  pendingHonors.map((honor) => (
                    <Card key={honor.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">
                              {honor.events?.name || "Event tidak ditemukan"}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {honor.notes || "Tidak ada catatan"}
                            </p>
                          </div>
                          {getHonorStatusBadge(honor.status)}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {honor.events?.start_date || "-"}
                          </span>
                          <span className="font-semibold text-sm text-warning">
                            {formatCurrency(honor.amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 p-4 pt-3 space-y-3">
                {completedHonors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada honor terverifikasi</p>
                  </div>
                ) : (
                  completedHonors.map((honor) => (
                    <Card key={honor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">
                              {honor.events?.name || "Event tidak ditemukan"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {honor.events?.start_date || "-"}
                            </p>
                          </div>
                          {getHonorStatusBadge(honor.status)}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            Honor
                          </span>
                          <span className="font-semibold text-sm text-success">
                            {formatCurrency(honor.amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <RefereeNav />
    </div>
  );
}
