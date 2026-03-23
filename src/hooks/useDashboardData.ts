import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Schueler, Fahrlehrer, Fahrzeuge, Pruefungstermine, Fahrstunden, SchnelleintragFahrstunde } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [schueler, setSchueler] = useState<Schueler[]>([]);
  const [fahrlehrer, setFahrlehrer] = useState<Fahrlehrer[]>([]);
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeuge[]>([]);
  const [pruefungstermine, setPruefungstermine] = useState<Pruefungstermine[]>([]);
  const [fahrstunden, setFahrstunden] = useState<Fahrstunden[]>([]);
  const [schnelleintragFahrstunde, setSchnelleintragFahrstunde] = useState<SchnelleintragFahrstunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [schuelerData, fahrlehrerData, fahrzeugeData, pruefungstermineData, fahrstundenData, schnelleintragFahrstundeData] = await Promise.all([
        LivingAppsService.getSchueler(),
        LivingAppsService.getFahrlehrer(),
        LivingAppsService.getFahrzeuge(),
        LivingAppsService.getPruefungstermine(),
        LivingAppsService.getFahrstunden(),
        LivingAppsService.getSchnelleintragFahrstunde(),
      ]);
      setSchueler(schuelerData);
      setFahrlehrer(fahrlehrerData);
      setFahrzeuge(fahrzeugeData);
      setPruefungstermine(pruefungstermineData);
      setFahrstunden(fahrstundenData);
      setSchnelleintragFahrstunde(schnelleintragFahrstundeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const schuelerMap = useMemo(() => {
    const m = new Map<string, Schueler>();
    schueler.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schueler]);

  const fahrlehrerMap = useMemo(() => {
    const m = new Map<string, Fahrlehrer>();
    fahrlehrer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [fahrlehrer]);

  const fahrzeugeMap = useMemo(() => {
    const m = new Map<string, Fahrzeuge>();
    fahrzeuge.forEach(r => m.set(r.record_id, r));
    return m;
  }, [fahrzeuge]);

  return { schueler, setSchueler, fahrlehrer, setFahrlehrer, fahrzeuge, setFahrzeuge, pruefungstermine, setPruefungstermine, fahrstunden, setFahrstunden, schnelleintragFahrstunde, setSchnelleintragFahrstunde, loading, error, fetchAll, schuelerMap, fahrlehrerMap, fahrzeugeMap };
}