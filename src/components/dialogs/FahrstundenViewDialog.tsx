import type { Fahrstunden, Schueler, Fahrlehrer, Fahrzeuge } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface FahrstundenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Fahrstunden | null;
  onEdit: (record: Fahrstunden) => void;
  schuelerList: Schueler[];
  fahrlehrerList: Fahrlehrer[];
  fahrzeugeList: Fahrzeuge[];
}

export function FahrstundenViewDialog({ open, onClose, record, onEdit, schuelerList, fahrlehrerList, fahrzeugeList }: FahrstundenViewDialogProps) {
  function getSchuelerDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schuelerList.find(r => r.record_id === id)?.fields.schueler_vorname ?? '—';
  }

  function getFahrlehrerDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return fahrlehrerList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getFahrzeugeDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return fahrzeugeList.find(r => r.record_id === id)?.fields.kennzeichen ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fahrstunden anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum und Uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.fahrstunde_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dauer (Minuten)</Label>
            <p className="text-sm">{record.fields.dauer_minuten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schüler</Label>
            <p className="text-sm">{getSchuelerDisplayName(record.fields.fahrstunde_schueler)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fahrlehrer</Label>
            <p className="text-sm">{getFahrlehrerDisplayName(record.fields.fahrstunde_fahrlehrer)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fahrzeug</Label>
            <p className="text-sm">{getFahrzeugeDisplayName(record.fields.fahrstunde_fahrzeug)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Stundentyp</Label>
            <Badge variant="secondary">{record.fields.stunden_typ?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.fahrstunde_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_fahrstunde ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}