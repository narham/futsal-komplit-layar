import { useState } from "react";
import { Search, Phone, Mail, ChevronDown, ChevronRight, Building2, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const organizationData = {
  name: "Federasi Futsal Sulawesi Selatan",
  established: "2015",
  address: "Jl. Perintis Kemerdekaan KM 12, Makassar",
  phone: "(0411) 123-4567",
  email: "info@ffss.or.id",
};

const departments = [
  {
    id: 1,
    name: "Pengurus Inti",
    members: [
      { id: 1, name: "H. Abdul Rahman", position: "Ketua Umum", phone: "0811-1234-5678" },
      { id: 2, name: "Ir. Budi Hartono", position: "Wakil Ketua I", phone: "0812-2345-6789" },
      { id: 3, name: "Dr. Citra Dewi", position: "Wakil Ketua II", phone: "0813-3456-7890" },
      { id: 4, name: "Muhammad Fadli", position: "Sekretaris Umum", phone: "0814-4567-8901" },
      { id: 5, name: "Hj. Erna Sari", position: "Bendahara Umum", phone: "0815-5678-9012" },
    ],
  },
  {
    id: 2,
    name: "Komisi Wasit",
    members: [
      { id: 6, name: "Gunawan Prasetya", position: "Ketua Komisi", phone: "0816-6789-0123" },
      { id: 7, name: "Herman Susanto", position: "Wakil Ketua", phone: "0817-7890-1234" },
      { id: 8, name: "Indra Wijaya", position: "Koordinator Pelatihan", phone: "0818-8901-2345" },
    ],
  },
  {
    id: 3,
    name: "Komisi Pertandingan",
    members: [
      { id: 9, name: "Joko Widodo", position: "Ketua Komisi", phone: "0819-9012-3456" },
      { id: 10, name: "Kartini Sari", position: "Koordinator Event", phone: "0820-0123-4567" },
      { id: 11, name: "Lukman Hakim", position: "Koordinator Jadwal", phone: "0821-1234-5678" },
    ],
  },
  {
    id: 4,
    name: "Komisi Pembinaan",
    members: [
      { id: 12, name: "Maryam Putri", position: "Ketua Komisi", phone: "0822-2345-6789" },
      { id: 13, name: "Nugroho Santoso", position: "Koordinator Klub", phone: "0823-3456-7890" },
    ],
  },
  {
    id: 5,
    name: "Komisi Media & Humas",
    members: [
      { id: 14, name: "Oscar Panjaitan", position: "Ketua Komisi", phone: "0824-4567-8901" },
      { id: 15, name: "Putri Handayani", position: "Koordinator Media", phone: "0825-5678-9012" },
    ],
  },
];

export default function Organization() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepartments, setOpenDepartments] = useState<number[]>([1]);

  const toggleDepartment = (id: number) => {
    setOpenDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const filteredDepartments = departments.map((dept) => ({
    ...dept,
    members: dept.members.filter((member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((dept) => dept.members.length > 0 || searchQuery === "");

  const totalMembers = departments.reduce((sum, dept) => sum + dept.members.length, 0);

  return (
    <AppLayout title="Struktur Organisasi">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Organization Header */}
        <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-xl">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{organizationData.name}</h2>
                <p className="text-sm text-primary-foreground/80">
                  Berdiri sejak {organizationData.established}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-primary-foreground/90">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {organizationData.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {organizationData.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Total Pengurus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground">Divisi/Komisi</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pengurus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Department List */}
        <div className="space-y-3">
          {filteredDepartments.map((department) => (
            <Collapsible
              key={department.id}
              open={openDepartments.includes(department.id)}
              onOpenChange={() => toggleDepartment(department.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{department.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {department.members.length} anggota
                          </p>
                        </div>
                      </div>
                      {openDepartments.includes(department.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="space-y-3 border-t border-border pt-3">
                      {department.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.position}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <Phone className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
