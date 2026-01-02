import { Calendar, Users, Trophy, DollarSign, ArrowRight, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const stats = [
  { title: "Total Event", value: 12, icon: Calendar, trend: { value: 8, isPositive: true } },
  { title: "Wasit Aktif", value: 48, icon: Users, trend: { value: 5, isPositive: true } },
  { title: "Pertandingan", value: 156, icon: Trophy },
  { title: "Pendapatan", value: "Rp 24.5M", icon: DollarSign, trend: { value: 12, isPositive: true } },
];

const upcomingEvents = [
  {
    id: 1,
    name: "Liga Futsal Makassar 2024",
    date: "15 Jan 2024",
    location: "GOR Sudiang",
    status: "active",
    matches: 8,
  },
  {
    id: 2,
    name: "Turnamen Antar Kabupaten",
    date: "22 Jan 2024",
    location: "GOR Mattoangin",
    status: "upcoming",
    matches: 16,
  },
  {
    id: 3,
    name: "Piala Gubernur Sul-Sel",
    date: "5 Feb 2024",
    location: "GOR Sudiang",
    status: "upcoming",
    matches: 32,
  },
];

const recentReferees = [
  { id: 1, name: "Ahmad Rizky", rating: 4.8, matches: 24 },
  { id: 2, name: "Budi Santoso", rating: 4.6, matches: 18 },
  { id: 3, name: "Cahya Putra", rating: 4.5, matches: 15 },
];

export default function Dashboard() {
  return (
    <AppLayout title="FFSS">
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-primary-foreground">
          <h2 className="text-xl font-bold mb-1">Selamat Datang!</h2>
          <p className="text-sm text-primary-foreground/80">
            Kelola event, wasit, dan evaluasi federasi futsal dengan mudah.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Event Mendatang</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events" className="text-primary">
                  Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{event.name}</h4>
                  <StatusBadge status={event.status === "active" ? "success" : "info"}>
                    {event.status === "active" ? "Berlangsung" : "Akan Datang"}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Top Referees */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Wasit Terbaik</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/referees" className="text-primary">
                  Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReferees.map((referee, index) => (
                <div
                  key={referee.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {referee.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{referee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {referee.matches} pertandingan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{referee.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
