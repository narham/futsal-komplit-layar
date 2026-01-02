import { useState } from "react";
import { Plus, Search, Filter, Star, ClipboardCheck, TrendingUp, TrendingDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const evaluationStats = {
  total: 48,
  pending: 8,
  avgScore: 87.5,
  topPerformer: "Ahmad Rizky",
};

const pendingEvaluations = [
  {
    id: 1,
    referee: "Ahmad Rizky",
    event: "Liga Futsal Makassar",
    match: "Makassar FC vs Sudiang United",
    date: "18 Jan 2024",
  },
  {
    id: 2,
    referee: "Budi Santoso",
    event: "Liga Futsal Makassar",
    match: "Gowa Stars vs Maros FC",
    date: "18 Jan 2024",
  },
  {
    id: 3,
    referee: "Cahya Putra",
    event: "Liga Futsal Makassar",
    match: "Tamalanrea FC vs Panakkukang FC",
    date: "17 Jan 2024",
  },
];

const completedEvaluations = [
  {
    id: 1,
    referee: "Ahmad Rizky",
    event: "Liga Futsal Makassar",
    match: "Biringkanaya FC vs Rappocini United",
    date: "17 Jan 2024",
    score: 92,
    trend: "up",
  },
  {
    id: 2,
    referee: "Cahya Putra",
    event: "Liga Futsal Makassar",
    match: "Makassar FC vs Gowa Stars",
    date: "15 Jan 2024",
    score: 88,
    trend: "up",
  },
  {
    id: 3,
    referee: "Dedi Wijaya",
    event: "Liga Futsal Makassar",
    match: "Sudiang United vs Maros FC",
    date: "15 Jan 2024",
    score: 75,
    trend: "down",
  },
  {
    id: 4,
    referee: "Budi Santoso",
    event: "Turnamen Futsal Pelajar",
    match: "SMAN 1 vs SMAN 3",
    date: "12 Jan 2024",
    score: 90,
    trend: "up",
  },
];

const criteriaBreakdown = [
  { name: "Pengetahuan Peraturan", score: 92 },
  { name: "Pengambilan Keputusan", score: 88 },
  { name: "Penguasaan Pertandingan", score: 85 },
  { name: "Kebugaran Fisik", score: 90 },
  { name: "Komunikasi", score: 82 },
];

export default function Evaluations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <AppLayout title="Evaluasi">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{evaluationStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Perlu Evaluasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{evaluationStats.avgScore}</p>
                  <p className="text-xs text-muted-foreground">Rata-rata Skor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Criteria Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rata-rata per Kriteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criteriaBreakdown.map((criteria) => (
              <div key={criteria.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{criteria.name}</span>
                  <span className="text-sm font-semibold">{criteria.score}</span>
                </div>
                <Progress value={criteria.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari evaluasi..."
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
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pending" className="relative">
              Menunggu
              {evaluationStats.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                  {evaluationStats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pendingEvaluations.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {item.referee.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.referee}</p>
                          <p className="text-xs text-muted-foreground">{item.match}</p>
                        </div>
                        <StatusBadge status="warning">Menunggu</StatusBadge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{item.event}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-3" size="sm">
                    Mulai Evaluasi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completedEvaluations.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {item.referee.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.referee}</p>
                          <p className="text-xs text-muted-foreground">{item.match}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span className={`text-lg font-bold ${
                            item.score >= 90 ? "text-success" : 
                            item.score >= 80 ? "text-primary" : "text-warning"
                          }`}>
                            {item.score}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{item.event}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <Progress value={item.score} className="h-1.5 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

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
