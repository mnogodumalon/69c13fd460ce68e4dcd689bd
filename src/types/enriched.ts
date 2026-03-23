import type { Fahrstunden, Pruefungstermine, SchnelleintragFahrstunde } from './app';

export type EnrichedPruefungstermine = Pruefungstermine & {
  pruefung_schuelerName: string;
  pruefung_fahrlehrerName: string;
};

export type EnrichedFahrstunden = Fahrstunden & {
  fahrstunde_schuelerName: string;
  fahrstunde_fahrlehrerName: string;
  fahrstunde_fahrzeugName: string;
};

export type EnrichedSchnelleintragFahrstunde = SchnelleintragFahrstunde & {
  schnell_schuelerName: string;
  schnell_fahrlehrerName: string;
  schnell_fahrzeugName: string;
};
