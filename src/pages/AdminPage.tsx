import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Schueler, Fahrlehrer, Fahrzeuge, Pruefungstermine, Fahrstunden, SchnelleintragFahrstunde } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { SchuelerDialog } from '@/components/dialogs/SchuelerDialog';
import { SchuelerViewDialog } from '@/components/dialogs/SchuelerViewDialog';
import { FahrlehrerDialog } from '@/components/dialogs/FahrlehrerDialog';
import { FahrlehrerViewDialog } from '@/components/dialogs/FahrlehrerViewDialog';
import { FahrzeugeDialog } from '@/components/dialogs/FahrzeugeDialog';
import { FahrzeugeViewDialog } from '@/components/dialogs/FahrzeugeViewDialog';
import { PruefungstermineDialog } from '@/components/dialogs/PruefungstermineDialog';
import { PruefungstermineViewDialog } from '@/components/dialogs/PruefungstermineViewDialog';
import { FahrstundenDialog } from '@/components/dialogs/FahrstundenDialog';
import { FahrstundenViewDialog } from '@/components/dialogs/FahrstundenViewDialog';
import { SchnelleintragFahrstundeDialog } from '@/components/dialogs/SchnelleintragFahrstundeDialog';
import { SchnelleintragFahrstundeViewDialog } from '@/components/dialogs/SchnelleintragFahrstundeViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const SCHUELER_FIELDS = [
  { key: 'schueler_vorname', label: 'Vorname', type: 'string/text' },
  { key: 'schueler_nachname', label: 'Nachname', type: 'string/text' },
  { key: 'geburtsdatum', label: 'Geburtsdatum', type: 'date/date' },
  { key: 'schueler_telefon', label: 'Telefonnummer', type: 'string/tel' },
  { key: 'schueler_email', label: 'E-Mail-Adresse', type: 'string/email' },
  { key: 'strasse', label: 'Straße', type: 'string/text' },
  { key: 'hausnummer', label: 'Hausnummer', type: 'string/text' },
  { key: 'plz', label: 'Postleitzahl', type: 'string/text' },
  { key: 'ort', label: 'Ort', type: 'string/text' },
  { key: 'fuehrerscheinklassen_schueler', label: 'Angestrebte Führerscheinklassen', type: 'multiplelookup/checkbox', options: [{ key: 'klasse_b', label: 'B (PKW)' }, { key: 'klasse_be', label: 'BE (PKW mit Anhänger)' }, { key: 'klasse_a', label: 'A (Motorrad)' }, { key: 'klasse_a1', label: 'A1 (Leichtkraftrad)' }, { key: 'klasse_a2', label: 'A2 (Mittelklasse Motorrad)' }, { key: 'klasse_c', label: 'C (LKW)' }, { key: 'klasse_ce', label: 'CE (LKW mit Anhänger)' }, { key: 'klasse_d', label: 'D (Bus)' }, { key: 'klasse_l', label: 'L (Landwirtschaft)' }, { key: 'klasse_t', label: 'T (Traktor)' }] },
  { key: 'anmeldedatum', label: 'Anmeldedatum', type: 'date/date' },
  { key: 'theorie_bestanden', label: 'Theorieprüfung bestanden', type: 'bool' },
  { key: 'notizen_schueler', label: 'Notizen', type: 'string/textarea' },
];
const FAHRLEHRER_FIELDS = [
  { key: 'vorname', label: 'Vorname', type: 'string/text' },
  { key: 'nachname', label: 'Nachname', type: 'string/text' },
  { key: 'telefon', label: 'Telefonnummer', type: 'string/tel' },
  { key: 'email', label: 'E-Mail-Adresse', type: 'string/email' },
  { key: 'fuehrerscheinklassen', label: 'Lehrberechtigte Führerscheinklassen', type: 'multiplelookup/checkbox', options: [{ key: 'klasse_b', label: 'B (PKW)' }, { key: 'klasse_be', label: 'BE (PKW mit Anhänger)' }, { key: 'klasse_a', label: 'A (Motorrad)' }, { key: 'klasse_a1', label: 'A1 (Leichtkraftrad)' }, { key: 'klasse_a2', label: 'A2 (Mittelklasse Motorrad)' }, { key: 'klasse_c', label: 'C (LKW)' }, { key: 'klasse_ce', label: 'CE (LKW mit Anhänger)' }, { key: 'klasse_d', label: 'D (Bus)' }, { key: 'klasse_l', label: 'L (Landwirtschaft)' }, { key: 'klasse_t', label: 'T (Traktor)' }] },
  { key: 'status', label: 'Status', type: 'lookup/radio', options: [{ key: 'aktiv', label: 'Aktiv' }, { key: 'inaktiv', label: 'Inaktiv' }] },
  { key: 'notizen_fahrlehrer', label: 'Notizen', type: 'string/textarea' },
];
const FAHRZEUGE_FIELDS = [
  { key: 'kennzeichen', label: 'Kennzeichen', type: 'string/text' },
  { key: 'marke', label: 'Marke', type: 'string/text' },
  { key: 'modell', label: 'Modell', type: 'string/text' },
  { key: 'fahrzeugtyp', label: 'Fahrzeugtyp', type: 'lookup/select', options: [{ key: 'pkw', label: 'PKW' }, { key: 'motorrad', label: 'Motorrad' }, { key: 'lkw', label: 'LKW' }, { key: 'bus', label: 'Bus' }, { key: 'traktor', label: 'Traktor' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'fuehrerscheinklasse_fz', label: 'Führerscheinklasse', type: 'lookup/select', options: [{ key: 'klasse_b', label: 'B (PKW)' }, { key: 'klasse_be', label: 'BE (PKW mit Anhänger)' }, { key: 'klasse_a', label: 'A (Motorrad)' }, { key: 'klasse_a1', label: 'A1 (Leichtkraftrad)' }, { key: 'klasse_a2', label: 'A2 (Mittelklasse Motorrad)' }, { key: 'klasse_c', label: 'C (LKW)' }, { key: 'klasse_ce', label: 'CE (LKW mit Anhänger)' }, { key: 'klasse_d', label: 'D (Bus)' }, { key: 'klasse_l', label: 'L (Landwirtschaft)' }, { key: 'klasse_t', label: 'T (Traktor)' }] },
  { key: 'baujahr', label: 'Baujahr', type: 'number' },
  { key: 'tuev_datum', label: 'TÜV fällig am', type: 'date/date' },
  { key: 'notizen_fahrzeug', label: 'Notizen', type: 'string/textarea' },
];
const PRUEFUNGSTERMINE_FIELDS = [
  { key: 'pruefung_datum', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'pruefung_schueler', label: 'Schüler', type: 'applookup/select', targetEntity: 'schueler', targetAppId: 'SCHUELER', displayField: 'schueler_vorname' },
  { key: 'pruefungsart', label: 'Prüfungsart', type: 'lookup/radio', options: [{ key: 'theorie', label: 'Theorieprüfung' }, { key: 'praxis', label: 'Praktische Prüfung' }] },
  { key: 'pruefungsort', label: 'Prüfungsort', type: 'string/text' },
  { key: 'pruefung_fahrlehrer', label: 'Begleitender Fahrlehrer', type: 'applookup/select', targetEntity: 'fahrlehrer', targetAppId: 'FAHRLEHRER', displayField: 'vorname' },
  { key: 'pruefung_status', label: 'Status', type: 'lookup/select', options: [{ key: 'angemeldet', label: 'Angemeldet' }, { key: 'bestanden', label: 'Bestanden' }, { key: 'nicht_bestanden', label: 'Nicht bestanden' }, { key: 'abgesagt', label: 'Abgesagt' }] },
  { key: 'pruefung_ergebnis', label: 'Ergebnis / Notizen', type: 'string/textarea' },
];
const FAHRSTUNDEN_FIELDS = [
  { key: 'fahrstunde_datum', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'dauer_minuten', label: 'Dauer (Minuten)', type: 'number' },
  { key: 'fahrstunde_schueler', label: 'Schüler', type: 'applookup/select', targetEntity: 'schueler', targetAppId: 'SCHUELER', displayField: 'schueler_vorname' },
  { key: 'fahrstunde_fahrlehrer', label: 'Fahrlehrer', type: 'applookup/select', targetEntity: 'fahrlehrer', targetAppId: 'FAHRLEHRER', displayField: 'vorname' },
  { key: 'fahrstunde_fahrzeug', label: 'Fahrzeug', type: 'applookup/select', targetEntity: 'fahrzeuge', targetAppId: 'FAHRZEUGE', displayField: 'kennzeichen' },
  { key: 'stunden_typ', label: 'Stundentyp', type: 'lookup/select', options: [{ key: 'normal', label: 'Normalfahrt' }, { key: 'ueberlandfahrt', label: 'Überlandfahrt' }, { key: 'autobahnfahrt', label: 'Autobahnfahrt' }, { key: 'nachtfahrt', label: 'Nachtfahrt' }, { key: 'einweisung', label: 'Einweisung' }, { key: 'pruefungsvorbereitung', label: 'Prüfungsvorbereitung' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'fahrstunde_status', label: 'Status', type: 'lookup/select', options: [{ key: 'geplant', label: 'Geplant' }, { key: 'durchgefuehrt', label: 'Durchgeführt' }, { key: 'abgesagt', label: 'Abgesagt' }, { key: 'verschoben', label: 'Verschoben' }] },
  { key: 'notizen_fahrstunde', label: 'Notizen', type: 'string/textarea' },
];
const SCHNELLEINTRAGFAHRSTUNDE_FIELDS = [
  { key: 'schnell_datum', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'schnell_schueler', label: 'Schüler', type: 'applookup/select', targetEntity: 'schueler', targetAppId: 'SCHUELER', displayField: 'schueler_vorname' },
  { key: 'schnell_fahrlehrer', label: 'Fahrlehrer', type: 'applookup/select', targetEntity: 'fahrlehrer', targetAppId: 'FAHRLEHRER', displayField: 'vorname' },
  { key: 'schnell_fahrzeug', label: 'Fahrzeug', type: 'applookup/select', targetEntity: 'fahrzeuge', targetAppId: 'FAHRZEUGE', displayField: 'kennzeichen' },
  { key: 'schnell_typ', label: 'Stundentyp', type: 'lookup/select', options: [{ key: 'normal', label: 'Normalfahrt' }, { key: 'ueberlandfahrt', label: 'Überlandfahrt' }, { key: 'autobahnfahrt', label: 'Autobahnfahrt' }, { key: 'nachtfahrt', label: 'Nachtfahrt' }, { key: 'einweisung', label: 'Einweisung' }, { key: 'pruefungsvorbereitung', label: 'Prüfungsvorbereitung' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'schnell_dauer', label: 'Dauer (Minuten)', type: 'number' },
  { key: 'schnell_notizen', label: 'Notizen', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 'schueler', label: 'Schüler', pascal: 'Schueler' },
  { key: 'fahrlehrer', label: 'Fahrlehrer', pascal: 'Fahrlehrer' },
  { key: 'fahrzeuge', label: 'Fahrzeuge', pascal: 'Fahrzeuge' },
  { key: 'pruefungstermine', label: 'Prüfungstermine', pascal: 'Pruefungstermine' },
  { key: 'fahrstunden', label: 'Fahrstunden', pascal: 'Fahrstunden' },
  { key: 'schnelleintrag_fahrstunde', label: 'Schnelleintrag Fahrstunde', pascal: 'SchnelleintragFahrstunde' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('schueler');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    schueler: new Set(),
    fahrlehrer: new Set(),
    fahrzeuge: new Set(),
    pruefungstermine: new Set(),
    fahrstunden: new Set(),
    schnelleintrag_fahrstunde: new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    schueler: {},
    fahrlehrer: {},
    fahrzeuge: {},
    pruefungstermine: {},
    fahrstunden: {},
    schnelleintrag_fahrstunde: {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'schueler': return (data as any).schueler as Schueler[] ?? [];
      case 'fahrlehrer': return (data as any).fahrlehrer as Fahrlehrer[] ?? [];
      case 'fahrzeuge': return (data as any).fahrzeuge as Fahrzeuge[] ?? [];
      case 'pruefungstermine': return (data as any).pruefungstermine as Pruefungstermine[] ?? [];
      case 'fahrstunden': return (data as any).fahrstunden as Fahrstunden[] ?? [];
      case 'schnelleintrag_fahrstunde': return (data as any).schnelleintragFahrstunde as SchnelleintragFahrstunde[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 'pruefungstermine':
        lists.schuelerList = (data as any).schueler ?? [];
        lists.fahrlehrerList = (data as any).fahrlehrer ?? [];
        break;
      case 'fahrstunden':
        lists.schuelerList = (data as any).schueler ?? [];
        lists.fahrlehrerList = (data as any).fahrlehrer ?? [];
        lists.fahrzeugeList = (data as any).fahrzeuge ?? [];
        break;
      case 'schnelleintrag_fahrstunde':
        lists.schuelerList = (data as any).schueler ?? [];
        lists.fahrlehrerList = (data as any).fahrlehrer ?? [];
        lists.fahrzeugeList = (data as any).fahrzeuge ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 'pruefungstermine' && fieldKey === 'pruefung_schueler') {
      const match = (lists.schuelerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.schueler_vorname ?? '—';
    }
    if (entity === 'pruefungstermine' && fieldKey === 'pruefung_fahrlehrer') {
      const match = (lists.fahrlehrerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'fahrstunden' && fieldKey === 'fahrstunde_schueler') {
      const match = (lists.schuelerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.schueler_vorname ?? '—';
    }
    if (entity === 'fahrstunden' && fieldKey === 'fahrstunde_fahrlehrer') {
      const match = (lists.fahrlehrerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'fahrstunden' && fieldKey === 'fahrstunde_fahrzeug') {
      const match = (lists.fahrzeugeList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.kennzeichen ?? '—';
    }
    if (entity === 'schnelleintrag_fahrstunde' && fieldKey === 'schnell_schueler') {
      const match = (lists.schuelerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.schueler_vorname ?? '—';
    }
    if (entity === 'schnelleintrag_fahrstunde' && fieldKey === 'schnell_fahrlehrer') {
      const match = (lists.fahrlehrerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'schnelleintrag_fahrstunde' && fieldKey === 'schnell_fahrzeug') {
      const match = (lists.fahrzeugeList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.kennzeichen ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'schueler': return SCHUELER_FIELDS;
      case 'fahrlehrer': return FAHRLEHRER_FIELDS;
      case 'fahrzeuge': return FAHRZEUGE_FIELDS;
      case 'pruefungstermine': return PRUEFUNGSTERMINE_FIELDS;
      case 'fahrstunden': return FAHRSTUNDEN_FIELDS;
      case 'schnelleintrag_fahrstunde': return SCHNELLEINTRAGFAHRSTUNDE_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'schueler': return {
        create: (fields: any) => LivingAppsService.createSchuelerEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateSchuelerEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteSchuelerEntry(id),
      };
      case 'fahrlehrer': return {
        create: (fields: any) => LivingAppsService.createFahrlehrerEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFahrlehrerEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFahrlehrerEntry(id),
      };
      case 'fahrzeuge': return {
        create: (fields: any) => LivingAppsService.createFahrzeugeEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFahrzeugeEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFahrzeugeEntry(id),
      };
      case 'pruefungstermine': return {
        create: (fields: any) => LivingAppsService.createPruefungstermineEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updatePruefungstermineEntry(id, fields),
        remove: (id: string) => LivingAppsService.deletePruefungstermineEntry(id),
      };
      case 'fahrstunden': return {
        create: (fields: any) => LivingAppsService.createFahrstundenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFahrstundenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFahrstundenEntry(id),
      };
      case 'schnelleintrag_fahrstunde': return {
        create: (fields: any) => LivingAppsService.createSchnelleintragFahrstundeEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateSchnelleintragFahrstundeEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteSchnelleintragFahrstundeEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'schueler' || dialogState?.entity === 'schueler') && (
        <SchuelerDialog
          open={createEntity === 'schueler' || dialogState?.entity === 'schueler'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'schueler' ? handleUpdate : (fields: any) => handleCreate('schueler', fields)}
          defaultValues={dialogState?.entity === 'schueler' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Schueler']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Schueler']}
        />
      )}
      {(createEntity === 'fahrlehrer' || dialogState?.entity === 'fahrlehrer') && (
        <FahrlehrerDialog
          open={createEntity === 'fahrlehrer' || dialogState?.entity === 'fahrlehrer'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fahrlehrer' ? handleUpdate : (fields: any) => handleCreate('fahrlehrer', fields)}
          defaultValues={dialogState?.entity === 'fahrlehrer' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Fahrlehrer']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fahrlehrer']}
        />
      )}
      {(createEntity === 'fahrzeuge' || dialogState?.entity === 'fahrzeuge') && (
        <FahrzeugeDialog
          open={createEntity === 'fahrzeuge' || dialogState?.entity === 'fahrzeuge'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fahrzeuge' ? handleUpdate : (fields: any) => handleCreate('fahrzeuge', fields)}
          defaultValues={dialogState?.entity === 'fahrzeuge' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Fahrzeuge']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fahrzeuge']}
        />
      )}
      {(createEntity === 'pruefungstermine' || dialogState?.entity === 'pruefungstermine') && (
        <PruefungstermineDialog
          open={createEntity === 'pruefungstermine' || dialogState?.entity === 'pruefungstermine'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'pruefungstermine' ? handleUpdate : (fields: any) => handleCreate('pruefungstermine', fields)}
          defaultValues={dialogState?.entity === 'pruefungstermine' ? dialogState.record?.fields : undefined}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Pruefungstermine']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Pruefungstermine']}
        />
      )}
      {(createEntity === 'fahrstunden' || dialogState?.entity === 'fahrstunden') && (
        <FahrstundenDialog
          open={createEntity === 'fahrstunden' || dialogState?.entity === 'fahrstunden'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fahrstunden' ? handleUpdate : (fields: any) => handleCreate('fahrstunden', fields)}
          defaultValues={dialogState?.entity === 'fahrstunden' ? dialogState.record?.fields : undefined}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
          fahrzeugeList={(data as any).fahrzeuge ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Fahrstunden']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fahrstunden']}
        />
      )}
      {(createEntity === 'schnelleintrag_fahrstunde' || dialogState?.entity === 'schnelleintrag_fahrstunde') && (
        <SchnelleintragFahrstundeDialog
          open={createEntity === 'schnelleintrag_fahrstunde' || dialogState?.entity === 'schnelleintrag_fahrstunde'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'schnelleintrag_fahrstunde' ? handleUpdate : (fields: any) => handleCreate('schnelleintrag_fahrstunde', fields)}
          defaultValues={dialogState?.entity === 'schnelleintrag_fahrstunde' ? dialogState.record?.fields : undefined}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
          fahrzeugeList={(data as any).fahrzeuge ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['SchnelleintragFahrstunde']}
          enablePhotoLocation={AI_PHOTO_LOCATION['SchnelleintragFahrstunde']}
        />
      )}
      {viewState?.entity === 'schueler' && (
        <SchuelerViewDialog
          open={viewState?.entity === 'schueler'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'schueler', record: r }); }}
        />
      )}
      {viewState?.entity === 'fahrlehrer' && (
        <FahrlehrerViewDialog
          open={viewState?.entity === 'fahrlehrer'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fahrlehrer', record: r }); }}
        />
      )}
      {viewState?.entity === 'fahrzeuge' && (
        <FahrzeugeViewDialog
          open={viewState?.entity === 'fahrzeuge'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fahrzeuge', record: r }); }}
        />
      )}
      {viewState?.entity === 'pruefungstermine' && (
        <PruefungstermineViewDialog
          open={viewState?.entity === 'pruefungstermine'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'pruefungstermine', record: r }); }}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
        />
      )}
      {viewState?.entity === 'fahrstunden' && (
        <FahrstundenViewDialog
          open={viewState?.entity === 'fahrstunden'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fahrstunden', record: r }); }}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
          fahrzeugeList={(data as any).fahrzeuge ?? []}
        />
      )}
      {viewState?.entity === 'schnelleintrag_fahrstunde' && (
        <SchnelleintragFahrstundeViewDialog
          open={viewState?.entity === 'schnelleintrag_fahrstunde'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'schnelleintrag_fahrstunde', record: r }); }}
          schuelerList={(data as any).schueler ?? []}
          fahrlehrerList={(data as any).fahrlehrer ?? []}
          fahrzeugeList={(data as any).fahrzeuge ?? []}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}