// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Schueler {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schueler_vorname?: string;
    schueler_nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    schueler_telefon?: string;
    schueler_email?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    fuehrerscheinklassen_schueler?: LookupValue[];
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    theorie_bestanden?: boolean;
    notizen_schueler?: string;
  };
}

export interface Fahrlehrer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
    fuehrerscheinklassen?: LookupValue[];
    status?: LookupValue;
    notizen_fahrlehrer?: string;
  };
}

export interface Fahrzeuge {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kennzeichen?: string;
    marke?: string;
    modell?: string;
    fahrzeugtyp?: LookupValue;
    fuehrerscheinklasse_fz?: LookupValue;
    baujahr?: number;
    tuev_datum?: string; // Format: YYYY-MM-DD oder ISO String
    notizen_fahrzeug?: string;
  };
}

export interface Pruefungstermine {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    pruefung_datum?: string; // Format: YYYY-MM-DD oder ISO String
    pruefung_schueler?: string; // applookup -> URL zu 'Schueler' Record
    pruefungsart?: LookupValue;
    pruefungsort?: string;
    pruefung_fahrlehrer?: string; // applookup -> URL zu 'Fahrlehrer' Record
    pruefung_status?: LookupValue;
    pruefung_ergebnis?: string;
  };
}

export interface Fahrstunden {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    fahrstunde_datum?: string; // Format: YYYY-MM-DD oder ISO String
    dauer_minuten?: number;
    fahrstunde_schueler?: string; // applookup -> URL zu 'Schueler' Record
    fahrstunde_fahrlehrer?: string; // applookup -> URL zu 'Fahrlehrer' Record
    fahrstunde_fahrzeug?: string; // applookup -> URL zu 'Fahrzeuge' Record
    stunden_typ?: LookupValue;
    fahrstunde_status?: LookupValue;
    notizen_fahrstunde?: string;
  };
}

export interface SchnelleintragFahrstunde {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schnell_datum?: string; // Format: YYYY-MM-DD oder ISO String
    schnell_schueler?: string; // applookup -> URL zu 'Schueler' Record
    schnell_fahrlehrer?: string; // applookup -> URL zu 'Fahrlehrer' Record
    schnell_fahrzeug?: string; // applookup -> URL zu 'Fahrzeuge' Record
    schnell_typ?: LookupValue;
    schnell_dauer?: number;
    schnell_notizen?: string;
  };
}

export const APP_IDS = {
  SCHUELER: '69c13fa6471b56292ff5fcbf',
  FAHRLEHRER: '69c13f9ad97a5dc2efe619b2',
  FAHRZEUGE: '69c13fa5b322ab358c02384a',
  PRUEFUNGSTERMINE: '69c13fa77105c5970a36e8be',
  FAHRSTUNDEN: '69c13fa6c91327998a2d5fb7',
  SCHNELLEINTRAG_FAHRSTUNDE: '69c13fa779ab3ad7b2408512',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  schueler: {
    fuehrerscheinklassen_schueler: [{ key: "klasse_b", label: "B (PKW)" }, { key: "klasse_be", label: "BE (PKW mit Anhänger)" }, { key: "klasse_a", label: "A (Motorrad)" }, { key: "klasse_a1", label: "A1 (Leichtkraftrad)" }, { key: "klasse_a2", label: "A2 (Mittelklasse Motorrad)" }, { key: "klasse_c", label: "C (LKW)" }, { key: "klasse_ce", label: "CE (LKW mit Anhänger)" }, { key: "klasse_d", label: "D (Bus)" }, { key: "klasse_l", label: "L (Landwirtschaft)" }, { key: "klasse_t", label: "T (Traktor)" }],
  },
  fahrlehrer: {
    fuehrerscheinklassen: [{ key: "klasse_b", label: "B (PKW)" }, { key: "klasse_be", label: "BE (PKW mit Anhänger)" }, { key: "klasse_a", label: "A (Motorrad)" }, { key: "klasse_a1", label: "A1 (Leichtkraftrad)" }, { key: "klasse_a2", label: "A2 (Mittelklasse Motorrad)" }, { key: "klasse_c", label: "C (LKW)" }, { key: "klasse_ce", label: "CE (LKW mit Anhänger)" }, { key: "klasse_d", label: "D (Bus)" }, { key: "klasse_l", label: "L (Landwirtschaft)" }, { key: "klasse_t", label: "T (Traktor)" }],
    status: [{ key: "aktiv", label: "Aktiv" }, { key: "inaktiv", label: "Inaktiv" }],
  },
  fahrzeuge: {
    fahrzeugtyp: [{ key: "pkw", label: "PKW" }, { key: "motorrad", label: "Motorrad" }, { key: "lkw", label: "LKW" }, { key: "bus", label: "Bus" }, { key: "traktor", label: "Traktor" }, { key: "sonstiges", label: "Sonstiges" }],
    fuehrerscheinklasse_fz: [{ key: "klasse_b", label: "B (PKW)" }, { key: "klasse_be", label: "BE (PKW mit Anhänger)" }, { key: "klasse_a", label: "A (Motorrad)" }, { key: "klasse_a1", label: "A1 (Leichtkraftrad)" }, { key: "klasse_a2", label: "A2 (Mittelklasse Motorrad)" }, { key: "klasse_c", label: "C (LKW)" }, { key: "klasse_ce", label: "CE (LKW mit Anhänger)" }, { key: "klasse_d", label: "D (Bus)" }, { key: "klasse_l", label: "L (Landwirtschaft)" }, { key: "klasse_t", label: "T (Traktor)" }],
  },
  pruefungstermine: {
    pruefungsart: [{ key: "theorie", label: "Theorieprüfung" }, { key: "praxis", label: "Praktische Prüfung" }],
    pruefung_status: [{ key: "angemeldet", label: "Angemeldet" }, { key: "bestanden", label: "Bestanden" }, { key: "nicht_bestanden", label: "Nicht bestanden" }, { key: "abgesagt", label: "Abgesagt" }],
  },
  fahrstunden: {
    stunden_typ: [{ key: "normal", label: "Normalfahrt" }, { key: "ueberlandfahrt", label: "Überlandfahrt" }, { key: "autobahnfahrt", label: "Autobahnfahrt" }, { key: "nachtfahrt", label: "Nachtfahrt" }, { key: "einweisung", label: "Einweisung" }, { key: "pruefungsvorbereitung", label: "Prüfungsvorbereitung" }, { key: "sonstiges", label: "Sonstiges" }],
    fahrstunde_status: [{ key: "geplant", label: "Geplant" }, { key: "durchgefuehrt", label: "Durchgeführt" }, { key: "abgesagt", label: "Abgesagt" }, { key: "verschoben", label: "Verschoben" }],
  },
  schnelleintrag_fahrstunde: {
    schnell_typ: [{ key: "normal", label: "Normalfahrt" }, { key: "ueberlandfahrt", label: "Überlandfahrt" }, { key: "autobahnfahrt", label: "Autobahnfahrt" }, { key: "nachtfahrt", label: "Nachtfahrt" }, { key: "einweisung", label: "Einweisung" }, { key: "pruefungsvorbereitung", label: "Prüfungsvorbereitung" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'schueler': {
    'schueler_vorname': 'string/text',
    'schueler_nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'schueler_telefon': 'string/tel',
    'schueler_email': 'string/email',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'fuehrerscheinklassen_schueler': 'multiplelookup/checkbox',
    'anmeldedatum': 'date/date',
    'theorie_bestanden': 'bool',
    'notizen_schueler': 'string/textarea',
  },
  'fahrlehrer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'fuehrerscheinklassen': 'multiplelookup/checkbox',
    'status': 'lookup/radio',
    'notizen_fahrlehrer': 'string/textarea',
  },
  'fahrzeuge': {
    'kennzeichen': 'string/text',
    'marke': 'string/text',
    'modell': 'string/text',
    'fahrzeugtyp': 'lookup/select',
    'fuehrerscheinklasse_fz': 'lookup/select',
    'baujahr': 'number',
    'tuev_datum': 'date/date',
    'notizen_fahrzeug': 'string/textarea',
  },
  'pruefungstermine': {
    'pruefung_datum': 'date/datetimeminute',
    'pruefung_schueler': 'applookup/select',
    'pruefungsart': 'lookup/radio',
    'pruefungsort': 'string/text',
    'pruefung_fahrlehrer': 'applookup/select',
    'pruefung_status': 'lookup/select',
    'pruefung_ergebnis': 'string/textarea',
  },
  'fahrstunden': {
    'fahrstunde_datum': 'date/datetimeminute',
    'dauer_minuten': 'number',
    'fahrstunde_schueler': 'applookup/select',
    'fahrstunde_fahrlehrer': 'applookup/select',
    'fahrstunde_fahrzeug': 'applookup/select',
    'stunden_typ': 'lookup/select',
    'fahrstunde_status': 'lookup/select',
    'notizen_fahrstunde': 'string/textarea',
  },
  'schnelleintrag_fahrstunde': {
    'schnell_datum': 'date/datetimeminute',
    'schnell_schueler': 'applookup/select',
    'schnell_fahrlehrer': 'applookup/select',
    'schnell_fahrzeug': 'applookup/select',
    'schnell_typ': 'lookup/select',
    'schnell_dauer': 'number',
    'schnell_notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSchueler = StripLookup<Schueler['fields']>;
export type CreateFahrlehrer = StripLookup<Fahrlehrer['fields']>;
export type CreateFahrzeuge = StripLookup<Fahrzeuge['fields']>;
export type CreatePruefungstermine = StripLookup<Pruefungstermine['fields']>;
export type CreateFahrstunden = StripLookup<Fahrstunden['fields']>;
export type CreateSchnelleintragFahrstunde = StripLookup<SchnelleintragFahrstunde['fields']>;