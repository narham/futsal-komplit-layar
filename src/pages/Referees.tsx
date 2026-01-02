import { useState } from "react";
import { Plus, Search, Filter, Star, Phone, Mail, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const referees = [
  {
    id: 1,
    name: "Ahmad Rizky",
    license: "Lisensi A",
    phone: "0812-3456-7890",
    email: "ahmad.rizky@email.com",
    rating: 4.8,
    totalMatches: 124,
    status: "active",
    totalEarnings: 15600000,
  },
  {
    id: 2,
    name: "Budi Santoso",
    license: "Lisensi A",
    phone: "0813-4567-8901",
    email: "budi.santoso@email.com",
    rating: 4.6,
    totalMatches: 98,
    status: "active",
    totalEarnings: 12400000,
  },
  {
    id: 3,
    name: "Cahya Putra",
    license: "Lisensi B",
    phone: "0814-5678-9012",
    email: "cahya.putra@email.com",
    rating: 4.5,
    totalMatches: 76,
    status: "active",
    totalEarnings: 9500000,
  },
  {
    id: 4,
    name: "Dedi Wijaya",
    license: "Lisensi B",
    phone: "0815-6789-0123",
    email: "dedi.wijaya@email.com",
    rating: 4.3,
    totalMatches: 52,
    status: "inactive",
    totalEarnings: 6800000,
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    license: "Lisensi C",
    phone: "0816-7890-1234",
    email: "eko.prasetyo@email.com",
    rating: 4.1,
    totalMatches: 28,
    status: "active",
    totalEarnings: 3500000,
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

export default function Referees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredReferees = referees.filter((referee) => {
    const matchesSearch = referee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && referee.status === "active") ||
      (activeTab === "inactive" && referee.status === "inactive");
    return matchesSearch && matchesTab;
  });

  return (
    <AppLayout title="Wasit">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{referees.length}</p>
              <p className="text-xs text-muted-foreground">Total Wasit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">{referees.filter(r => r.status === "active").length}</p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">4.5</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari wasit..."
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
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="inactive">Non-Aktif</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Referee List */}
        <div className="space-y-3">
          {filteredReferees.map((referee) => (
            <Link key={referee.id} to={`/referees/${referee.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {referee.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{referee.name}</h3>
                          <p className="text-xs text-muted-foreground">{referee.license}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          {referee.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {referee.totalMatches} pertandingan
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge status={referee.status === "active" ? "success" : "neutral"}>
                          {referee.status === "active" ? "Aktif" : "Non-Aktif"}
                        </StatusBadge>
                        <span className="text-xs font-medium text-primary">
                          {formatCurrency(referee.totalEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
