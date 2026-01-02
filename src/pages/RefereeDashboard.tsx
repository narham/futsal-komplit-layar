import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  User,
  Trophy,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Calendar,
  Bell,
} from "lucide-react";

// Mock data
const refereeProfile = {
  name: "Ahmad Rizky",
  license: "Lisensi A",
  rating: 4.8,
};

const summaryData = {
  totalEvents: 12,
  totalHonor: 4200000,
  lastHonorStatus: "verified", // pending, verified, paid
  pendingHonor: 700000,
};

const activeEvents = [
  {
    id: 1,
    name: "Liga Futsal Makassar",
    date: "20 Jan 2025",
    time: "14:00 WITA",
    location: "GOR Sudiang",
    match: "Makassar FC vs Sudiang United",
    status: "upcoming",
  },
  {
    id: 2,
    name: "Liga Futsal Makassar",
    date: "22 Jan 2025",
    time: "16:00 WITA",
    location: "GOR Sudiang",
    match: "Gowa Stars vs Maros FC",
    status: "upcoming",
  },
];

const completedEvents = [
  {
    id: 3,
    name: "Liga Futsal Makassar",
    date: "17 Jan 2025",
    match: "Rappocini FC vs Tamalanrea FC",
    honor: 350000,
    honorStatus: "paid",
  },
  {
    id: 4,
    name: "Liga Futsal Makassar",
    date: "15 Jan 2025",
    match: "Makassar FC vs Gowa Stars",
    honor: 350000,
    honorStatus: "verified",
  },
  {
    id: 5,
    name: "Turnamen Futsal Pelajar",
    date: "10 Jan 2025",
    match: "SMAN 1 vs SMAN 5",
    honor: 250000,
    honorStatus: "paid",
  },
];

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
    case "paid":
      return <StatusBadge status="success">Dibayar</StatusBadge>;
    case "verified":
      return <StatusBadge status="info">Diverifikasi</StatusBadge>;
    case "pending":
      return <StatusBadge status="warning">Menunggu</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
};

export default function RefereeDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("active");

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary-foreground/30">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">
                {refereeProfile.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm opacity-80">Selamat datang,</p>
              <h1 className="font-bold text-lg">{refereeProfile.name}</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="primary">{refereeProfile.license}</StatusBadge>
          <span className="text-sm opacity-80">⭐ {refereeProfile.rating}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-8 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{summaryData.totalEvents}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Event Ditangani
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <p className="text-lg font-bold">4.2M</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Total Honor
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-4 w-4 text-info" />
              </div>
              <p className="text-lg font-bold text-success">Verified</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Status Terakhir
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Honor Alert */}
        {summaryData.pendingHonor > 0 && (
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Honor Menunggu</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(summaryData.pendingHonor)}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Event List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Jadwal Event</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="active">
                    Aktif ({activeEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Selesai ({completedEvents.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0 p-4 pt-3 space-y-3">
                {activeEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada event aktif</p>
                  </div>
                ) : (
                  activeEvents.map((event) => (
                    <Card key={event.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {event.match}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {event.name}
                            </p>
                          </div>
                          <StatusBadge status="info">Akan Datang</StatusBadge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 p-4 pt-3 space-y-3">
                {completedEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{event.match}</h4>
                          <p className="text-xs text-muted-foreground">
                            {event.name} • {event.date}
                          </p>
                        </div>
                        {getHonorStatusBadge(event.honorStatus)}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          Honor
                        </span>
                        <span className="font-semibold text-sm text-primary">
                          {formatCurrency(event.honor)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
