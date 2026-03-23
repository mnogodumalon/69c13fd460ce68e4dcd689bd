import { useState, useMemo } from 'react';
import type { Fahrzeuge } from '@/types/app';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { FahrzeugeDialog } from '@/components/dialogs/FahrzeugeDialog';
import { formatDate } from '@/lib/formatters';
import { PageShell } from '@/components/PageShell';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconCar,
  IconBike,
  IconTruck,
  IconBus,
  IconTractor,
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconPencil,
  IconGauge,
  IconClock,
} from '@tabler/icons-react';

type TuevFilter = 'alle' | 'dringend' | 'bald' | 'ok';

function getVehicleIcon(typ: string | undefined) {
  switch (typ) {
    case 'motorrad':
      return <IconBike size={28} stroke={1.5} />;
    case 'lkw':
      return <IconTruck size={28} stroke={1.5} />;
    case 'bus':
      return <IconBus size={28} stroke={1.5} />;
    case 'traktor':
      return <IconTractor size={28} stroke={1.5} />;
    default:
      return <IconCar size={28} stroke={1.5} />;
  }
}

interface TuevInfo {
  days: number | null;
  status: 'overdue' | 'urgent' | 'warning' | 'ok' | 'none';
}

function getTuevInfo(tuevDatum: string | undefined): TuevInfo {
  if (!tuevDatum) return { days: null, status: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tuevDate = new Date(tuevDatum);
  tuevDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((tuevDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, status: 'overdue' };
  if (days <= 30) return { days, status: 'urgent' };
  if (days <= 60) return { days, status: 'warning' };
  return { days, status: 'ok' };
}

function getTuevSortOrder(status: TuevInfo['status']): number {
  switch (status) {
    case 'overdue': return 0;
    case 'urgent': return 1;
    case 'warning': return 2;
    case 'ok': return 3;
    case 'none': return 4;
  }
}

interface VehicleCardProps {
  fahrzeug: Fahrzeuge;
  tuevInfo: TuevInfo;
  lessonsThisMonth: number;
  hoursThisMonth: number;
  onEdit: (fahrzeug: Fahrzeuge) => void;
}

function TuevBadge({ tuevInfo, tuevDatum }: { tuevInfo: TuevInfo; tuevDatum?: string }) {
  if (tuevInfo.status === 'none') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Kein TÜV
      </span>
    );
  }
  if (tuevInfo.status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
        <IconAlertTriangle size={12} stroke={2} />
        TUV uberfällig!
      </span>
    );
  }
  if (tuevInfo.status === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <IconAlertTriangle size={12} stroke={2} />
        TUV in {tuevInfo.days} Tagen
      </span>
    );
  }
  if (tuevInfo.status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <IconClock size={12} stroke={2} />
        TUV in {tuevInfo.days} Tagen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <IconCheck size={12} stroke={2.5} />
      TUV OK &mdash; {tuevDatum ? formatDate(tuevDatum) : ''}
    </span>
  );
}

function VehicleCard({ fahrzeug, tuevInfo, lessonsThisMonth, hoursThisMonth, onEdit }: VehicleCardProps) {
  const typ = fahrzeug.fields.fahrzeugtyp?.key;

  const borderColor =
    tuevInfo.status === 'overdue'
      ? 'border-l-destructive'
      : tuevInfo.status === 'urgent'
      ? 'border-l-orange-500'
      : tuevInfo.status === 'warning'
      ? 'border-l-yellow-400'
      : tuevInfo.status === 'ok'
      ? 'border-l-green-500'
      : 'border-l-border';

  const iconBg =
    tuevInfo.status === 'overdue'
      ? 'bg-destructive/10 text-destructive'
      : tuevInfo.status === 'urgent'
      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
      : tuevInfo.status === 'warning'
      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-secondary text-muted-foreground';

  return (
    <Card className={`overflow-hidden border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconBg}`}>
            {getVehicleIcon(typ)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-wide truncate">
                  {fahrzeug.fields.kennzeichen ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {[fahrzeug.fields.marke, fahrzeug.fields.modell, fahrzeug.fields.baujahr ? `(${fahrzeug.fields.baujahr})` : null]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0"
                onClick={() => onEdit(fahrzeug)}
              >
                <IconPencil size={14} stroke={2} />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {fahrzeug.fields.fuehrerscheinklasse_fz && (
                <Badge variant="secondary" className="text-xs">
                  {fahrzeug.fields.fuehrerscheinklasse_fz.label}
                </Badge>
              )}
              {fahrzeug.fields.fahrzeugtyp && (
                <Badge variant="outline" className="text-xs">
                  {fahrzeug.fields.fahrzeugtyp.label}
                </Badge>
              )}
            </div>

            <div className="mt-3">
              <TuevBadge tuevInfo={tuevInfo} tuevDatum={fahrzeug.fields.tuev_datum} />
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconGauge size={13} stroke={1.5} />
                <span className="font-medium text-foreground">{lessonsThisMonth}</span> Stunden diesen Monat
              </span>
              <span className="flex items-center gap-1">
                <IconClock size={13} stroke={1.5} />
                <span className="font-medium text-foreground">{Math.round(hoursThisMonth * 10) / 10}h</span> gesamt
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FahrzeugStatusPage() {
  const { fahrzeuge, fahrstunden, loading, error, fetchAll } = useDashboardData();
  const [editVehicle, setEditVehicle] = useState<Fahrzeuge | null>(null);
  const [activeFilter, setActiveFilter] = useState<TuevFilter>('alle');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const vehicleStats = useMemo(() => {
    return fahrzeuge.map((fahrzeug) => {
      const relevantLessons = fahrstunden.filter((fs) => {
        if (!fs.fields.fahrstunde_fahrzeug) return false;
        const vid = extractRecordId(fs.fields.fahrstunde_fahrzeug);
        if (vid !== fahrzeug.record_id) return false;
        if (!fs.fields.fahrstunde_datum) return false;
        const d = new Date(fs.fields.fahrstunde_datum);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const completedLessons = relevantLessons.filter(
        (fs) => fs.fields.fahrstunde_status?.key === 'durchgefuehrt'
      );
      const totalMinutes = completedLessons.reduce(
        (acc, fs) => acc + (fs.fields.dauer_minuten ?? 0),
        0
      );
      return {
        fahrzeug,
        tuevInfo: getTuevInfo(fahrzeug.fields.tuev_datum),
        lessonsThisMonth: completedLessons.length,
        hoursThisMonth: totalMinutes / 60,
      };
    });
  }, [fahrzeuge, fahrstunden, currentMonth, currentYear]);

  const kpiData = useMemo(() => {
    const total = vehicleStats.length;
    const urgent = vehicleStats.filter(
      (v) => v.tuevInfo.status === 'overdue' || v.tuevInfo.status === 'urgent'
    ).length;
    const warning = vehicleStats.filter(
      (v) => v.tuevInfo.status === 'warning'
    ).length;
    return { total, urgent, warning };
  }, [vehicleStats]);

  const sortedAndFiltered = useMemo(() => {
    let result = vehicleStats;

    if (activeFilter === 'dringend') {
      result = result.filter(
        (v) => v.tuevInfo.status === 'overdue' || v.tuevInfo.status === 'urgent'
      );
    } else if (activeFilter === 'bald') {
      result = result.filter((v) => v.tuevInfo.status === 'warning');
    } else if (activeFilter === 'ok') {
      result = result.filter((v) => v.tuevInfo.status === 'ok');
    }

    return [...result].sort(
      (a, b) => getTuevSortOrder(a.tuevInfo.status) - getTuevSortOrder(b.tuevInfo.status)
    );
  }, [vehicleStats, activeFilter]);

  if (loading) {
    return (
      <PageShell title="Fahrzeug Status" subtitle="Fahrzeugflotte und TUV-Ubersicht">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Lade Fahrzeugdaten...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Fahrzeug Status" subtitle="Fahrzeugflotte und TUV-Ubersicht">
        <div className="flex items-center justify-center h-64 text-destructive">
          Fehler: {error.message}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fahrzeug Status" subtitle="Fahrzeugflotte und TUV-Ubersicht">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Fahrzeuge gesamt"
            value={String(kpiData.total)}
            description="in der Flotte"
            icon={<IconCar size={18} className="text-muted-foreground" />}
          />
          <StatCard
            title="TUV dringend"
            value={String(kpiData.urgent)}
            description="uberfällig oder innerhalb 30 Tagen"
            icon={<IconAlertTriangle size={18} className="text-destructive" />}
          />
          <StatCard
            title="TUV bald"
            value={String(kpiData.warning)}
            description="innerhalb 60 Tagen fällig"
            icon={<IconCalendar size={18} className="text-yellow-500" />}
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as TuevFilter)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="alle" className="flex-1 sm:flex-none">
              Alle ({vehicleStats.length})
            </TabsTrigger>
            <TabsTrigger value="dringend" className="flex-1 sm:flex-none">
              TUV dringend (≤30 Tage)
            </TabsTrigger>
            <TabsTrigger value="bald" className="flex-1 sm:flex-none">
              TUV bald (≤60 Tage)
            </TabsTrigger>
            <TabsTrigger value="ok" className="flex-1 sm:flex-none">
              TUV OK
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Vehicle Grid */}
        {sortedAndFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground gap-2">
            <IconCar size={40} stroke={1} className="opacity-30" />
            <p className="text-sm">Keine Fahrzeuge in dieser Kategorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFiltered.map(({ fahrzeug, tuevInfo, lessonsThisMonth, hoursThisMonth }) => (
              <VehicleCard
                key={fahrzeug.record_id}
                fahrzeug={fahrzeug}
                tuevInfo={tuevInfo}
                lessonsThisMonth={lessonsThisMonth}
                hoursThisMonth={hoursThisMonth}
                onEdit={setEditVehicle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <FahrzeugeDialog
        open={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        onSubmit={async (fields) => {
          await LivingAppsService.updateFahrzeugeEntry(editVehicle!.record_id, fields);
          fetchAll();
        }}
        defaultValues={editVehicle?.fields}
      />
    </PageShell>
  );
}
