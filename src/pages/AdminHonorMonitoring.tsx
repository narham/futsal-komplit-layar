import { useState } from "react";
import { 
  Search, 
  Filter, 
  Wallet, 
  User, 
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Download,
  Eye,
  TrendingUp,
  Users,
  BadgeCheck,
  AlertCircle
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RefereeIncome {
  id: number;
  name: string;
  photo: string;
  kabKota: string;
  license: string;
  totalEvents: number;
  totalIncome: number;
  pendingAmount: number;
  verifiedAmount: number;
  pendingCount: number;
  verifiedCount: number;
  lastActivity: string;
  status: "all_verified" | "has_pending" | "no_submission";
}

const mockReferees: RefereeIncome[] = [
  {
    id: 1,
    name: "Ahmad Fauzi",
    photo: "",
    kabKota: "Kota Makassar",
    license: "Nasional",
    totalEvents: 12,
    totalIncome: 4500000,
    pendingAmount: 600000,
    verifiedAmount: 3900000,
    pendingCount: 2,
    verifiedCount: 10,
    lastActivity: "2 hari lalu",
    status: "has_pending",
  },
  {
    id: 2,
    name: "Budi Santoso",
    photo: "",
    kabKota: "Kab. Gowa",
    license: "Provinsi",
    totalEvents: 8,
    totalIncome: 2800000,
    pendingAmount: 0,
    verifiedAmount: 2800000,
    pendingCount: 0,
    verifiedCount: 8,
    lastActivity: "1 minggu lalu",
    status: "all_verified",
  },
  {
    id: 3,
    name: "Citra Dewi",
    photo: "",
    kabKota: "Kota Makassar",
    license: "Nasional",
    totalEvents: 15,
    totalIncome: 5200000,
    pendingAmount: 1200000,
    verifiedAmount: 4000000,
    pendingCount: 4,
    verifiedCount: 11,
    lastActivity: "1 hari lalu",
    status: "has_pending",
  },
  {
    id: 4,
    name: "Dedi Kurniawan",
    photo: "",
    kabKota: "Kab. Maros",
    license: "Kab/Kota",
    totalEvents: 5,
    totalIncome: 1500000,
    pendingAmount: 0,
    verifiedAmount: 1500000,
    pendingCount: 0,
    verifiedCount: 5,
    lastActivity: "2 minggu lalu",
    status: "all_verified",
  },
  {
    id: 5,
    name: "Eka Putra",
    photo: "",
    kabKota: "Kota Makassar",
    license: "Provinsi",
    totalEvents: 0,
    totalIncome: 0,
    pendingAmount: 0,
    verifiedAmount: 0,
    pendingCount: 0,
    verifiedCount: 0,
    lastActivity: "-",
    status: "no_submission",
  },
  {
    id: 6,
    name: "Fadli Rahman",
    photo: "",
    kabKota: "Kab. Gowa",
    license: "Nasional",
    totalEvents: 10,
    totalIncome: 3600000,
    pendingAmount: 400000,
    verifiedAmount: 3200000,
    pendingCount: 1,
    verifiedCount: 9,
    lastActivity: "3 hari lalu",
    status: "has_pending",
  },
  {
    id: 7,
    name: "Gunawan Hidayat",
    photo: "",
    kabKota: "Kab. Bone",
    license: "Provinsi",
    totalEvents: 7,
    totalIncome: 2100000,
    pendingAmount: 0,
    verifiedAmount: 2100000,
    pendingCount: 0,
    verifiedCount: 7,
    lastActivity: "5 hari lalu",
    status: "all_verified",
  },
  {
    id: 8,
    name: "Hendra Wijaya",
    photo: "",
    kabKota: "Kota Makassar",
    license: "Kab/Kota",
    totalEvents: 3,
    totalIncome: 900000,
    pendingAmount: 300000,
    verifiedAmount: 600000,
    pendingCount: 1,
    verifiedCount: 2,
    lastActivity: "1 hari lalu",
    status: "has_pending",
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

const getStatusConfig = (status: RefereeIncome["status"]) => {
  switch (status) {
    case "all_verified":
      return { 
        label: "Terverifikasi", 
        variant: "success" as const,
        icon: CheckCircle2,
      };
    case "has_pending":
      return { 
        label: "Ada Pending", 
        variant: "warning" as const,
        icon: Clock,
      };
    case "no_submission":
      return { 
        label: "Belum Ada", 
        variant: "neutral" as const,
        icon: XCircle,
      };
  }
};

export default function AdminHonorMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReferee, setSelectedReferee] = useState<RefereeIncome | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const kabKotaOptions = ["all", "Kota Makassar", "Kab. Gowa", "Kab. Maros", "Kab. Bone"];
  const periodOptions = ["all", "Bulan Ini", "3 Bulan Terakhir", "6 Bulan Terakhir", "Tahun Ini"];
  const statusOptions = ["all", "all_verified", "has_pending", "no_submission"];

  const filteredReferees = mockReferees.filter((referee) => {
    const matchesSearch = referee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || referee.kabKota === filterKabKota;
    const matchesStatus = filterStatus === "all" || referee.status === filterStatus;
    return matchesSearch && matchesKabKota && matchesStatus;
  });

  const totalVerifiedAmount = filteredReferees.reduce((sum, r) => sum + r.verifiedAmount, 0);
  const totalPendingAmount = filteredReferees.reduce((sum, r) => sum + r.pendingAmount, 0);
  const totalReferees = filteredReferees.length;
  const refereesWithPending = filteredReferees.filter(r => r.status === "has_pending").length;

  const activeFiltersCount = [filterKabKota, filterPeriod, filterStatus].filter(f => f !== "all").length;

  const clearFilters = () => {
    setFilterKabKota("all");
    setFilterPeriod("all");
    setFilterStatus("all");
    setSearchQuery("");
  };

  return (
    <AppLayout title="Monitoring Honor Wasit">
      <div className="min-h-screen pb-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{totalReferees}</p>
                <p className="text-xs text-muted-foreground">Total Wasit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BadgeCheck className="h-4 w-4 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalVerifiedAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Terverifikasi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPendingAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{refereesWithPending}</p>
                <p className="text-xs text-muted-foreground">Wasit Perlu Verifikasi</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama wasit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden relative">
                  <Filter className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Filter</SheetTitle>
                  <SheetDescription>Filter data honor wasit</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kab/Kota</label>
                    <Select value={filterKabKota} onValueChange={setFilterKabKota}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kab/Kota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kab/Kota</SelectItem>
                        {kabKotaOptions.slice(1).map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Periode</label>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Periode</SelectItem>
                        {periodOptions.slice(1).map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="all_verified">Terverifikasi</SelectItem>
                        <SelectItem value="has_pending">Ada Pending</SelectItem>
                        <SelectItem value="no_submission">Belum Ada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      Reset
                    </Button>
                    <Button className="flex-1" onClick={() => setShowFilters(false)}>
                      Terapkan
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Export Button */}
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-3">
            <Select value={filterKabKota} onValueChange={setFilterKabKota}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Kab/Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kab/Kota</SelectItem>
                {kabKotaOptions.slice(1).map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                {periodOptions.slice(1).map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="all_verified">Terverifikasi</SelectItem>
                <SelectItem value="has_pending">Ada Pending</SelectItem>
                <SelectItem value="no_submission">Belum Ada</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block p-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Wasit</TableHead>
                  <TableHead>Kab/Kota</TableHead>
                  <TableHead className="text-center">Total Event</TableHead>
                  <TableHead className="text-right">Total Honor</TableHead>
                  <TableHead className="text-right">Terverifikasi</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada data</p>
                      <p className="text-sm">Coba ubah filter pencarian</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferees.map((referee) => {
                    const statusConfig = getStatusConfig(referee.status);
                    return (
                      <TableRow key={referee.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{referee.name}</p>
                              <p className="text-xs text-muted-foreground">{referee.license}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{referee.kabKota}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{referee.totalEvents}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{formatCurrency(referee.totalIncome)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-success font-medium">{formatCurrency(referee.verifiedAmount)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {referee.pendingAmount > 0 ? (
                            <span className="text-warning font-medium">{formatCurrency(referee.pendingAmount)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={statusConfig.variant}>
                            {statusConfig.label}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedReferee(referee)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-3">
          {filteredReferees.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Tidak ada data</p>
                <p className="text-sm">Coba ubah filter pencarian</p>
              </CardContent>
            </Card>
          ) : (
            filteredReferees.map((referee) => {
              const statusConfig = getStatusConfig(referee.status);
              return (
                <Card 
                  key={referee.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedReferee(referee)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{referee.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {referee.license} • {referee.kabKota}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <Separator className="mb-3" />

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div>
                        <p className="text-lg font-bold">{referee.totalEvents}</p>
                        <p className="text-[10px] text-muted-foreground">Event</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-success">{formatCurrency(referee.verifiedAmount).replace("Rp", "")}</p>
                        <p className="text-[10px] text-muted-foreground">Terverifikasi</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-warning">
                          {referee.pendingAmount > 0 ? formatCurrency(referee.pendingAmount).replace("Rp", "") : "-"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <StatusBadge status={statusConfig.variant}>
                        {statusConfig.label}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground">
                        {referee.lastActivity !== "-" ? `Aktivitas: ${referee.lastActivity}` : "Belum ada aktivitas"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Referee Detail Dialog */}
        <Dialog open={!!selectedReferee} onOpenChange={() => setSelectedReferee(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Honor Wasit</DialogTitle>
              <DialogDescription>
                Ringkasan honor dan aktivitas wasit
              </DialogDescription>
            </DialogHeader>
            
            {selectedReferee && (
              <div className="space-y-4">
                {/* Referee Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedReferee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedReferee.license} • {selectedReferee.kabKota}
                    </p>
                    <StatusBadge 
                      status={getStatusConfig(selectedReferee.status).variant}
                      className="mt-1"
                    >
                      {getStatusConfig(selectedReferee.status).label}
                    </StatusBadge>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold">{selectedReferee.totalEvents}</p>
                      <p className="text-xs text-muted-foreground">Total Event</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold">{formatCurrency(selectedReferee.totalIncome)}</p>
                      <p className="text-xs text-muted-foreground">Total Honor</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Income Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Rincian Honor</h4>
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">Terverifikasi ({selectedReferee.verifiedCount} event)</span>
                    </div>
                    <span className="font-semibold text-success">{formatCurrency(selectedReferee.verifiedAmount)}</span>
                  </div>
                  {selectedReferee.pendingAmount > 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <span className="text-sm">Menunggu Verifikasi ({selectedReferee.pendingCount} event)</span>
                      </div>
                      <span className="font-semibold text-warning">{formatCurrency(selectedReferee.pendingAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Last Activity */}
                <div className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
                  Aktivitas terakhir: {selectedReferee.lastActivity}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedReferee(null)}>
                    Tutup
                  </Button>
                  <Button className="flex-1">
                    Lihat Riwayat Lengkap
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
