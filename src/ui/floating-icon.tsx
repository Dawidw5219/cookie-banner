interface FloatingIconProps {
	label: string;
	onClick: () => void;
}

export function FloatingIcon({ label, onClick }: FloatingIconProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			class="fixed bottom-4 left-4 z-2147483646 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-cb-primary text-white shadow-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-.34-.017-.676-.05-1.008A3.5 3.5 0 0 1 18.5 8a3.5 3.5 0 0 1-1.008-3.45A10.05 10.05 0 0 0 12 2Z"
					fill="currentColor"
					opacity="0.9"
				/>
				<circle cx="8" cy="10" r="1.5" fill="white" opacity="0.8" />
				<circle cx="12" cy="14" r="1.5" fill="white" opacity="0.8" />
				<circle cx="7" cy="15" r="1" fill="white" opacity="0.6" />
				<circle cx="15" cy="11" r="1" fill="white" opacity="0.6" />
			</svg>
		</button>
	);
}
