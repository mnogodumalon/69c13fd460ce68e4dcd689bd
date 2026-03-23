import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichPruefungstermine } from '@/lib/enrich';
import type { EnrichedPruefungstermine } from '@/types/enriched';
import type { Schueler, Fahrlehrer } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { PruefungstermineDialog } from '@/components/dialogs/PruefungstermineDialog';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  IconPlus,
  IconCheck,
  IconX,
  IconCalendar,
  IconMapPin,
  IconUser,
  IconPencil,
  IconClipboardList,
} from '@tabler/icons-react';

type StatusFilter = 'alle' | 'angemeldet' | 'bestanden' | 'nicht_bestanden' | 'abgesagt';

const STATUS_LABELS: Record<string, string> = {
  angemeldet: 'Angemeldet',
  bestanden: 'Bestanden',
  nicht_bestanden: 'Nicht bestanden',
  abgesagt: 'Abgesagt',
};

function getStatusBadgeClass(key: string | undefined): string {
  switch (key) {
    case 'angemeldet': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'bestanden': return 'bg-green-100 text-green-800 border-green-200';
    case 'nicht_bestanden': return 'bg-red-100 text-red-800 border-red-200';
    case 'abgesagt': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function sortExams(exams: EnrichedPruefungstermine[]): EnrichedPruefungstermine[] {
  return [...exams].sort((a, b) => {
    const aStatus = a.fields.pruefung_status?.key;
    const bStatus = b.fields.pruefung_status?.key;
    const aDate = a.fields.pruefung_datum ?? '';
    const bDate = b.fields.pruefung_datum ?? '';

    const aIsAngemeldet = aStatus === 'angemeldet';
    const bIsAngemeldet = bStatus === 'angemeldet';

    if (aIsAngemeldet && bIsAngemeldet) return aDate.localeCompare(bDate);
    if (aIsAngemeldet) return -1;
    if (bIsAngemeldet) return 1;
    return bDate.localeCompare(aDate);
  });
}

interface ExamCardProps {
  exam: EnrichedPruefungstermine;
  onEdit: (exam: EnrichedPruefungstermine) => void;
  onUpdateStatus: (exam: EnrichedPruefungstermine, status: 'bestanden' | 'nicht_bestanden') => void;
  updating: string | null;
}

function ExamCard({ exam, onEdit, onUpdateStatus, updating }: ExamCardProps) {
  const statusKey = exam.fields.pruefung_status?.key;
  const isAngemeldet = statusKey === 'angemeldet';
  const isUpdating = updating === exam.record_id;

  const formattedDate = exam.fields.pruefung_datum
    ? formatDate(exam.fields.pruefung_datum)
    : '—';

  const timeStr = exam.fields.pruefung_datum
    ? (() => {
        const d = exam.fields.pruefung_datum;
        const tIndex = d.indexOf('T');
        return tIndex !== -1 ? d.substring(tIndex + 1, tIndex + 6) : '';
      })()
    : '';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <IconCalendar size={15} className="text-muted-foreground shrink-0" />
              <span className="font-semibold text-sm">
                {formattedDate}
                {timeStr && <span className="text-muted-foreground ml-1 font-normal">{timeStr} Uhr</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <IconUser size={15} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {exam.pruefung_schuelerName || '—'}
              </span>
            </div>
            {exam.fields.pruefungsort && (
              <div className="flex items-center gap-2 mb-1">
                <IconMapPin size={15} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{exam.fields.pruefungsort}</span>
              </div>
            )}
            {exam.pruefung_fahrlehrerName && (
              <div className="flex items-center gap-2 mb-1">
                <IconClipboardList size={15} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{exam.pruefung_fahrlehrerName}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={`text-xs border ${getStatusBadgeClass(statusKey)}`}>
              {STATUS_LABELS[statusKey ?? ''] ?? statusKey ?? '—'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(exam)}
              title="Bearbeiten"
            >
              <IconPencil size={14} />
            </Button>
          </div>
        </div>

        {exam.fields.pruefung_ergebnis && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-3 line-clamp-2">
            {exam.fields.pruefung_ergebnis}
          </p>
        )}

        {isAngemeldet && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(exam, 'bestanden')}
            >
              <IconCheck size={15} className="mr-1.5" />
              Bestanden
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(exam, 'nicht_bestanden')}
            >
              <IconX size={15} className="mr-1.5" />
              Nicht bestanden
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PruefungVorbereitenPage() {
  const { pruefungstermine, schueler, fahrlehrer, schuelerMap, fahrlehrerMap, loading, error, fetchAll } = useDashboardData();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedPruefungstermine | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const enriched = useMemo(
    () => enrichPruefungstermine(pruefungstermine, { schuelerMap, fahrlehrerMap }),
    [pruefungstermine, schuelerMap, fahrlehrerMap]
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'alle') return enriched;
    return enriched.filter(e => e.fields.pruefung_status?.key === statusFilter);
  }, [enriched, statusFilter]);

  const theorieExams = useMemo(
    () => sortExams(filtered.filter(e => e.fields.pruefungsart?.key === 'theorie')),
    [filtered]
  );

  const praxisExams = useMemo(
    () => sortExams(filtered.filter(e => e.fields.pruefungsart?.key === 'praxis')),
    [filtered]
  );

  const counts = useMemo(() => ({
    alle: enriched.length,
    angemeldet: enriched.filter(e => e.fields.pruefung_status?.key === 'angemeldet').length,
    bestanden: enriched.filter(e => e.fields.pruefung_status?.key === 'bestanden').length,
    nicht_bestanden: enriched.filter(e => e.fields.pruefung_status?.key === 'nicht_bestanden').length,
    abgesagt: enriched.filter(e => e.fields.pruefung_status?.key === 'abgesagt').length,
  }), [enriched]);

  if (loading) {
    return (
      <PageShell title="Prüfungsverwaltung" subtitle="Prüfungstermine planen und Ergebnisse erfassen">
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Daten werden geladen...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Prüfungsverwaltung" subtitle="Prüfungstermine planen und Ergebnisse erfassen">
        <div className="flex items-center justify-center h-48 text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      </PageShell>
    );
  }

  async function handleUpdateStatus(exam: EnrichedPruefungstermine, status: 'bestanden' | 'nicht_bestanden') {
    setUpdating(exam.record_id);
    try {
      const statusLabel = status === 'bestanden' ? 'Bestanden' : 'Nicht bestanden';
      await LivingAppsService.updatePruefungstermineEntry(exam.record_id, {
        pruefung_status: { key: status, label: statusLabel },
      });
      fetchAll();
    } finally {
      setUpdating(null);
    }
  }

  function handleEdit(exam: EnrichedPruefungstermine) {
    setEditRecord(exam);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'alle', label: `Alle (${counts.alle})` },
    { key: 'angemeldet', label: `Angemeldet (${counts.angemeldet})` },
    { key: 'bestanden', label: `Bestanden (${counts.bestanden})` },
    { key: 'nicht_bestanden', label: `Nicht bestanden (${counts.nicht_bestanden})` },
    { key: 'abgesagt', label: `Abgesagt (${counts.abgesagt})` },
  ];

  return (
    <PageShell title="Prüfungsverwaltung" subtitle="Prüfungstermine planen und Ergebnisse erfassen">
      <div className="space-y-6">
        {/* Top bar: filters + create button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2 flex-1 min-w-0">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  statusFilter === tab.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button onClick={handleCreate} className="shrink-0">
            <IconPlus size={16} className="mr-1.5" />
            Neue Prüfung
          </Button>
        </div>

        {/* Two-column board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theorie column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <h2 className="font-semibold text-base">Theorieprüfung</h2>
              <span className="text-sm text-muted-foreground">({theorieExams.length})</span>
            </div>
            {theorieExams.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm bg-muted/30 rounded-lg border border-dashed">
                Keine Theorieprüfungen
              </div>
            ) : (
              theorieExams.map(exam => (
                <ExamCard
                  key={exam.record_id}
                  exam={exam}
                  onEdit={handleEdit}
                  onUpdateStatus={handleUpdateStatus}
                  updating={updating}
                />
              ))
            )}
          </div>

          {/* Praxis column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b">
              <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <h2 className="font-semibold text-base">Praktische Prüfung</h2>
              <span className="text-sm text-muted-foreground">({praxisExams.length})</span>
            </div>
            {praxisExams.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm bg-muted/30 rounded-lg border border-dashed">
                Keine Praktischen Prüfungen
              </div>
            ) : (
              praxisExams.map(exam => (
                <ExamCard
                  key={exam.record_id}
                  exam={exam}
                  onEdit={handleEdit}
                  onUpdateStatus={handleUpdateStatus}
                  updating={updating}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <PruefungstermineDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updatePruefungstermineEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createPruefungstermineEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        schuelerList={schueler as Schueler[]}
        fahrlehrerList={fahrlehrer as Fahrlehrer[]}
      />
    </PageShell>
  );
}
