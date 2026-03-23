import type { Fahrzeuge } from '@/types/app';
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

interface FahrzeugeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Fahrzeuge | null;
  onEdit: (record: Fahrzeuge) => void;
}

export function FahrzeugeViewDialog({ open, onClose, record, onEdit }: FahrzeugeViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fahrzeuge anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kennzeichen</Label>
            <p className="text-sm">{record.fields.kennzeichen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Marke</Label>
            <p className="text-sm">{record.fields.marke ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Modell</Label>
            <p className="text-sm">{record.fields.modell ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fahrzeugtyp</Label>
            <Badge variant="secondary">{record.fields.fahrzeugtyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Führerscheinklasse</Label>
            <Badge variant="secondary">{record.fields.fuehrerscheinklasse_fz?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Baujahr</Label>
            <p className="text-sm">{record.fields.baujahr ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">TÜV fällig am</Label>
            <p className="text-sm">{formatDate(record.fields.tuev_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_fahrzeug ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}