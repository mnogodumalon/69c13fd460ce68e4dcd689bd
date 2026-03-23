import { useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichPruefungstermine, enrichFahrstunden } from '@/lib/enrich';
import type { EnrichedPruefungstermine, EnrichedFahrstunden } from '@/types/enriched';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import {
  IconAlertCircle,
  IconUsers,
  IconCalendarEvent,
  IconClipboardCheck,
  IconCar,
  IconPlus,
  IconChartBar,
  IconId,
  IconAlertTriangle,
  IconClock,
  IconMapPin,
  IconBook,
  IconSteeringWheel,
} from '@tabler/icons-react';

export default function DashboardOverview() {
  const {
    schueler, fahrlehrer, fahrzeuge, pruefungstermine, fahrstunden, schnelleintragFahrstunde,
    schuelerMap, fahrlehrerMap, fahrzeugeMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedPruefungstermine = useMemo(
    () => enrichPruefungstermine(pruefungstermine, { schuelerMap, fahrlehrerMap }),
    [pruefungstermine, schuelerMap, fahrlehrerMap]
  );
  const enrichedFahrstunden = useMemo(
    () => enrichFahrstunden(fahrstunden, { schuelerMap, fahrlehrerMap, fahrzeugeMap }),
    [fahrstunden, schuelerMap, fahrlehrerMap, fahrzeugeMap]
  );

  // KPI computations — must be before early returns (Rules of Hooks)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayLessons = useMemo<EnrichedFahrstunden[]>(() => {
    return enrichedFahrstunden.filter((f) => {
      const datum = f.fields.fahrstunde_datum ?? '';
      return datum.startsWith(todayStr) && f.fields.fahrstunde_status?.key === 'geplant';
    }).sort((a, b) => (a.fields.fahrstunde_datum ?? '').localeCompare(b.fields.fahrstunde_datum ?? ''));
  }, [enrichedFahrstunden, todayStr]);

  const upcomingExams = useMemo<EnrichedPruefungstermine[]>(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return enrichedPruefungstermine
      .filter((p) => {
        if (p.fields.pruefung_status?.key !== 'angemeldet') return false;
        const datum = p.fields.pruefung_datum;
        if (!datum) return false;
        const d = new Date(datum);
        return d >= now && d <= in7Days;
      })
      .sort((a, b) => (a.fields.pruefung_datum ?? '').localeCompare(b.fields.pruefung_datum ?? ''))
      .slice(0, 5);
  }, [enrichedPruefungstermine]);

  const vehiclesNeedingTuev = useMemo(() => {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    return fahrzeuge.filter((fz) => {
      const tuev = fz.fields.tuev_datum;
      if (!tuev) return false;
      const d = new Date(tuev);
      return d <= in60Days;
    });
  }, [fahrzeuge]);

  const recentCompleted = useMemo<EnrichedFahrstunden[]>(() => {
    return enrichedFahrstunden
      .filter((f) => f.fields.fahrstunde_status?.key === 'durchgefuehrt')
      .sort((a, b) => (b.fields.fahrstunde_datum ?? '').localeCompare(a.fields.fahrstunde_datum ?? ''))
      .slice(0, 5);
  }, [enrichedFahrstunden]);

  // Suppress unused variable warnings for variables kept for potential use
  void schnelleintragFahrstunde;
  void fahrlehrer;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fahrschul-Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <a href="#/intents/fahrstunde-erfassen">
          <Button className="gap-2 w-full sm:w-auto">
            <IconPlus size={16} />
            Fahrstunde erfassen
          </Button>
        </a>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktive Schüler"
          value={schueler.length}
          description="Gesamt registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Heute geplant"
          value={todayLessons.length}
          description="Fahrstunden heute"
          icon={<IconCalendarEvent size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Prüfungen diese Woche"
          value={upcomingExams.length}
          description="Angemeldet (7 Tage)"
          icon={<IconClipboardCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="TÜV bald fällig"
          value={vehiclesNeedingTuev.length}
          description="Fahrzeuge (60 Tage)"
          icon={<IconAlertTriangle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Intent Navigation */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="#/intents/fahrstunde-erfassen" className="block group">
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <IconSteeringWheel size={20} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Fahrstunde erfassen</h3>
              <p className="text-xs text-muted-foreground">Fahrstunde schnell planen oder als durchgeführt eintragen</p>
            </div>
          </a>

          <a href="#/intents/schueler-fortschritt" className="block group">
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <IconChartBar size={20} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Schüler Fortschritt</h3>
              <p className="text-xs text-muted-foreground">Ausbildungsstand und Stunden je Schüler im Überblick</p>
            </div>
          </a>

          <a href="#/intents/pruefung-vorbereiten" className="block group">
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <IconId size={20} className="text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Prüfung verwalten</h3>
              <p className="text-xs text-muted-foreground">Prüfungstermine anlegen, verwalten und Ergebnisse erfassen</p>
            </div>
          </a>

          <a href="#/intents/fahrzeug-status" className="block group">
            <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 h-full">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                <IconCar size={20} className="text-orange-500" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Fahrzeug Status</h3>
              <p className="text-xs text-muted-foreground">TÜV-Fristen und Fahrzeugverfügbarkeit überwachen</p>
            </div>
          </a>
        </div>
      </div>

      {/* Today's Schedule + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Schedule */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <IconCalendarEvent size={18} className="text-blue-500" />
              <h2 className="font-semibold text-foreground text-sm">Heutiger Stundenplan</h2>
            </div>
            <Badge variant="secondary">{todayLessons.length} geplant</Badge>
          </div>

          {todayLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <IconCalendarEvent size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Keine Fahrstunden heute</p>
              <p className="text-xs text-muted-foreground mt-1">Alle geplanten Stunden wurden bereits abgehalten oder es sind keine eingetragen.</p>
              <a href="#/intents/fahrstunde-erfassen" className="mt-3">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IconPlus size={14} />
                  Fahrstunde planen
                </Button>
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {todayLessons.map((lesson) => {
                const timeStr = lesson.fields.fahrstunde_datum
                  ? new Date(lesson.fields.fahrstunde_datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  : '—';
                const typKey = lesson.fields.stunden_typ?.key ?? '';
                const typColor = lessonTypeColor(typKey);
                return (
                  <div key={lesson.record_id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-sm font-bold text-foreground">{timeStr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {lesson.fahrstunde_schuelerName || 'Unbekannt'}
                        </span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${typColor}`}>
                          {lesson.fields.stunden_typ?.label ?? 'Normal'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <IconUsers size={11} />
                          {lesson.fahrstunde_fahrlehrerName || 'Fahrlehrer n/a'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <IconCar size={11} />
                          {lesson.fahrstunde_fahrzeugName || 'Fahrzeug n/a'}
                        </span>
                        {lesson.fields.dauer_minuten && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconClock size={11} />
                            {lesson.fields.dauer_minuten} Min.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <IconClipboardCheck size={18} className="text-purple-500" />
              <h2 className="font-semibold text-foreground text-sm">Kommende Prüfungen</h2>
            </div>
            <a href="#/intents/pruefung-vorbereiten">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <IconPlus size={12} />
                Neue Prüfung
              </Button>
            </a>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <IconClipboardCheck size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Keine Prüfungen diese Woche</p>
              <p className="text-xs text-muted-foreground mt-1">Keine angemeldeten Prüfungen in den nächsten 7 Tagen.</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingExams.map((exam) => {
                const isTheorie = exam.fields.pruefungsart?.key === 'theorie';
                const dateStr = exam.fields.pruefung_datum
                  ? formatDate(exam.fields.pruefung_datum)
                  : '—';
                const timeStr = exam.fields.pruefung_datum
                  ? new Date(exam.fields.pruefung_datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={exam.record_id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isTheorie ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                      {isTheorie
                        ? <IconBook size={15} className="text-blue-500" />
                        : <IconSteeringWheel size={15} className="text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {exam.pruefung_schuelerName || 'Unbekannt'}
                        </span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${isTheorie ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'}`}>
                          {exam.fields.pruefungsart?.label ?? 'Prüfung'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {dateStr}{timeStr ? ` · ${timeStr} Uhr` : ''}
                        </span>
                        {exam.fields.pruefungsort && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconMapPin size={11} />
                            {exam.fields.pruefungsort}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity + TÜV Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Completed Lessons */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <IconChartBar size={18} className="text-green-500" />
              <h2 className="font-semibold text-foreground text-sm">Zuletzt durchgeführt</h2>
            </div>
            <a href="#/intents/schueler-fortschritt">
              <Button variant="ghost" size="sm" className="h-7 text-xs">Alle anzeigen</Button>
            </a>
          </div>

          {recentCompleted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <p className="text-sm text-muted-foreground">Noch keine abgeschlossenen Fahrstunden.</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentCompleted.map((lesson) => {
                const dateStr = lesson.fields.fahrstunde_datum
                  ? formatDate(lesson.fields.fahrstunde_datum)
                  : '—';
                return (
                  <div key={lesson.record_id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <IconSteeringWheel size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lesson.fahrstunde_schuelerName || 'Unbekannt'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lesson.fahrstunde_fahrlehrerName || 'n/a'} · {lesson.fields.stunden_typ?.label ?? 'Normal'}
                        {lesson.fields.dauer_minuten ? ` · ${lesson.fields.dauer_minuten} Min.` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TÜV Warnings */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <IconAlertTriangle size={18} className="text-orange-500" />
              <h2 className="font-semibold text-foreground text-sm">TÜV-Fristen</h2>
            </div>
            <a href="#/intents/fahrzeug-status">
              <Button variant="ghost" size="sm" className="h-7 text-xs">Alle Fahrzeuge</Button>
            </a>
          </div>

          {vehiclesNeedingTuev.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <IconCar size={18} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Alle Fahrzeuge aktuell</p>
              <p className="text-xs text-muted-foreground mt-1">Keine TÜV-Termine in den nächsten 60 Tagen.</p>
            </div>
          ) : (
            <div className="divide-y">
              {vehiclesNeedingTuev.map((fz) => {
                const tuevDate = fz.fields.tuev_datum ? new Date(fz.fields.tuev_datum) : null;
                const today = new Date();
                const daysLeft = tuevDate
                  ? Math.ceil((tuevDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isOverdue = daysLeft !== null && daysLeft < 0;
                const isUrgent = daysLeft !== null && daysLeft <= 14;
                return (
                  <div key={fz.record_id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-destructive/10' : isUrgent ? 'bg-orange-500/10' : 'bg-yellow-500/10'}`}>
                      <IconCar size={15} className={isOverdue ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-yellow-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {fz.fields.kennzeichen ?? '—'} · {fz.fields.marke ?? ''} {fz.fields.modell ?? ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        TÜV: {fz.fields.tuev_datum ? formatDate(fz.fields.tuev_datum) : '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Überfällig</Badge>
                      ) : daysLeft !== null && daysLeft <= 14 ? (
                        <Badge className="text-xs bg-orange-500 text-white border-0">{daysLeft}d</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{daysLeft}d</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function lessonTypeColor(key: string): string {
  const map: Record<string, string> = {
    normal: 'border-slate-200 text-slate-700',
    ueberlandfahrt: 'border-blue-200 text-blue-700',
    autobahnfahrt: 'border-indigo-200 text-indigo-700',
    nachtfahrt: 'border-violet-200 text-violet-700',
    einweisung: 'border-yellow-200 text-yellow-700',
    pruefungsvorbereitung: 'border-green-200 text-green-700',
    sonstiges: 'border-gray-200 text-gray-600',
  };
  return map[key] ?? 'border-slate-200 text-slate-700';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
