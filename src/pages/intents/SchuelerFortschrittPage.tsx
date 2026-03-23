import { useState, useMemo } from 'react';
import type { Schueler } from '@/types/app';
import type { EnrichedFahrstunden, EnrichedPruefungstermine } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichFahrstunden, enrichPruefungstermine } from '@/lib/enrich';
import { extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { PageShell } from '@/components/PageShell';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconUser,
  IconPhone,
  IconMail,
  IconCalendar,
  IconCar,
  IconClipboardList,
  IconClock,
  IconChevronRight,
  IconNotes,
} from '@tabler/icons-react';

function getBadgeColor(status: string | undefined): string {
  switch (status) {
    case 'angemeldet': return 'bg-blue-100 text-blue-800';
    case 'bestanden': return 'bg-green-100 text-green-800';
    case 'nicht_bestanden': return 'bg-red-100 text-red-800';
    case 'abgesagt': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getLessonStatusColor(status: string | undefined): string {
  switch (status) {
    case 'geplant': return 'bg-blue-100 text-blue-700';
    case 'durchgefuehrt': return 'bg-green-100 text-green-700';
    case 'abgesagt': return 'bg-red-100 text-red-600';
    case 'verschoben': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

interface StudentCardProps {
  student: Schueler;
  completedCount: number;
  isSelected: boolean;
  onClick: () => void;
}

function StudentCard({ student, completedCount, isSelected, onClick }: StudentCardProps) {
  const { fields } = student;
  const fullName = [fields.schueler_vorname, fields.schueler_nachname].filter(Boolean).join(' ') || 'Unbekannt';
  const theorieBestanden = fields.theorie_bestanden === true;
  const klassen = fields.fuehrerscheinklassen_schueler ?? [];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border bg-card hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{fullName}</span>
            {isSelected && <IconChevronRight size={14} className="text-primary flex-shrink-0" />}
          </div>
          {klassen.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {klassen.slice(0, 3).map(k => (
                <span
                  key={k.key}
                  className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                >
                  {k.label}
                </span>
              ))}
              {klassen.length > 3 && (
                <span className="text-xs text-muted-foreground">+{klassen.length - 3}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {completedCount} Std. absolviert
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {theorieBestanden ? (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              <IconCheck size={11} stroke={2.5} />
              Theorie
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
              <IconX size={11} stroke={2.5} />
              Theorie
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface DetailPanelProps {
  student: Schueler;
  lessons: EnrichedFahrstunden[];
  exams: EnrichedPruefungstermine[];
}

function DetailPanel({ student, lessons, exams }: DetailPanelProps) {
  const { fields } = student;
  const fullName = [fields.schueler_vorname, fields.schueler_nachname].filter(Boolean).join(' ') || 'Unbekannt';
  const theorieBestanden = fields.theorie_bestanden === true;
  const klassen = fields.fuehrerscheinklassen_schueler ?? [];

  const completedLessons = useMemo(
    () => lessons.filter(l => l.fields.fahrstunde_status?.key === 'durchgefuehrt'),
    [lessons]
  );

  const totalMinutes = useMemo(
    () => completedLessons.reduce((sum, l) => sum + (l.fields.dauer_minuten ?? 0), 0),
    [completedLessons]
  );
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  const upcomingLessons = useMemo(
    () =>
      lessons
        .filter(l => l.fields.fahrstunde_status?.key === 'geplant')
        .sort((a, b) => {
          const da = a.fields.fahrstunde_datum ?? '';
          const db = b.fields.fahrstunde_datum ?? '';
          return da.localeCompare(db);
        })
        .slice(0, 3),
    [lessons]
  );

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const da = a.fields.pruefung_datum ?? '';
        const db = b.fields.pruefung_datum ?? '';
        return db.localeCompare(da);
      }),
    [exams]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <IconUser size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{fullName}</h2>
            <div className="flex flex-wrap gap-3 mt-1">
              {fields.schueler_telefon && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <IconPhone size={13} />
                  {fields.schueler_telefon}
                </span>
              )}
              {fields.schueler_email && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <IconMail size={13} />
                  <span className="truncate">{fields.schueler_email}</span>
                </span>
              )}
              {fields.anmeldedatum && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <IconCalendar size={13} />
                  Angemeldet {formatDate(fields.anmeldedatum)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground mr-1">Theorie:</span>
          {theorieBestanden ? (
            <span className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              <IconCheck size={13} stroke={2.5} />
              Bestanden
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              <IconX size={13} stroke={2.5} />
              Ausstehend
            </span>
          )}
          {klassen.length > 0 && (
            <>
              <span className="text-sm font-medium text-muted-foreground ml-2 mr-1">Klassen:</span>
              {klassen.map(k => (
                <span
                  key={k.key}
                  className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  {k.label}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <IconCar size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Fahrstunden</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{completedLessons.length}</span>
          <span className="text-xs text-muted-foreground">durchgeführt</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <IconClock size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Fahrstunden</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{totalHours}</span>
          <span className="text-xs text-muted-foreground">Stunden gesamt</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <IconClipboardList size={15} />
            <span className="text-xs font-medium uppercase tracking-wide">Prüfungen</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{exams.length}</span>
          <span className="text-xs text-muted-foreground">insgesamt</span>
        </div>
      </div>

      {/* Upcoming Lessons */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Geplante Fahrstunden</h3>
        </div>
        {upcomingLessons.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Keine geplanten Fahrstunden
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingLessons.map(lesson => (
              <div key={lesson.record_id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {lesson.fields.stunden_typ?.label ?? 'Fahrstunde'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(lesson.fields.fahrstunde_datum)}
                    {lesson.fields.dauer_minuten ? ` · ${lesson.fields.dauer_minuten} Min.` : ''}
                    {lesson.fahrstunde_fahrlehrerName ? ` · ${lesson.fahrstunde_fahrlehrerName}` : ''}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getLessonStatusColor(lesson.fields.fahrstunde_status?.key)}`}>
                  {lesson.fields.fahrstunde_status?.label ?? 'Geplant'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Prüfungstermine</h3>
        </div>
        {sortedExams.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Keine Prüfungstermine eingetragen
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedExams.map(exam => (
              <div key={exam.record_id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {exam.fields.pruefungsart?.label ?? 'Prüfung'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(exam.fields.pruefung_datum)}
                    {exam.fields.pruefungsort ? ` · ${exam.fields.pruefungsort}` : ''}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getBadgeColor(exam.fields.pruefung_status?.key)}`}
                >
                  {exam.fields.pruefung_status?.label ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {fields.notizen_schueler && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconNotes size={15} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Notizen</span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{fields.notizen_schueler}</p>
        </div>
      )}
    </div>
  );
}

export default function SchuelerFortschrittPage() {
  const {
    schueler,
    fahrstunden,
    pruefungstermine,
    schuelerMap,
    fahrlehrerMap,
    fahrzeugeMap,
    loading,
    error,
  } = useDashboardData();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enrichedFahrstunden = useMemo(
    () => enrichFahrstunden(fahrstunden, { schuelerMap, fahrlehrerMap, fahrzeugeMap }),
    [fahrstunden, schuelerMap, fahrlehrerMap, fahrzeugeMap]
  );

  const enrichedPruefungstermine = useMemo(
    () => enrichPruefungstermine(pruefungstermine, { schuelerMap, fahrlehrerMap }),
    [pruefungstermine, schuelerMap, fahrlehrerMap]
  );

  const completedCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    enrichedFahrstunden.forEach(l => {
      if (l.fields.fahrstunde_status?.key === 'durchgefuehrt') {
        const id = extractRecordId(l.fields.fahrstunde_schueler);
        if (id) map.set(id, (map.get(id) ?? 0) + 1);
      }
    });
    return map;
  }, [enrichedFahrstunden]);

  const filteredSchueler = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return schueler;
    return schueler.filter(s => {
      const name = [s.fields.schueler_vorname, s.fields.schueler_nachname]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return name.includes(q);
    });
  }, [schueler, search]);

  const selectedStudent = useMemo(
    () => (selectedId ? schuelerMap.get(selectedId) ?? null : null),
    [selectedId, schuelerMap]
  );

  const selectedLessons = useMemo(() => {
    if (!selectedId) return [];
    return enrichedFahrstunden.filter(
      l => extractRecordId(l.fields.fahrstunde_schueler) === selectedId
    );
  }, [selectedId, enrichedFahrstunden]);

  const selectedExams = useMemo(() => {
    if (!selectedId) return [];
    return enrichedPruefungstermine.filter(
      e => extractRecordId(e.fields.pruefung_schueler) === selectedId
    );
  }, [selectedId, enrichedPruefungstermine]);

  if (loading) {
    return (
      <PageShell title="Schüler Fortschritt" subtitle="Lernfortschritt und Fahrstunden je Schüler im Überblick">
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Daten werden geladen...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Schüler Fortschritt" subtitle="Lernfortschritt und Fahrstunden je Schüler im Überblick">
        <div className="flex items-center justify-center h-64 text-destructive text-sm">
          Fehler: {error.message}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Schüler Fortschritt" subtitle="Lernfortschritt und Fahrstunden je Schüler im Überblick">
      <div className="flex gap-4 h-[calc(100vh-10rem)] min-h-0">
        {/* Left: Student List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 min-h-0">
          {/* Search */}
          <div className="relative">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Schüler suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Count */}
          <div className="text-xs text-muted-foreground px-0.5">
            {filteredSchueler.length} von {schueler.length} Schülern
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {filteredSchueler.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Keine Schüler gefunden
              </div>
            ) : (
              filteredSchueler.map(s => (
                <StudentCard
                  key={s.record_id}
                  student={s}
                  completedCount={completedCountByStudent.get(s.record_id) ?? 0}
                  isSelected={selectedId === s.record_id}
                  onClick={() => setSelectedId(s.record_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border flex-shrink-0" />

        {/* Right: Detail Panel */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-1">
          {selectedStudent ? (
            <DetailPanel
              student={selectedStudent}
              lessons={selectedLessons}
              exams={selectedExams}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <IconUser size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">Schüler auswählen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wähle einen Schüler aus der Liste, um den Fortschritt anzuzeigen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
