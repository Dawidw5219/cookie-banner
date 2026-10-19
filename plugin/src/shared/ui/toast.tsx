import { useState, useEffect } from "preact/hooks";

interface Toast {
	id: number;
	message: string;
	type: "success" | "error";
}

let addToast: (message: string, type: "success" | "error") => void;

export function toast(message: string, type: "success" | "error" = "success") {
	addToast?.(message, type);
}

export function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	addToast = (message, type) => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
	};

	return (
		<div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
			{toasts.map((t) => (
				<div
					key={t.id}
					class={`px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-[slideUp_0.2s_ease-out] ${
						t.type === "success"
							? "bg-gray-900 text-white"
							: "bg-red-600 text-white"
					}`}
				>
					{t.message}
				</div>
			))}
		</div>
	);
}
