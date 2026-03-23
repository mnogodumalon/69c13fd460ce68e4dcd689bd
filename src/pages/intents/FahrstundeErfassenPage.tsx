import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichFahrstunden } from '@/lib/enrich';
import type { EnrichedFahrstunden } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Fahrstunden } from '@/types/app';
import { formatDate } from '@/lib/formatters';
import { FahrstundenDialog } from '@/components/dialogs/FahrstundenDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconPlus,
  IconCheck,
  IconClock,
  IconUser,
  IconCar,
  IconCalendar,
  IconPencil,
  IconAlertCircle,
} from '@tabler/icons-react';
import { parseISO, isAfter, isBefore, addDays, startOfDay, endOfDay, format } from 'date-fns';
import { de } from 'date-fns/locale';

const STUNDEN_TYP_LABELS: Record<string, string> = {
  normal: 'Normalfahrt',
  ueberlandfahrt: 'Überlandfahrt',
  autobahnfahrt: 'Autobahnfahrt',
  nachtfahrt: 'Nachtfahrt',
  einweisung: 'Einweisung',
  pruefungsvorbereitung: 'Prüfungsvorbereitung',
  sonstiges: 'Sonstiges',
};

function getStatusBadge(status: string | undefined) {
  const key = status ?? '';
  if (key === 'geplant') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Geplant</Badge>;
  if (key === 'durchgefuehrt') return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Durchgeführt</Badge>;
  if (key === 'abgesagt') return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Abgesagt</Badge>;
  if (key === 'verschoben') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Verschoben</Badge>;
  return <Badge variant="outline">{key || '—'}</Badge>;
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEE, dd.MM. · HH:mm', { locale: de }) + ' Uhr';
  } catch {
    return formatDate(dateStr);
  }
}

export default function FahrstundeErfassenPage() {
  const {
    fahrstunden,
    schueler,
    fahrlehrer,
    fahrzeuge,
    schuelerMap,
    fahrlehrerMap,
    fahrzeugeMap,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedFahrstunden | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const enrichedFahrstunden = useMemo(
    () => enrichFahrstunden(fahrstunden, { schuelerMap, fahrlehrerMap, fahrzeugeMap }),
    [fahrstunden, schuelerMap, fahrlehrerMap, fahrzeugeMap]
  );

  const upcomingLessons = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekEnd = endOfDay(addDays(now, 7));
    return enrichedFahrstunden
      .filter((f) => {
        if (!f.fields.fahrstunde_datum) return false;
        try {
          const d = parseISO(f.fields.fahrstunde_datum);
          return !isBefore(d, todayStart) && !isAfter(d, weekEnd);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const da = a.fields.fahrstunde_datum ?? '';
        const db = b.fields.fahrstunde_datum ?? '';
        return da.localeCompare(db);
      });
  }, [enrichedFahrstunden]);

  const todayLessons = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    return upcomingLessons.filter((f) => {
      if (!f.fields.fahrstunde_datum) return false;
      try {
        const d = parseISO(f.fields.fahrstunde_datum);
        return !isBefore(d, todayStart) && !isAfter(d, todayEnd);
      } catch {
        return false;
      }
    });
  }, [upcomingLessons]);

  const futureLessons = useMemo(() => {
    const todayEnd = endOfDay(new Date());
    return upcomingLessons.filter((f) => {
      if (!f.fields.fahrstunde_datum) return false;
      try {
        const d = parseISO(f.fields.fahrstunde_datum);
        return isAfter(d, todayEnd);
      } catch {
        return false;
      }
    });
  }, [upcomingLessons]);

  async function handleMarkDone(lesson: EnrichedFahrstunden) {
    setCompleting(lesson.record_id);
    try {
      await LivingAppsService.updateFahrstundenEntry(lesson.record_id, {
        fahrstunde_status: { key: 'durchgefuehrt', label: 'Durchgeführt' },
      });
      await fetchAll();
    } finally {
      setCompleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <IconAlertCircle size={40} className="text-destructive mx-auto" />
          <p className="text-destructive font-medium">Fehler beim Laden</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <Button onClick={fetchAll} variant="outline">Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fahrstunde erfassen</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Neue Fahrstunde buchen oder heutige Stunden verwalten
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2"
          size="lg"
        >
          <IconPlus size={18} stroke={2} />
          Neue Fahrstunde
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left panel: Today's lessons */}
        <div className="space-y-4">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconCalendar size={18} stroke={2} className="text-primary" />
                  Heute
                  <Badge variant="secondary" className="ml-1">{todayLessons.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {todayLessons.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <IconCalendar size={32} stroke={1.5} className="mx-auto mb-2 opacity-40" />
                  Keine Fahrstunden heute
                </div>
              ) : (
                <ul className="divide-y">
                  {todayLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.record_id}
                      lesson={lesson}
                      onEdit={() => setEditRecord(lesson)}
                      onMarkDone={() => handleMarkDone(lesson)}
                      completing={completing === lesson.record_id}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Upcoming lessons */}
        <div className="space-y-4">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconClock size={18} stroke={2} className="text-primary" />
                  Nächste 7 Tage
                  <Badge variant="secondary" className="ml-1">{futureLessons.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {futureLessons.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <IconClock size={32} stroke={1.5} className="mx-auto mb-2 opacity-40" />
                  Keine geplanten Fahrstunden
                </div>
              ) : (
                <ul className="divide-y">
                  {futureLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.record_id}
                      lesson={lesson}
                      onEdit={() => setEditRecord(lesson)}
                      onMarkDone={() => handleMarkDone(lesson)}
                      completing={completing === lesson.record_id}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <FahrstundenDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (fields: Fahrstunden['fields']) => {
          await LivingAppsService.createFahrstundenEntry(fields);
          fetchAll();
        }}
        defaultValues={undefined}
        schuelerList={schueler}
        fahrlehrerList={fahrlehrer}
        fahrzeugeList={fahrzeuge}
      />

      {/* Edit Dialog */}
      <FahrstundenDialog
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        onSubmit={async (fields: Fahrstunden['fields']) => {
          if (editRecord) {
            await LivingAppsService.updateFahrstundenEntry(editRecord.record_id, fields);
            fetchAll();
          }
        }}
        defaultValues={editRecord?.fields}
        schuelerList={schueler}
        fahrlehrerList={fahrlehrer}
        fahrzeugeList={fahrzeuge}
      />
    </div>
  );
}

interface LessonCardProps {
  lesson: EnrichedFahrstunden;
  onEdit: () => void;
  onMarkDone: () => void;
  completing: boolean;
}

function LessonCard({ lesson, onEdit, onMarkDone, completing }: LessonCardProps) {
  const isGeplant = lesson.fields.fahrstunde_status?.key === 'geplant';
  const typLabel =
    STUNDEN_TYP_LABELS[lesson.fields.stunden_typ?.key ?? ''] ??
    lesson.fields.stunden_typ?.label ??
    '—';

  const schuelerName = lesson.fahrstunde_schuelerName || '—';
  const fahrlehrerName = lesson.fahrstunde_fahrlehrerName || '—';
  const fahrzeugName = lesson.fahrstunde_fahrzeugName || '—';

  return (
    <li className="px-4 py-3 hover:bg-secondary/40 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        {/* Left: time + type badge */}
        <div className="flex-shrink-0 min-w-[6rem]">
          <p className="text-xs font-semibold text-muted-foreground leading-tight">
            {lesson.fields.fahrstunde_datum
              ? format(parseISO(lesson.fields.fahrstunde_datum), 'HH:mm', { locale: de }) + ' Uhr'
              : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lesson.fields.fahrstunde_datum
              ? format(parseISO(lesson.fields.fahrstunde_datum), 'EEE dd.MM.', { locale: de })
              : ''}
          </p>
          {lesson.fields.dauer_minuten != null && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {lesson.fields.dauer_minuten} min
            </p>
          )}
        </div>

        {/* Center: info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(lesson.fields.fahrstunde_status?.key)}
            <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {typLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-foreground min-w-0">
            <IconUser size={13} stroke={2} className="text-muted-foreground flex-shrink-0" />
            <span className="truncate font-medium">{schuelerName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconUser size={11} stroke={2} />
              <span className="truncate">{fahrlehrerName}</span>
            </span>
            <span className="flex items-center gap-1">
              <IconCar size={11} stroke={2} />
              <span className="truncate">{fahrzeugName}</span>
            </span>
          </div>
          {lesson.fields.notizen_fahrstunde && (
            <p className="text-xs text-muted-foreground line-clamp-1 italic">
              {lesson.fields.notizen_fahrstunde}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isGeplant && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
              onClick={onMarkDone}
              disabled={completing}
              title="Als durchgeführt markieren"
            >
              {completing ? (
                <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconCheck size={15} stroke={2.5} />
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="Bearbeiten"
          >
            <IconPencil size={14} stroke={2} />
          </Button>
        </div>
      </div>
    </li>
  );
}
