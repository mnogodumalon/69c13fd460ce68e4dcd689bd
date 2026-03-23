import type { EnrichedFahrstunden, EnrichedPruefungstermine, EnrichedSchnelleintragFahrstunde } from '@/types/enriched';
import type { Fahrlehrer, Fahrstunden, Fahrzeuge, Pruefungstermine, SchnelleintragFahrstunde, Schueler } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface PruefungstermineMaps {
  schuelerMap: Map<string, Schueler>;
  fahrlehrerMap: Map<string, Fahrlehrer>;
}

export function enrichPruefungstermine(
  pruefungstermine: Pruefungstermine[],
  maps: PruefungstermineMaps
): EnrichedPruefungstermine[] {
  return pruefungstermine.map(r => ({
    ...r,
    pruefung_schuelerName: resolveDisplay(r.fields.pruefung_schueler, maps.schuelerMap, 'schueler_vorname'),
    pruefung_fahrlehrerName: resolveDisplay(r.fields.pruefung_fahrlehrer, maps.fahrlehrerMap, 'vorname', 'nachname'),
  }));
}

interface FahrstundenMaps {
  schuelerMap: Map<string, Schueler>;
  fahrlehrerMap: Map<string, Fahrlehrer>;
  fahrzeugeMap: Map<string, Fahrzeuge>;
}

export function enrichFahrstunden(
  fahrstunden: Fahrstunden[],
  maps: FahrstundenMaps
): EnrichedFahrstunden[] {
  return fahrstunden.map(r => ({
    ...r,
    fahrstunde_schuelerName: resolveDisplay(r.fields.fahrstunde_schueler, maps.schuelerMap, 'schueler_vorname'),
    fahrstunde_fahrlehrerName: resolveDisplay(r.fields.fahrstunde_fahrlehrer, maps.fahrlehrerMap, 'vorname', 'nachname'),
    fahrstunde_fahrzeugName: resolveDisplay(r.fields.fahrstunde_fahrzeug, maps.fahrzeugeMap, 'kennzeichen'),
  }));
}

interface SchnelleintragFahrstundeMaps {
  schuelerMap: Map<string, Schueler>;
  fahrlehrerMap: Map<string, Fahrlehrer>;
  fahrzeugeMap: Map<string, Fahrzeuge>;
}

export function enrichSchnelleintragFahrstunde(
  schnelleintragFahrstunde: SchnelleintragFahrstunde[],
  maps: SchnelleintragFahrstundeMaps
): EnrichedSchnelleintragFahrstunde[] {
  return schnelleintragFahrstunde.map(r => ({
    ...r,
    schnell_schuelerName: resolveDisplay(r.fields.schnell_schueler, maps.schuelerMap, 'schueler_vorname'),
    schnell_fahrlehrerName: resolveDisplay(r.fields.schnell_fahrlehrer, maps.fahrlehrerMap, 'vorname', 'nachname'),
    schnell_fahrzeugName: resolveDisplay(r.fields.schnell_fahrzeug, maps.fahrzeugeMap, 'kennzeichen'),
  }));
}
