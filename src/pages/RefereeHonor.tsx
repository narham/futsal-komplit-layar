import { useState } from "react";
import { 
  Wallet, 
  Calendar, 
  MapPin, 
  Trophy, 
  AlertCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  FileCheck,
  ChevronRight,
  Plus,
  X,
  Home,
  CalendarDays,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface HonorEntry {
  id: number;
  eventName: string;
  eventDate: string;
  amount: number;
  notes: string;
  status: "draft" | "submitted" | "verified";
  submittedAt?: string;
  verifiedAt?: string;
}

const mockEvents = [
  { id: 1, name: "Liga Futsal Gowa 2024", date: "15 Feb 2024", location: "GOR Gowa" },
  { id: 2, name: "Turnamen Pelajar Maros", date: "20 Feb 2024", location: "GOR Maros" },
  { id: 3, name: "Piala Wali Kota Makassar", date: "10 Mar 2024", location: "GOR Sudiang" },
];

const initialHistory: HonorEntry[] = [
  {
    id: 1,
    eventName: "Liga Futsal Makassar 2024",
    eventDate: "28 Jan 2024",
    amount: 750000,
    notes: "4 pertandingan sebagai wasit utama",
    status: "verified",
    submittedAt: "29 Jan 2024",
    verifiedAt: "2 Feb 2024",
  },
  {
    id: 2,
    eventName: "Turnamen Antar Kabupaten",
    eventDate: "5 Feb 2024",
    amount: 500000,
    notes: "3 pertandingan sebagai wasit kedua",
    status: "verified",
    submittedAt: "6 Feb 2024",
    verifiedAt: "10 Feb 2024",
  },
  {
    id: 3,
    eventName: "Piala Gubernur Sul-Sel",
    eventDate: "18 Feb 2024",
    amount: 600000,
    notes: "3 pertandingan (final + semifinal)",
    status: "submitted",
    submittedAt: "19 Feb 2024",
  },
  {
    id: 4,
    eventName: "Liga Futsal Gowa 2024",
    eventDate: "22 Feb 2024",
    amount: 400000,
    notes: "2 pertandingan penyisihan grup",
    status: "draft",
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

const getStatusConfig = (status: HonorEntry["status"]) => {
  switch (status) {
    case "draft":
      return { 
        label: "Draft", 
        variant: "default" as const,
        icon: Clock,
        color: "text-muted-foreground"
      };
    case "submitted":
      return { 
        label: "Menunggu Verifikasi", 
        variant: "warning" as const,
        icon: Send,
        color: "text-warning"
      };
    case "verified":
      return { 
        label: "Terverifikasi", 
        variant: "success" as const,
        icon: CheckCircle2,
        color: "text-success"
      };
  }
};

export default function RefereeHonor() {
  const { toast } = useToast();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [history, setHistory] = useState<HonorEntry[]>(initialHistory);
  
  // Form state
  const [selectedEvent, setSelectedEvent] = useState("");
  const [honorAmount, setHonorAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const totalVerified = history
    .filter(h => h.status === "verified")
    .reduce((sum, h) => sum + h.amount, 0);
  
  const totalPending = history
    .filter(h => h.status === "submitted")
    .reduce((sum, h) => sum + h.amount, 0);

  const validateForm = (): boolean => {
    if (!selectedEvent) {
      setFormError("Pilih event terlebih dahulu");
      return false;
    }
    
    const amount = parseInt(honorAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setFormError("Masukkan jumlah honor yang valid");
      return false;
    }
    
    if (amount > 10000000) {
      setFormError("Jumlah honor maksimal Rp 10.000.000");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;

    const event = mockEvents.find(e => e.id.toString() === selectedEvent);
    if (!event) return;

    const newEntry: HonorEntry = {
      id: Date.now(),
      eventName: event.name,
      eventDate: event.date,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim(),
      status: "draft",
    };

    setHistory([newEntry, ...history]);
    resetForm();
    toast({
      title: "Draft Tersimpan",
      description: "Honor berhasil disimpan sebagai draft.",
    });
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    const event = mockEvents.find(e => e.id.toString() === selectedEvent);
    if (!event) return;

    const newEntry: HonorEntry = {
      id: Date.now(),
      eventName: event.name,
      eventDate: event.date,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim(),
      status: "submitted",
      submittedAt: new Date().toLocaleDateString("id-ID", { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      }),
    };

    setHistory([newEntry, ...history]);
    resetForm();
    setShowSubmitDialog(false);
    toast({
      title: "Honor Diajukan",
      description: "Honor telah diajukan untuk verifikasi admin.",
    });
  };

  const resetForm = () => {
    setSelectedEvent("");
    setHonorAmount("");
    setNotes("");
    setFormError(null);
    setShowInputForm(false);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      // Format with thousand separators
      const formatted = new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
      setHonorAmount(formatted);
    } else {
      setHonorAmount("");
    }
  };

  const submitDraft = (entry: HonorEntry) => {
    setHistory(history.map(h => 
      h.id === entry.id 
        ? { 
            ...h, 
            status: "submitted" as const,
            submittedAt: new Date().toLocaleDateString("id-ID", { 
              day: "numeric", 
              month: "short", 
              year: "numeric" 
            })
          }
        : h
    ));
    toast({
      title: "Honor Diajukan",
      description: `Honor untuk "${entry.eventName}" telah diajukan.`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">Honor Wasit</h1>
        <p className="text-sm text-primary-foreground/80">Kelola dan lacak honor Anda</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Terverifikasi</span>
              </div>
              <p className="text-lg font-bold text-success">{formatCurrency(totalVerified)}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Menunggu</span>
              </div>
              <p className="text-lg font-bold text-warning">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Honor Button or Form */}
        {!showInputForm ? (
          <Button 
            className="w-full h-12"
            onClick={() => setShowInputForm(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Input Honor Baru
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Input Honor Baru
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Alert */}
              <Alert className="bg-warning/10 border-warning/30">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm text-warning">
                  Honor akan diverifikasi oleh Admin sebelum diproses.
                </AlertDescription>
              </Alert>

              {/* Event Selection */}
              <div className="space-y-2">
                <Label htmlFor="event">Event <span className="text-destructive">*</span></Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        <div className="flex flex-col">
                          <span>{event.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {event.date} • {event.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Event Info */}
              {selectedEvent && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    {(() => {
                      const event = mockEvents.find(e => e.id.toString() === selectedEvent);
                      return event ? (
                        <div className="space-y-1.5">
                          <p className="font-medium text-sm">{event.name}</p>
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
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Honor Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Honor <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={honorAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-10 text-right text-lg font-semibold"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Contoh: 3 pertandingan sebagai wasit utama..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/200
                </p>
              </div>

              {/* Error Message */}
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSaveDraft}
                >
                  Simpan Draft
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Ajukan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Section */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Riwayat Honor
          </h2>

          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat</p>
                <p className="text-sm">Input honor pertama Anda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const statusConfig = getStatusConfig(entry.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{entry.eventName}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {entry.eventDate}
                          </p>
                        </div>
                        <StatusBadge status={
                          entry.status === "verified" ? "success" : 
                          entry.status === "submitted" ? "warning" : "neutral"
                        }>
                          {statusConfig.label}
                        </StatusBadge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-lg font-bold ${statusConfig.color}`}>
                          {formatCurrency(entry.amount)}
                        </p>
                        {entry.status === "draft" && (
                          <Button 
                            size="sm" 
                            onClick={() => submitDraft(entry)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Ajukan
                          </Button>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                          {entry.notes}
                        </p>
                      )}

                      {(entry.submittedAt || entry.verifiedAt) && (
                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                          {entry.submittedAt && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              Diajukan: {entry.submittedAt}
                            </span>
                          )}
                          {entry.verifiedAt && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Terverifikasi: {entry.verifiedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link to="/referee" className="flex flex-col items-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Dashboard</span>
          </Link>
          <Link to="/referee/events" className="flex flex-col items-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors">
            <CalendarDays className="h-5 w-5" />
            <span className="text-[10px]">Event</span>
          </Link>
          <Link to="/referee/honor" className="flex flex-col items-center gap-1 py-2 px-4 text-primary">
            <Wallet className="h-5 w-5" />
            <span className="text-[10px] font-medium">Honor</span>
          </Link>
          <Link to="/referee/profile" className="flex flex-col items-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px]">Profil</span>
          </Link>
        </div>
      </nav>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Ajukan Honor
            </DialogTitle>
            <DialogDescription>
              Anda akan mengajukan honor untuk diverifikasi oleh Admin. 
              Pastikan data yang dimasukkan sudah benar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Event</span>
              <span className="font-medium">
                {mockEvents.find(e => e.id.toString() === selectedEvent)?.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-bold text-primary">
                Rp {honorAmount}
              </span>
            </div>
          </div>

          <Alert className="bg-warning/10 border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm text-warning">
              Honor akan diverifikasi oleh Admin sebelum diproses.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Batal
            </Button>
            <Button onClick={confirmSubmit}>
              <Send className="h-4 w-4 mr-1" />
              Ajukan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
