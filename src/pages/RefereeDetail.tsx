import { ArrowLeft, Star, Phone, Mail, Calendar, Trophy, DollarSign, Edit, TrendingUp } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const refereeData = {
  id: 1,
  name: "Ahmad Rizky",
  license: "Lisensi A",
  phone: "0812-3456-7890",
  email: "ahmad.rizky@email.com",
  rating: 4.8,
  totalMatches: 124,
  status: "active",
  totalEarnings: 15600000,
  joinDate: "15 Maret 2020",
  address: "Jl. Sudirman No. 45, Makassar",
};

const matchHistory = [
  { id: 1, event: "Liga Futsal Makassar", match: "Makassar FC vs Sudiang United", date: "17 Jan 2024", fee: 350000 },
  { id: 2, event: "Liga Futsal Makassar", match: "Gowa Stars vs Maros FC", date: "15 Jan 2024", fee: 350000 },
  { id: 3, event: "Turnamen Futsal Pelajar", match: "SMAN 1 vs SMAN 5", date: "10 Jan 2024", fee: 250000 },
  { id: 4, event: "Liga Futsal Makassar", match: "Tamalanrea FC vs Rappocini FC", date: "8 Jan 2024", fee: 350000 },
];

const evaluations = [
  { id: 1, event: "Liga Futsal Makassar", date: "17 Jan 2024", score: 92, evaluator: "Komite Wasit" },
  { id: 2, event: "Liga Futsal Makassar", date: "15 Jan 2024", score: 88, evaluator: "Komite Wasit" },
  { id: 3, event: "Turnamen Futsal Pelajar", date: "10 Jan 2024", score: 95, evaluator: "Panitia Event" },
];

const incomeData = [
  { month: "Jan 2024", amount: 1400000 },
  { month: "Dec 2023", amount: 2100000 },
  { month: "Nov 2023", amount: 1750000 },
  { month: "Oct 2023", amount: 1400000 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function RefereeDetail() {
  const { id } = useParams();

  return (
    <AppLayout title="Detail Wasit">
      <div className="animate-fade-in">
        {/* Back Button */}
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/referees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Link>
          </Button>
        </div>

        {/* Profile Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {refereeData.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{refereeData.name}</h1>
                  <p className="text-sm text-muted-foreground">{refereeData.license}</p>
                </div>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status="success">Aktif</StatusBadge>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  {refereeData.rating}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{refereeData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{refereeData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Bergabung: {refereeData.joinDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{refereeData.totalMatches}</p>
                <p className="text-xs text-muted-foreground">Pertandingan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-warning" />
                <p className="text-lg font-bold">{refereeData.rating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-success" />
                <p className="text-lg font-bold">15.6M</p>
                <p className="text-xs text-muted-foreground">Pendapatan</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="px-4 pb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluasi</TabsTrigger>
            <TabsTrigger value="income">Pendapatan</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 space-y-3">
            {matchHistory.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm">{match.match}</p>
                    <span className="text-xs text-primary font-medium">
                      {formatCurrency(match.fee)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{match.event}</p>
                  <p className="text-xs text-muted-foreground">{match.date}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="evaluations" className="mt-4 space-y-3">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{evaluation.event}</p>
                      <p className="text-xs text-muted-foreground">{evaluation.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        evaluation.score >= 90 ? "text-success" : 
                        evaluation.score >= 80 ? "text-primary" : "text-warning"
                      }`}>
                        {evaluation.score}
                      </p>
                      <p className="text-xs text-muted-foreground">Skor</p>
                    </div>
                  </div>
                  <Progress value={evaluation.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Evaluator: {evaluation.evaluator}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="income" className="mt-4 space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(refereeData.totalEarnings)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-success text-sm">
                    <TrendingUp className="h-4 w-4" />
                    +12%
                  </div>
                </div>
              </CardContent>
            </Card>
            {incomeData.map((income, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{income.month}</span>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(income.amount)}
                    </span>
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
