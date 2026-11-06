import { wp } from "@/shared/types/wp";

export async function api<T = unknown>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const res = await fetch(`${wp.restUrl}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			"X-WP-Nonce": wp.nonce,
			...options.headers,
		},
	});

	if (!res.ok) {
		const error = await res.json().catch(() => null);
		throw new Error(
			typeof error?.message === "string"
				? error.message
				: `API ${res.status}: ${res.statusText}`,
		);
	}

	return res.json();
}
