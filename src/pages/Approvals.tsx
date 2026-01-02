import { useState } from "react";
import { Search, Filter, Calendar, MapPin, CheckCircle, XCircle, Clock, Users, Trophy, UserCheck, Building, FileText, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: number;
  name: string;
  organizer: string;
  kabKota: string;
  date: string;
  location: string;
  submittedAt: string;
  teams: number;
  matches: number;
  referees: number;
  description: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
}

const pendingEvents: Event[] = [
  {
    id: 1,
    name: "Liga Futsal Gowa 2024",
    organizer: "Asosiasi Futsal Gowa",
    kabKota: "Kab. Gowa",
    date: "1 Feb - 28 Feb 2024",
    location: "GOR Gowa",
    submittedAt: "2 hari lalu",
    teams: 12,
    matches: 24,
    referees: 4,
    description: "Kompetisi futsal tahunan tingkat Kabupaten Gowa dengan partisipasi 12 tim dari berbagai kecamatan. Event ini bertujuan untuk meningkatkan prestasi futsal di tingkat kabupaten.",
    contactPerson: "Ahmad Rasyid",
    phone: "0821-xxxx-xxxx",
    email: "asosiasi.futsal.gowa@email.com",
    category: "Liga",
  },
  {
    id: 2,
    name: "Turnamen Futsal Pelajar Maros",
    organizer: "Dinas Pendidikan Maros",
    kabKota: "Kab. Maros",
    date: "15 Feb - 20 Feb 2024",
    location: "GOR Maros",
    submittedAt: "3 hari lalu",
    teams: 16,
    matches: 20,
    referees: 4,
    description: "Turnamen futsal untuk pelajar SMA/SMK se-Kabupaten Maros dalam rangka memperingati Hari Pendidikan Nasional.",
    contactPerson: "Budi Santoso",
    phone: "0812-xxxx-xxxx",
    email: "diknas.maros@email.com",
    category: "Turnamen",
  },
  {
    id: 3,
    name: "Piala Wali Kota Makassar",
    organizer: "Pemkot Makassar",
    kabKota: "Kota Makassar",
    date: "1 Mar - 15 Mar 2024",
    location: "GOR Sudiang",
    submittedAt: "5 hari lalu",
    teams: 24,
    matches: 48,
    referees: 8,
    description: "Turnamen futsal prestisius tingkat Kota Makassar yang diselenggarakan oleh Pemerintah Kota Makassar dengan hadiah total 50 juta rupiah.",
    contactPerson: "Andi Tenri",
    phone: "0853-xxxx-xxxx",
    email: "futsal.makassar@email.com",
    category: "Turnamen",
  },
  {
    id: 4,
    name: "Liga Futsal Antar Kampus",
    organizer: "BEM se-Sul-Sel",
    kabKota: "Kota Makassar",
    date: "10 Mar - 25 Mar 2024",
    location: "GOR Mattoangin",
    submittedAt: "1 minggu lalu",
    teams: 20,
    matches: 32,
    referees: 6,
    description: "Kompetisi futsal antar kampus se-Sulawesi Selatan untuk mempererat silaturahmi antar mahasiswa.",
    contactPerson: "Rahmat Hidayat",
    phone: "0822-xxxx-xxxx",
    email: "bem.sulsel@email.com",
    category: "Liga",
  },
  {
    id: 5,
    name: "Turnamen Futsal Ramadan",
    organizer: "Remaja Masjid Al-Markaz",
    kabKota: "Kota Makassar",
    date: "15 Mar - 30 Mar 2024",
    location: "GOR Sudiang",
    submittedAt: "1 minggu lalu",
    teams: 16,
    matches: 24,
    referees: 4,
    description: "Turnamen futsal menyambut bulan suci Ramadan dengan nuansa Islami dan sportivitas.",
    contactPerson: "Muh. Fadli",
    phone: "0813-xxxx-xxxx",
    email: "remajamasjid.almarkaz@email.com",
    category: "Turnamen",
  },
];

interface HistoryEvent {
  id: number;
  name: string;
  organizer: string;
  kabKota: string;
  date: string;
  status: "approved" | "rejected";
  processedAt: string;
  reason?: string;
}

const historyEvents: HistoryEvent[] = [
  {
    id: 101,
    name: "Liga Futsal Makassar 2024",
    organizer: "FFSS Makassar",
    kabKota: "Kota Makassar",
    date: "15 Jan - 28 Feb 2024",
    status: "approved",
    processedAt: "10 Jan 2024",
  },
  {
    id: 102,
    name: "Turnamen Antar Kabupaten",
    organizer: "FFSS Sul-Sel",
    kabKota: "Provinsi Sul-Sel",
    date: "22 Jan - 5 Feb 2024",
    status: "approved",
    processedAt: "18 Jan 2024",
  },
  {
    id: 103,
    name: "Piala Gubernur Sul-Sel",
    organizer: "Pemprov Sul-Sel",
    kabKota: "Provinsi Sul-Sel",
    date: "5 Feb - 20 Feb 2024",
    status: "approved",
    processedAt: "1 Feb 2024",
  },
  {
    id: 104,
    name: "Turnamen Futsal RT/RW",
    organizer: "Kelurahan Panakkukang",
    kabKota: "Kota Makassar",
    date: "10 Feb - 15 Feb 2024",
    status: "rejected",
    processedAt: "5 Feb 2024",
    reason: "Tidak memenuhi standar minimum peserta (minimal 8 tim)",
  },
];

export default function Approvals() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processedEvents, setProcessedEvents] = useState<number[]>([]);

  const kabKotaOptions = ["all", "Kota Makassar", "Kab. Gowa", "Kab. Maros", "Provinsi Sul-Sel"];

  const filteredPendingEvents = pendingEvents.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || event.kabKota === filterKabKota;
    const notProcessed = !processedEvents.includes(event.id);
    return matchesSearch && matchesKabKota && notProcessed;
  });

  const filteredHistoryEvents = historyEvents.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || event.kabKota === filterKabKota;
    return matchesSearch && matchesKabKota;
  });

  const handleApprove = () => {
    if (selectedEvent) {
      setProcessedEvents([...processedEvents, selectedEvent.id]);
      toast({
        title: "Event Disetujui",
        description: `"${selectedEvent.name}" telah berhasil disetujui.`,
      });
    }
    setShowApproveDialog(false);
    setApprovalNotes("");
    setSelectedEvent(null);
  };

  const handleReject = () => {
    if (selectedEvent) {
      setProcessedEvents([...processedEvents, selectedEvent.id]);
      toast({
        title: "Event Ditolak",
        description: `"${selectedEvent.name}" telah ditolak.`,
        variant: "destructive",
      });
    }
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedEvent(null);
  };

  const pendingCount = pendingEvents.length - processedEvents.length;

  return (
    <AppLayout title="Persetujuan Event">
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row animate-fade-in">
        {/* Left Panel - Event List */}
        <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 border-r border-border flex flex-col bg-muted/30">
          {/* Summary Cards */}
          <div className="p-4 border-b border-border bg-background">
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Menunggu</p>
                </CardContent>
              </Card>
              <Card className="bg-success/10 border-success/20">
                <CardContent className="p-3 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold text-success">
                    {historyEvents.filter(e => e.status === "approved").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Disetujui</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-3 text-center">
                  <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">
                    {historyEvents.filter(e => e.status === "rejected").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Ditolak</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 space-y-3 border-b border-border bg-background">
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
            </div>
            <Select value={filterKabKota} onValueChange={setFilterKabKota}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter Kab/Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kab/Kota</SelectItem>
                {kabKotaOptions.slice(1).map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-3 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="pending" className="relative">
                  Menunggu
                  {pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">Riwayat</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Event List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {activeTab === "pending" && (
                <>
                  {filteredPendingEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada event menunggu</p>
                      <p className="text-sm">Semua pengajuan sudah diproses</p>
                    </div>
                  ) : (
                    filteredPendingEvents.map((event) => (
                      <Card
                        key={event.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedEvent?.id === event.id
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{event.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{event.organizer}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {event.kabKota}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {event.date}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <StatusBadge status="warning">Menunggu Review</StatusBadge>
                            <span className="text-xs text-muted-foreground">{event.submittedAt}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}

              {activeTab === "history" && (
                <>
                  {filteredHistoryEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada riwayat</p>
                    </div>
                  ) : (
                    filteredHistoryEvents.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{event.name}</h3>
                              <p className="text-xs text-muted-foreground">{event.organizer}</p>
                            </div>
                            <StatusBadge status={event.status === "approved" ? "success" : "error"}>
                              {event.status === "approved" ? "Disetujui" : "Ditolak"}
                            </StatusBadge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.kabKota}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {event.date}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Diproses: {event.processedAt}
                          </p>
                          {event.status === "rejected" && event.reason && (
                            <p className="text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded">
                              Alasan: {event.reason}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Event Detail */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedEvent ? (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 lg:p-8 max-w-3xl">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <StatusBadge status="warning" className="mb-2">Menunggu Review</StatusBadge>
                        <h1 className="text-2xl font-bold">{selectedEvent.name}</h1>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{selectedEvent.organizer}</p>
                  </div>

                  <Separator className="mb-6" />

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tanggal Pelaksanaan</p>
                          <p className="font-medium">{selectedEvent.date}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lokasi</p>
                          <p className="font-medium">{selectedEvent.location}</p>
                          <p className="text-sm text-muted-foreground">{selectedEvent.kabKota}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kategori</p>
                          <p className="font-medium">{selectedEvent.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Jumlah Tim</p>
                          <p className="font-medium">{selectedEvent.teams} Tim</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Jumlah Pertandingan</p>
                          <p className="font-medium">{selectedEvent.matches} Pertandingan</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kebutuhan Wasit</p>
                          <p className="font-medium">{selectedEvent.referees} Wasit</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Deskripsi Event
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <Separator className="mb-6" />

                  {/* Contact Info */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Informasi Kontak
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span className="font-medium">{selectedEvent.contactPerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telepon</span>
                        <span className="font-medium">{selectedEvent.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{selectedEvent.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                    Diajukan {selectedEvent.submittedAt}
                  </div>
                </div>
              </ScrollArea>

              {/* Action Footer */}
              <div className="border-t border-border bg-card p-4 lg:p-6">
                <div className="max-w-3xl flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Tolak Event
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => setShowApproveDialog(true)}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Setujui Event
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-1">Pilih Event</p>
                <p className="text-sm">Pilih event dari daftar untuk melihat detail</p>
              </div>
            </div>
          )}
        </div>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Setujui Event
              </DialogTitle>
              <DialogDescription>
                Anda akan menyetujui event <strong>"{selectedEvent?.name}"</strong>. 
                Penyelenggara akan mendapat notifikasi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="approval-notes">Catatan (Opsional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Tambahkan catatan untuk penyelenggara..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Batal
              </Button>
              <Button 
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleApprove}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Setujui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Tolak Event
              </DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan untuk event <strong>"{selectedEvent?.name}"</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="reject-reason">Alasan Penolakan <span className="text-destructive">*</span></Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Masukkan alasan penolakan..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1.5 min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
