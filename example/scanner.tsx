import { useEffect, useState } from "preact/hooks";
import type { CookieScan } from "../src/api/dev";

export function Scanner() {
  const [scan, setScan] = useState<CookieScan>();
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [sample, setSample] = useState(() => {
    try {
      return sessionStorage.getItem("cb_demo_storage") === "example";
    } catch {
      return false;
    }
  });
  const toggleSample = () => {
    try {
      document.cookie = `cb_demo_cookie=${sample ? "" : "example"}; Path=${import.meta.env.BASE_URL}; SameSite=Lax${sample ? "; Max-Age=0" : ""}`;
      if (sample) sessionStorage.removeItem("cb_demo_storage");
      else sessionStorage.setItem("cb_demo_storage", "example");
      setSample(!sample);
      setError("");
    } catch {
      setError("Your browser has disabled test storage.");
    }
  };
  useEffect(() => {
    if (!active) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import("../src/api/dev")
      .then(({ startCookieScan }) => {
        if (!cancelled) stop = startCookieScan(setScan);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not start the scanner. Please try again.");
          setActive(false);
        }
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [active]);
  return (
    <section className="diagnostics" aria-labelledby="diagnostics-title">
      <div>
        <h2 id="diagnostics-title">See what this page stores.</h2>
        <p>
          Inspect accessible cookie names, storage keys and resource origins.
          Values stay private. Nothing is uploaded. “Add test data” creates a
          sample cookie and sessionStorage key with the constant value
          “example”.
        </p>
      </div>
      <div className="scanner-actions">
        <button
          onClick={() => {
            setError("");
            setActive(!active);
          }}
        >
          {active ? "Stop scanner" : "Start local scanner"}
        </button>
        <button onClick={toggleSample}>
          {sample ? "Remove test data" : "Add test data"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {scan && (
        <pre aria-label="Cookie scan report">
          {JSON.stringify(scan, null, 2)}
        </pre>
      )}
      <small>
        Current page only. HttpOnly cookies and storage inside third-party
        frames are outside this scanner’s view. Resource origins include earlier
        requests in this document.
      </small>
    </section>
  );
}

