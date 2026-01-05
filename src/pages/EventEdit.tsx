import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CalendarIcon, MapPin, Loader2, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

const EventEdit = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user, isAdminProvinsi } = useAuth();
  const { data: event, isLoading } = useEvent(eventId || "");
  const updateEvent = useUpdateEvent();
  const { data: kabupatenKotaList } = useKabupatenKotaList();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    eventName: "",
    location: "",
    description: "",
    category: "",
    kabupatenKotaId: "",
  });
  const [eventDate, setEventDate] = useState<Date | undefined>();

  // Load event data when available
  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.name || "",
        location: event.location || "",
        description: event.description || "",
        category: event.category || "",
        kabupatenKotaId: event.kabupaten_kota_id || "",
      });
      if (event.date) {
        setEventDate(parseISO(event.date));
      }
    }
  }, [event]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.eventName.trim() !== "" && eventDate && formData.location.trim() !== "";

  const handleSubmit = async () => {
    if (!eventDate || !user || !eventId) return;

    try {
      await updateEvent.mutateAsync({
        id: eventId,
        name: formData.eventName,
        date: format(eventDate, "yyyy-MM-dd"),
        location: formData.location,
        description: formData.description || null,
        category: formData.category || null,
        kabupaten_kota_id: formData.kabupatenKotaId || null,
      });
      
      setShowConfirmation(false);
      navigate(`/events/${eventId}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Edit Event">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout title="Edit Event">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Event tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate("/events")}>
            Kembali ke Daftar Event
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Check edit permission
  const canEdit = isAdminProvinsi() || 
    (event.created_by === user?.id && event.status === "DIAJUKAN");

  if (!canEdit) {
    return (
      <AppLayout title="Edit Event">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Anda tidak memiliki akses untuk mengedit event ini</p>
          <Button className="mt-4" onClick={() => navigate(`/events/${eventId}`)}>
            Kembali ke Detail Event
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Event">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(`/events/${eventId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
        </div>

        <main className="p-4 pb-24 max-w-lg mx-auto space-y-4">
          {/* Event Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nama Event</CardTitle>
              <CardDescription>
                Nama lengkap event futsal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Nama Event *</Label>
                <Input
                  id="eventName"
                  placeholder="Contoh: Piala Walikota Futsal 2025"
                  value={formData.eventName}
                  onChange={(e) => handleInputChange("eventName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liga">Liga</SelectItem>
                    <SelectItem value="turnamen">Turnamen</SelectItem>
                    <SelectItem value="friendly">Pertandingan Persahabatan</SelectItem>
                    <SelectItem value="pelajar">Pelajar</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jadwal & Lokasi</CardTitle>
              <CardDescription>
                Tanggal pelaksanaan dan lokasi event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tanggal Pelaksanaan *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? (
                        format(eventDate, "d MMMM yyyy", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={setEventDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-10"
                    placeholder="Contoh: GOR Sudiang, Makassar"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Select value={formData.kabupatenKotaId} onValueChange={(v) => handleInputChange("kabupatenKotaId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kabupaten/kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {kabupatenKotaList?.map((kk) => (
                      <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deskripsi</CardTitle>
              <CardDescription>
                Informasi tambahan tentang event (opsional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Event</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan detail event, jumlah tim, format pertandingan, dll."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="max-w-lg mx-auto">
            <Button
              className="w-full h-12 text-base"
              onClick={() => setShowConfirmation(true)}
              disabled={!isFormValid}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Konfirmasi Perubahan</DialogTitle>
              <DialogDescription>
                Pastikan data event sudah benar sebelum menyimpan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama Event</span>
                <span className="text-sm font-medium">{formData.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm font-medium">
                  {eventDate && format(eventDate, "d MMMM yyyy", { locale: id })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lokasi</span>
                <span className="text-sm font-medium">{formData.location}</span>
              </div>
              {formData.category && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kategori</span>
                  <span className="text-sm font-medium">{formData.category}</span>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowConfirmation(false)}
              >
                Batal
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleSubmit}
                disabled={updateEvent.isPending}
              >
                {updateEvent.isPending ? "Menyimpan..." : "Konfirmasi & Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EventEdit;
