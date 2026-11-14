// Versioned saves in localStorage (contracts/save-format.md). Nothing ever leaves the device.
//   mm.profile.v1 → Profile (settings, records, collection, tutorial flag)
//   mm.run.v1     → { version, run } including the live match and its rng state (FR-022)

export const PROFILE_KEY = 'mm.profile.v1';
export const RUN_KEY = 'mm.run.v1';
const LEGACY_SETTINGS_KEY = 'mm.settings.v1';
const LEGACY_RECORDS_KEY = 'mm.records.v1';

export const RUN_VERSION = 1;
export const PROFILE_VERSION = 1;

/** migrate[v](data) turns version v into v + 1. Add an entry here whenever a format changes. */
export const RUN_MIGRATIONS = {};
export const PROFILE_MIGRATIONS = {};

export function defaultProfile() {
  return {
    version: PROFILE_VERSION,
    records: { bestRunWins: 0, runsCompleted: 0, runsWon: 0, matchesPlayed: 0 },
    collectionSeen: [],
    settings: { locale: null, animSpeed: 1, sound: true, hints: true },
    tutorialDone: false,
  };
}

/** Runs the migration chain up to `target`. Throws if a step is missing or the data is from the future. */
export function migrate(data, migrations, target) {
  let d = data;
  if (!d || typeof d.version !== 'number') throw new Error('missing version');
  if (d.version > target) throw new Error(`save version ${d.version} is newer than ${target}`);
  while (d.version < target) {
    const step = migrations[d.version];
    if (!step) throw new Error(`no migration from version ${d.version}`);
    d = step(d);
  }
  return d;
}

/** In-memory Storage stand-in (tests, or when localStorage is unavailable). */
export function memoryStorage(limitBytes = Infinity) {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      const size = [...m.entries()].reduce((n, [key, val]) => n + (key === k ? 0 : val.length), 0) + String(v).length;
      if (size > limitBytes) {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      }
      m.set(k, String(v));
    },
    removeItem: (k) => m.delete(k),
  };
}

function defaultStorage() {
  try {
    const s = globalThis.localStorage;
    s.getItem(RUN_KEY);
    return s;
  } catch {
    return memoryStorage();
  }
}

/**
 * Creates a save store. Problems never throw to the caller:
 *  - a corrupt or unknown run save is discarded (store.problem = 'corrupt'), the profile is kept
 *  - a failed write (storage full) returns false (store.problem = 'full')
 */
export function createStore(storage = defaultStorage()) {
  const store = {
    problem: null,

    write(key, value) {
      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        store.problem = 'full';
        return false;
      }
    },

    saveRun(run) {
      return store.write(RUN_KEY, { version: RUN_VERSION, run });
    },

    loadRun() {
      let raw;
      try {
        raw = storage.getItem(RUN_KEY);
      } catch {
        return null;
      }
      if (!raw) return null;
      try {
        const data = migrate(JSON.parse(raw), RUN_MIGRATIONS, RUN_VERSION);
        if (!data.run || typeof data.run.status !== 'string') throw new Error('no run');
        return data.run;
      } catch {
        store.problem = 'corrupt';
        store.clearRun();
        return null;
      }
    },

    clearRun() {
      try {
        storage.removeItem(RUN_KEY);
      } catch {
        /* nothing to clear */
      }
    },

    saveProfile(profile) {
      return store.write(PROFILE_KEY, profile);
    },

    /** Loads the profile, folding in the pre-profile settings/records keys once. */
    loadProfile() {
      const base = defaultProfile();
      let profile = base;
      try {
        const raw = storage.getItem(PROFILE_KEY);
        if (raw) {
          const p = migrate(JSON.parse(raw), PROFILE_MIGRATIONS, PROFILE_VERSION);
          profile = {
            ...base,
            ...p,
            records: { ...base.records, ...p.records },
            settings: { ...base.settings, ...p.settings },
          };
        } else {
          const legacySettings = JSON.parse(storage.getItem(LEGACY_SETTINGS_KEY) || '{}');
          const legacyRecords = JSON.parse(storage.getItem(LEGACY_RECORDS_KEY) || '{}');
          profile = {
            ...base,
            settings: { ...base.settings, ...legacySettings },
            records: { ...base.records, ...legacyRecords },
          };
        }
      } catch {
        profile = base;
      }
      return profile;
    },
  };
  return store;
}
