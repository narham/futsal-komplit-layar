import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ClipboardList,
  Building2,
  UserPlus,
  CalendarPlus,
  FileCheck,
  Loader2,
  Database,
  BarChart3,
  ClipboardCheck,
  Settings,
  BookOpen,
  MessageSquare,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickActionGrid, QuickActionItem } from "@/components/ui/quick-action-grid";
import { useDashboardSummary, formatCurrency } from "@/hooks/useReports";
import { useAuditLogs, getActionLabel } from "@/hooks/useAuditLogs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Dashboard() {
  const { role, kabupatenKotaId, isAdminProvinsi } = useAuth();
  
  // Apply regional filter for admin kab/kota
  const filters = isAdminProvinsi() ? {} : { kabupatenKotaId };
  
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(filters);
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs({ limit: 5 });

  const roleLabel = role === "admin_provinsi" ? "Admin Provinsi" : 
                   role === "admin_kab_kota" ? "Admin Kab/Kota" : "Admin";

  // Quick Actions for all admins
  const baseQuickActions: QuickActionItem[] = [
    { 
      icon: Calendar, 
      label: "Event", 
      path: "/events",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary"
    },
    { 
      icon: Users, 
      label: "Wasit", 
      path: "/referees",
      iconBgClass: "bg-info/10",
      iconColorClass: "text-info"
    },
    { 
      icon: FileCheck, 
      label: "Persetujuan", 
      path: "/approvals",
      iconBgClass: "bg-warning/10",
      iconColorClass: "text-warning"
    },
    { 
      icon: ClipboardCheck, 
      label: "Evaluasi", 
      path: "/evaluations",
      iconBgClass: "bg-success/10",
      iconColorClass: "text-success"
    },
  ];

  // Second row of quick actions
  const secondRowActions: QuickActionItem[] = [
    { 
      icon: Building2, 
      label: "Organisasi", 
      path: "/organization",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary"
    },
    { 
      icon: BookOpen, 
      label: "Materi", 
      path: "/admin/learning",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
    { 
      icon: MessageSquare, 
      label: "Diskusi", 
      path: "/admin/discussions",
      iconBgClass: "bg-info/10",
      iconColorClass: "text-info"
    },
    { 
      icon: Settings, 
      label: "Pengaturan", 
      path: "/settings",
      iconBgClass: "bg-muted",
      iconColorClass: "text-muted-foreground"
    },
  ];

  // Admin exclusive actions (both admin_provinsi and admin_kab_kota)
  const adminActions: QuickActionItem[] = [
    { 
      icon: Wallet, 
      label: "Honor Wasit", 
      path: "/admin/honor",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColorClass: "text-emerald-600 dark:text-emerald-400"
    },
  ];

  // Admin provinsi exclusive actions
  const adminProvinsiActions: QuickActionItem[] = isAdminProvinsi() ? [
    { 
      icon: BarChart3, 
      label: "Analytics", 
      path: "/analytics",
      iconBgClass: "bg-purple-100 dark:bg-purple-900/30",
      iconColorClass: "text-purple-600 dark:text-purple-400"
    },
    { 
      icon: UserCheck, 
      label: "Persetujuan User", 
      path: "/user-approvals",
      iconBgClass: "bg-warning/10",
      iconColorClass: "text-warning"
    },
    { 
      icon: Database, 
      label: "Export DB", 
      path: "/export",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
  ] : [];

  const getActivityIcon = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED")) return CheckCircle;
    if (action.includes("REJECT")) return XCircle;
    if (action.includes("SUBMIT")) return CalendarPlus;
    if (action.includes("ASSIGN")) return UserPlus;
    return ClipboardList;
  };

  const getActivityStatus = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED") || action.includes("COMPLETE")) return "success";
    if (action.includes("REJECT")) return "error";
    if (action.includes("SUBMIT") || action.includes("PENDING")) return "warning";
    return "info";
  };

  return (
    <AppLayout title="FFSS">
      <div className="p-4 space-y-5 animate-fade-in pb-24">
        {/* Header Card */}
        <div className="gradient-primary rounded-2xl p-5 text-primary-foreground shadow-lg">
          <StatusBadge status="primary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-2">
            {roleLabel}
          </StatusBadge>
          <h2 className="text-xl font-bold mb-1">Selamat Datang, Admin!</h2>
          <p className="text-sm text-primary-foreground/80">
            Kelola aktivitas futsal Sulawesi Selatan.
          </p>
        </div>

        {/* Summary Stats */}
        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-primary">{summary?.total_events || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Total Event</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-primary">{summary?.total_referees || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Total Wasit</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-success">{summary?.completed_events || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Selesai</p>
                </div>
              </div>
              {(summary?.total_verified_income || summary?.total_pending_income) ? (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Honor Verified</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(summary?.total_verified_income || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Honor Pending</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(summary?.total_pending_income || 0)}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Akses Cepat
          </h3>
          <QuickActionGrid items={baseQuickActions} columns={4} />
          <div className="mt-3">
            <QuickActionGrid items={secondRowActions} columns={4} />
          </div>
          <div className="mt-3">
            <QuickActionGrid items={[...adminActions, ...adminProvinsiActions]} columns={isAdminProvinsi() ? 4 : 3} />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary h-8" asChild>
                  <Link to="/audit-logs">
                    Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log, index) => {
                  const ActivityIcon = getActivityIcon(log.action);
                  const status = getActivityStatus(log.action);
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        index !== auditLogs.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className={`icon-circle-sm flex-shrink-0 ${
                        status === "success" ? "bg-success/10" :
                        status === "warning" ? "bg-warning/10" :
                        status === "error" ? "bg-destructive/10" :
                        "bg-info/10"
                      }`}>
                        <ActivityIcon className={`h-4 w-4 ${
                          status === "success" ? "text-success" :
                          status === "warning" ? "text-warning" :
                          status === "error" ? "text-destructive" :
                          "text-info"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{getActionLabel(log.action as any)}</p>
                          <StatusBadge 
                            status={status === "success" ? "success" : status === "warning" ? "warning" : status === "error" ? "error" : "info"} 
                            className="flex-shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {status === "success" ? "Selesai" :
                             status === "warning" ? "Menunggu" :
                             status === "error" ? "Ditolak" : "Info"}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.entity_type} - {log.actor_name || "System"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
