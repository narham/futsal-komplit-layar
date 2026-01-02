import { ArrowLeft, Calendar, MapPin, Users, Trophy, Edit, UserPlus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const eventData = {
  id: 1,
  name: "Liga Futsal Makassar 2024",
  date: "15 Jan - 28 Feb 2024",
  location: "GOR Sudiang, Makassar",
  status: "active",
  description: "Kompetisi liga futsal tahunan tingkat Kota Makassar dengan partisipasi 16 tim dari berbagai klub.",
  totalMatches: 48,
  completedMatches: 12,
  teams: 16,
};

const matches = [
  { id: 1, home: "Makassar FC", away: "Sudiang United", time: "09:00", date: "18 Jan", status: "upcoming", referee: "Ahmad Rizky" },
  { id: 2, home: "Gowa Stars", away: "Maros FC", time: "11:00", date: "18 Jan", status: "upcoming", referee: "Budi Santoso" },
  { id: 3, home: "Tamalanrea FC", away: "Panakkukang FC", time: "14:00", date: "17 Jan", status: "completed", score: "4 - 2", referee: "Cahya Putra" },
  { id: 4, home: "Biringkanaya FC", away: "Rappocini United", time: "16:00", date: "17 Jan", status: "completed", score: "1 - 1", referee: "Ahmad Rizky" },
];

const referees = [
  { id: 1, name: "Ahmad Rizky", role: "Wasit Utama", matches: 5, status: "active" },
  { id: 2, name: "Budi Santoso", role: "Wasit Utama", matches: 4, status: "active" },
  { id: 3, name: "Cahya Putra", role: "Asisten Wasit", matches: 6, status: "active" },
  { id: 4, name: "Dedi Wijaya", role: "Asisten Wasit", matches: 3, status: "standby" },
];

export default function EventDetail() {
  const { id } = useParams();
  const progress = (eventData.completedMatches / eventData.totalMatches) * 100;

  return (
    <AppLayout title="Detail Event">
      <div className="animate-fade-in">
        {/* Back Button */}
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Link>
          </Button>
        </div>

        {/* Event Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold">{eventData.name}</h1>
              </div>
              <StatusBadge status="success">Berlangsung</StatusBadge>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{eventData.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {eventData.date}
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {eventData.location}
            </span>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress Event</span>
                <span className="text-sm text-muted-foreground">
                  {eventData.completedMatches}/{eventData.totalMatches} Pertandingan
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{eventData.teams}</p>
                  <p className="text-xs text-muted-foreground">Tim</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{eventData.completedMatches}</p>
                  <p className="text-xs text-muted-foreground">Selesai</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{eventData.totalMatches - eventData.completedMatches}</p>
                  <p className="text-xs text-muted-foreground">Tersisa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="matches" className="px-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="matches">Pertandingan</TabsTrigger>
            <TabsTrigger value="referees">Wasit</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-4 space-y-3">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {match.date} • {match.time}
                    </span>
                    <StatusBadge status={match.status === "completed" ? "success" : "info"}>
                      {match.status === "completed" ? "Selesai" : "Mendatang"}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-sm">{match.home}</p>
                    </div>
                    <div className="px-4">
                      {match.score ? (
                        <p className="font-bold text-lg">{match.score}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">VS</p>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{match.away}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <Users className="inline h-3 w-3 mr-1" />
                      Wasit: {match.referee}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="referees" className="mt-4 space-y-3">
            <div className="flex justify-end mb-2">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Tambah Wasit
              </Button>
            </div>
            {referees.map((referee) => (
              <Card key={referee.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {referee.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{referee.name}</p>
                      <p className="text-xs text-muted-foreground">{referee.role}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={referee.status === "active" ? "success" : "warning"}>
                        {referee.status === "active" ? "Aktif" : "Standby"}
                      </StatusBadge>
                      <p className="text-xs text-muted-foreground mt-1">{referee.matches} match</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
