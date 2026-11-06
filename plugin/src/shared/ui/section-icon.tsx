import type { AdminSection } from "@/app";

const paths: Record<AdminSection, string> = {
	overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
	appearance: "M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.4 1.4 0 0 1 1-2.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3ZM7.5 10h.01M10 6.5h.01M15 7h.01M17.5 11h.01",
	services: "M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4",
	cookies: "M20.5 12.5A8.5 8.5 0 1 1 11.5 3a4 4 0 0 0 4.5 4.5 4 4 0 0 0 4.5 5ZM7 10h.01M10 16h.01M14 12h.01",
	integration: "m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16",
	diagnostics: "M9 12l2 2 4-4M12 3l8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6l8-3Z",
};

export function SectionIcon({ section }: { section: AdminSection }) {
	return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[section]} /></svg>;
}
