import { useState } from "react";
import { Plus, Search, Filter, Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const events = [
  {
    id: 1,
    name: "Liga Futsal Makassar 2024",
    date: "15 Jan - 28 Feb 2024",
    location: "GOR Sudiang",
    status: "active",
    totalMatches: 48,
    completedMatches: 12,
    referees: 8,
  },
  {
    id: 2,
    name: "Turnamen Antar Kabupaten",
    date: "22 Jan - 5 Feb 2024",
    location: "GOR Mattoangin",
    status: "upcoming",
    totalMatches: 16,
    completedMatches: 0,
    referees: 4,
  },
  {
    id: 3,
    name: "Piala Gubernur Sul-Sel",
    date: "5 Feb - 20 Feb 2024",
    location: "GOR Sudiang",
    status: "upcoming",
    totalMatches: 32,
    completedMatches: 0,
    referees: 6,
  },
  {
    id: 4,
    name: "Liga Futsal Gowa",
    date: "1 Dec - 20 Dec 2023",
    location: "GOR Gowa",
    status: "completed",
    totalMatches: 24,
    completedMatches: 24,
    referees: 5,
  },
  {
    id: 5,
    name: "Turnamen Futsal Pelajar",
    date: "10 Nov - 25 Nov 2023",
    location: "GOR Maros",
    status: "completed",
    totalMatches: 20,
    completedMatches: 20,
    referees: 4,
  },
];

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Berlangsung", variant: "success" as const };
    case "upcoming":
      return { label: "Akan Datang", variant: "info" as const };
    case "completed":
      return { label: "Selesai", variant: "neutral" as const };
    default:
      return { label: status, variant: "neutral" as const };
  }
};

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && event.status === "active") ||
      (activeTab === "upcoming" && event.status === "upcoming") ||
      (activeTab === "completed" && event.status === "completed");
    return matchesSearch && matchesTab;
  });

  return (
    <AppLayout title="Event">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Event List */}
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const statusDisplay = getStatusDisplay(event.status);
            const progress = (event.completedMatches / event.totalMatches) * 100;

            return (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{event.name}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={statusDisplay.variant}>
                          {statusDisplay.label}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.referees} Wasit
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">
                          {event.completedMatches}/{event.totalMatches}
                        </p>
                        <p className="text-xs text-muted-foreground">Pertandingan</p>
                      </div>
                    </div>

                    {event.status === "active" && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full shadow-lg h-14 w-14 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
