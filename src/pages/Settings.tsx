import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Mail, Building2, Loader2 } from "lucide-react";
import { useSettingsMap, useBulkUpdateSettings } from "@/hooks/useSettings";

export default function Settings() {
  const { settingsMap, isLoading } = useSettingsMap();
  const updateSettings = useBulkUpdateSettings();

  // Email settings state
  const [associationEmail, setAssociationEmail] = useState("");
  const [senderEmailName, setSenderEmailName] = useState("");

  // Organization settings state
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgEmail, setOrgEmail] = useState("");

  // Sync state with fetched data
  useEffect(() => {
    if (settingsMap) {
      setAssociationEmail(settingsMap.association_email || "");
      setSenderEmailName(settingsMap.sender_email_name || "");
      setOrgName(settingsMap.organization_name || "");
      setOrgPhone(settingsMap.organization_phone || "");
      setOrgAddress(settingsMap.organization_address || "");
      setOrgEmail(settingsMap.organization_email || "");
    }
  }, [settingsMap]);

  const handleSaveEmailSettings = () => {
    updateSettings.mutate([
      { key: "association_email", value: associationEmail },
      { key: "sender_email_name", value: senderEmailName },
    ]);
  };

  const handleSaveOrgSettings = () => {
    updateSettings.mutate([
      { key: "organization_name", value: orgName },
      { key: "organization_phone", value: orgPhone },
      { key: "organization_address", value: orgAddress },
      { key: "organization_email", value: orgEmail },
    ]);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola konfigurasi sistem dan organisasi
          </p>
        </div>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organisasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Email</CardTitle>
                <CardDescription>
                  Konfigurasi email untuk notifikasi sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="association_email">Email Asosiasi</Label>
                  <Input
                    id="association_email"
                    type="email"
                    placeholder="email@example.com"
                    value={associationEmail}
                    onChange={(e) => setAssociationEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email ini akan menerima notifikasi pengajuan event baru
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_name">Nama Pengirim Email</Label>
                  <Input
                    id="sender_name"
                    placeholder="FFI Sulsel"
                    value={senderEmailName}
                    onChange={(e) => setSenderEmailName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Nama yang akan muncul sebagai pengirim email
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleSaveEmailSettings}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan Pengaturan Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Organisasi</CardTitle>
                <CardDescription>
                  Data organisasi yang ditampilkan di halaman publik
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Nama Organisasi</Label>
                  <Input
                    id="org_name"
                    placeholder="Federasi Futsal Indonesia - Sulawesi Selatan"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_email">Email Publik</Label>
                  <Input
                    id="org_email"
                    type="email"
                    placeholder="info@ffisulsel.or.id"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_phone">Nomor Telepon</Label>
                  <Input
                    id="org_phone"
                    placeholder="(0411) 123-4567"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_address">Alamat</Label>
                  <Textarea
                    id="org_address"
                    placeholder="Jl. Perintis Kemerdekaan KM 12, Makassar"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleSaveOrgSettings}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan Informasi Organisasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
