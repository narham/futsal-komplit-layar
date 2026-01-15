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
import { DocumentUpload } from "@/components/ui/document-upload";
import { ArrowLeft, CalendarIcon, MapPin, Loader2, Save, FileText, AlertTriangle } from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEvent, useUpdateEvent, useCheckDuplicateEvent } from "@/hooks/useEvents";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Disable dates before today
const today = startOfDay(new Date());

const EventEdit = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user, isAdminProvinsi } = useAuth();
  const { data: event, isLoading } = useEvent(eventId || "");
  const updateEvent = useUpdateEvent();
  const checkDuplicate = useCheckDuplicateEvent();
  const { data: kabupatenKotaList } = useKabupatenKotaList();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    eventName: "",
    location: "",
    description: "",
    category: "",
    kabupatenKotaId: "",
  });
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Get signed URL for existing document
  const { data: existingDocumentUrl } = useSignedUrl(
    event?.document_path || null,
    "documents"
  );

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
      if (event.start_date) {
        setStartDate(parseISO(event.start_date));
      }
      if (event.end_date) {
        setEndDate(parseISO(event.end_date));
      }
      // Set existing document preview
      if (event.document_path && existingDocumentUrl) {
        setDocumentPreview(existingDocumentUrl);
      }
    }
  }, [event, existingDocumentUrl]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear duplicate warning when name changes
    if (field === "eventName") {
      setDuplicateWarning(null);
    }
  };

  const handleDocumentChange = (preview: string | null, file: File | null) => {
    setDocumentPreview(preview);
    setDocumentFile(file);
  };

  const isFormValid = formData.eventName.trim() !== "" && startDate && endDate && formData.location.trim() !== "";

  const handleCheckDuplicate = async () => {
    if (!startDate || !formData.eventName.trim()) return true;

    try {
      const result = await checkDuplicate.mutateAsync({
        name: formData.eventName,
        date: format(startDate, "yyyy-MM-dd"),
        excludeEventId: eventId,
      });

      if (result.isDuplicate) {
        setDuplicateWarning(
          `Event dengan nama "${result.existingEvent?.name}" sudah ada pada tanggal yang sama`
        );
        return false;
      }

      setDuplicateWarning(null);
      return true;
    } catch {
      return true; // Allow proceeding if check fails
    }
  };

  const handleOpenConfirmation = async () => {
    const isValid = await handleCheckDuplicate();
    if (isValid) {
      setShowConfirmation(true);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !user || !eventId) return;

    try {
      setIsUploading(true);
      let documentPath = event?.document_path;

      // Upload new document if exists
      if (documentFile) {
        const fileExt = documentFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, documentFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Gagal mengupload dokumen: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        // Delete old document if exists
        if (event?.document_path) {
          await supabase.storage
            .from("documents")
            .remove([event.document_path]);
        }

        documentPath = fileName;
      }

      await updateEvent.mutateAsync({
        id: eventId,
        name: formData.eventName,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        location: formData.location,
        description: formData.description || null,
        category: formData.category || null,
        kabupaten_kota_id: formData.kabupatenKotaId || null,
        document_path: documentPath,
      } as any);
      
      setShowConfirmation(false);
      navigate(`/events/${eventId}`);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsUploading(false);
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
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "d MMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setDuplicateWarning(null);
                          // Auto-adjust end date if it's before start date
                          if (date && endDate && endDate < date) {
                            setEndDate(date);
                          }
                        }}
                        disabled={(date) => date < today}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "d MMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < today || (startDate ? date < startDate : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {startDate && endDate && startDate.getTime() !== endDate.getTime() && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Durasi event: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} hari
                </p>
              )}

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

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Dokumen</CardTitle>
              <CardDescription>
                Upload atau ganti surat permohonan (opsional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUpload
                value={documentPreview}
                file={documentFile}
                onChange={handleDocumentChange}
                label="Surat Permohonan"
                maxSizeMB={5}
              />
              {event.document_path && !documentFile && (
                <p className="text-xs text-muted-foreground">
                  Dokumen saat ini akan dipertahankan jika tidak mengupload dokumen baru
                </p>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="max-w-lg mx-auto">
            <Button
              className="w-full h-12 text-base"
              onClick={handleOpenConfirmation}
              disabled={!isFormValid || checkDuplicate.isPending}
            >
              {checkDuplicate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
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
              <span className="text-sm text-muted-foreground">Tanggal Mulai</span>
              <span className="text-sm font-medium">
                {startDate && format(startDate, "d MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Selesai</span>
              <span className="text-sm font-medium">
                {endDate && format(endDate, "d MMMM yyyy", { locale: id })}
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
              {(documentFile || event?.document_path) && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dokumen</span>
                  <span className="text-sm font-medium text-primary">
                    {documentFile ? `📎 ${documentFile.name} (baru)` : "📎 Dokumen existing"}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowConfirmation(false)}
                disabled={isUploading || updateEvent.isPending}
              >
                Batal
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleSubmit}
                disabled={isUploading || updateEvent.isPending}
              >
                {isUploading || updateEvent.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Konfirmasi & Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EventEdit;
