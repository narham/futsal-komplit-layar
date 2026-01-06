import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Award, Edit, Loader2, Power, User, Eye, Download } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReferee, useUpdateReferee, useToggleRefereeStatus, LICENSE_LEVELS, getLicenseBadgeColor } from "@/hooks/useReferees";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl, createSignedDownloadUrl } from "@/hooks/useSignedUrl";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function RefereeDetail() {
  const { id: refereeId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isAdminProvinsi } = useAuth();
  
  const { data: referee, isLoading } = useReferee(refereeId || "");
  const { data: kabupatenKotaList } = useKabupatenKotaList();
  const updateReferee = useUpdateReferee();
  const toggleStatus = useToggleRefereeStatus();

  // Signed URLs for private documents
  const { data: licenseSignedUrl } = useSignedUrl(referee?.license_photo_url);
  const { data: ktpSignedUrl } = useSignedUrl(referee?.ktp_photo_url);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewType, setPreviewType] = useState<'license' | 'ktp'>('license');
  const [editForm, setEditForm] = useState({
    full_name: "",
    license_level: "",
    kabupaten_kota_id: "",
    afk_origin: "",
  });

  if (isLoading) {
    return (
      <AppLayout title="Detail Wasit">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!referee) {
    return (
      <AppLayout title="Detail Wasit">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Wasit tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate("/referees")}>
            Kembali ke Daftar Wasit
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleEditOpen = () => {
    setEditForm({
      full_name: referee.full_name || "",
      license_level: referee.license_level || "",
      kabupaten_kota_id: referee.kabupaten_kota_id || "",
      afk_origin: referee.afk_origin || "",
    });
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    await updateReferee.mutateAsync({
      id: referee.id,
      ...editForm,
    });
    setShowEditDialog(false);
  };

  const handleToggleStatus = async () => {
    await toggleStatus.mutateAsync({
      id: referee.id,
      isActive: !referee.is_active,
    });
  };

  const handleOpenPreview = (type: 'license' | 'ktp') => {
    setPreviewType(type);
    setShowPreviewDialog(true);
  };

  const handleDownload = async (type: 'license' | 'ktp') => {
    const url = type === 'license' ? referee.license_photo_url : referee.ktp_photo_url;
    if (!url) return;
    
    try {
      const signedUrl = await createSignedDownloadUrl(url, 'documents');
      if (!signedUrl) {
        toast.error('Gagal membuat link download');
        return;
      }
      
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `${referee.full_name.replace(/\s+/g, '_')}-${type}-${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download berhasil dimulai');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mendownload dokumen');
    }
  };

  const getPreviewUrl = () => {
    return previewType === 'license' ? licenseSignedUrl : ktpSignedUrl;
  };

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
              <AvatarImage src={referee.profile_photo_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {referee.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{referee.full_name}</h1>
                  {referee.license_level && (
                    <Badge variant="outline" className={`mt-1 ${getLicenseBadgeColor(referee.license_level)}`}>
                      {referee.license_level}
                    </Badge>
                  )}
                </div>
                {isAdmin() && (
                  <Button variant="outline" size="icon" onClick={handleEditOpen}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={referee.is_active ? "success" : "neutral"}>
                  {referee.is_active ? "Aktif" : "Non-Aktif"}
                </StatusBadge>
                {referee.is_profile_complete && (
                  <Badge variant="outline" className="text-xs">Profil Lengkap</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {referee.kabupaten_kota_name && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{referee.kabupaten_kota_name}</span>
                </div>
              )}
              {referee.afk_origin && (
                <div className="flex items-center gap-3 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>AFK Asal: {referee.afk_origin}</span>
                </div>
              )}
              {referee.birth_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Lahir: {format(new Date(referee.birth_date), "d MMMM yyyy", { locale: id })}</span>
                </div>
              )}
              {referee.license_expiry && (
                <div className="flex items-center gap-3 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Lisensi berlaku sampai: {format(new Date(referee.license_expiry), "d MMMM yyyy", { locale: id })}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Bergabung: {format(new Date(referee.created_at), "d MMMM yyyy", { locale: id })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdmin() && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Aksi Admin</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={referee.is_active ? "destructive" : "default"}
                    onClick={handleToggleStatus}
                    disabled={toggleStatus.isPending}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    {referee.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="px-4 pb-8">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="info">Informasi</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-3">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                    <p className="font-medium">{referee.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Level Lisensi</p>
                    <p className="font-medium">{referee.license_level || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kabupaten/Kota</p>
                    <p className="font-medium">{referee.kabupaten_kota_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AFK Asal</p>
                    <p className="font-medium">{referee.afk_origin || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">{referee.is_active ? "Aktif" : "Non-Aktif"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profil Lengkap</p>
                    <p className="font-medium">{referee.is_profile_complete ? "Ya" : "Belum"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Foto Lisensi</p>
                  {isAdminProvinsi() && referee.license_photo_url && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenPreview('license')}>
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload('license')}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                {licenseSignedUrl ? (
                  <img 
                    src={licenseSignedUrl} 
                    alt="Lisensi" 
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => isAdminProvinsi() && handleOpenPreview('license')}
                  />
                ) : referee.license_photo_url ? (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Belum ada foto lisensi</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Foto KTP</p>
                  {isAdminProvinsi() && referee.ktp_photo_url && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenPreview('ktp')}>
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload('ktp')}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                {ktpSignedUrl ? (
                  <img 
                    src={ktpSignedUrl} 
                    alt="KTP" 
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => isAdminProvinsi() && handleOpenPreview('ktp')}
                  />
                ) : referee.ktp_photo_url ? (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Belum ada foto KTP</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Wasit</DialogTitle>
            <DialogDescription>Perbarui informasi wasit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input 
                value={editForm.full_name} 
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Level Lisensi</Label>
              <Select 
                value={editForm.license_level} 
                onValueChange={(v) => setEditForm({ ...editForm, license_level: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih level lisensi" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kabupaten/Kota</Label>
              <Select 
                value={editForm.kabupaten_kota_id} 
                onValueChange={(v) => setEditForm({ ...editForm, kabupaten_kota_id: v })}
              >
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
            <div>
              <Label>AFK Asal</Label>
              <Input 
                value={editForm.afk_origin} 
                onChange={(e) => setEditForm({ ...editForm, afk_origin: e.target.value })}
                placeholder="Contoh: AFK Makassar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleEditSave} disabled={updateReferee.isPending}>
              {updateReferee.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewType === 'license' ? 'Foto Lisensi' : 'Foto KTP'}</DialogTitle>
            <DialogDescription>{referee.full_name}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center overflow-auto">
            {getPreviewUrl() ? (
              <img 
                src={getPreviewUrl()!} 
                alt={previewType === 'license' ? 'Lisensi' : 'KTP'} 
                className="max-h-[60vh] object-contain rounded-lg"
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Tutup
            </Button>
            <Button onClick={() => handleDownload(previewType)}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
