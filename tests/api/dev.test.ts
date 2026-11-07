// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { scanCookies, startCookieScan } from "../../src/api/dev";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = "session=; Max-Age=0; Path=/";
});

it("reports names and origins without exposing stored values or URL secrets", () => {
  document.cookie = "session=secret-cookie; Path=/";
  localStorage.setItem("account", "secret-account");
  sessionStorage.setItem("token", "secret-token");
  vi.spyOn(performance, "getEntriesByType").mockReturnValue([
    {
      name: "https://user:password@cdn.example.test/tracker?token=secret#private",
    },
    { name: "https://cdn.example.test/another" },
    { name: "data:text/plain,secret" },
  ] as PerformanceEntry[]);
  expect(scanCookies()).toEqual({
    cookies: ["session"],
    localStorage: ["account"],
    sessionStorage: ["token"],
    resourceOrigins: ["https://cdn.example.test"],
    unavailable: [],
  });
  expect(JSON.stringify(scanCookies())).not.toMatch(/secret|password|private/);
});

it("reports denied storage access explicitly", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Denied", "SecurityError");
  });
  expect(scanCookies().unavailable).toContain("localStorage");
});

it("emits changes including deletions, then stops polling on cleanup", () => {
  vi.useFakeTimers();
  const receive = vi.fn();
  const stop = startCookieScan(receive, 100);
  expect(receive).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(100);
  expect(receive).toHaveBeenCalledTimes(1);
  localStorage.setItem("new-key", "private-value");
  vi.advanceTimersByTime(100);
  expect(receive.mock.lastCall?.[0].localStorage).toEqual(["new-key"]);
  localStorage.removeItem("new-key");
  vi.advanceTimersByTime(100);
  expect(receive.mock.lastCall?.[0].localStorage).toEqual([]);
  stop();
  localStorage.setItem("later", "value");
  vi.advanceTimersByTime(100);
  expect(receive).toHaveBeenCalledTimes(3);
  expect(() => startCookieScan(receive, 0)).toThrow(RangeError);
});
