export interface CookieScan {
  cookies: string[];
  localStorage: string[];
  sessionStorage: string[];
  /** Origins only: no credentials, paths, query strings or fragments. */
  resourceOrigins: string[];
  /** Inaccessible stores are reported rather than mistaken for empty ones. */
  unavailable: string[];
}

/** Current page only. Never returns cookie/storage values or sends a report. */
export function scanCookies(): CookieScan {
  const result: CookieScan = {
    cookies: [],
    localStorage: [],
    sessionStorage: [],
    resourceOrigins: [],
    unavailable: [],
  };
  if (typeof window === "undefined") return result;
  try {
    result.cookies = [
      ...new Set(
        document.cookie
          .split(";")
          .map((part) => part.split("=", 1)[0].trim())
          .filter(Boolean),
      ),
    ].sort();
  } catch {
    result.unavailable.push("cookies");
  }
  for (const store of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[store];
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (key !== null) result[store].push(key);
      }
      result[store].sort();
    } catch {
      result.unavailable.push(store);
    }
  }
  try {
    const origins = new Set<string>();
    for (const resource of performance.getEntriesByType("resource")) {
      try {
        const url = new URL(resource.name);
        if (["http:", "https:"].includes(url.protocol)) origins.add(url.origin);
      } catch {
        /* Non-URL resource names do not identify a network origin. */
      }
    }
    result.resourceOrigins = [...origins].sort();
  } catch {
    result.unavailable.push("resources");
  }
  return result;
}

/** Development-only polling. Stops on cleanup and emits only changed snapshots. */
export function startCookieScan(
  onChange: (scan: CookieScan) => void,
  intervalMs = 1000,
): () => void {
  if (typeof window === "undefined") return () => {};
  if (!Number.isFinite(intervalMs) || intervalMs < 100)
    throw new RangeError("Use a scan interval of at least 100 ms.");
  let previous = "";
  const update = () => {
    const scan = scanCookies();
    const serialized = JSON.stringify(scan);
    if (serialized === previous) return;
    previous = serialized;
    onChange(scan);
  };
  update();
  const timer = window.setInterval(update, intervalMs);
  return () => window.clearInterval(timer);
}
