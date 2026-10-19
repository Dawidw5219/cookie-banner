interface HeaderProps {
	title: string;
	description: string;
	icon: preact.JSX.Element;
}

export function Header({ title, description, icon }: HeaderProps) {
	return (
		<div class="text-center mb-10">
			<div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 shadow-lg mb-4">
				{icon}
			</div>
			<div class="flex items-center justify-center gap-1.5 mb-3">
				<span class="inline-flex gap-1.5 px-2.5 py-1.5 bg-gray-900/5 rounded-full">
					<span class="text-sm font-medium text-gray-700">Made in EU</span>
					<span class="text-xs font-medium text-gray-500">by App4You</span>
				</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
			<p class="text-base text-gray-500 mt-2 max-w-xl mx-auto">{description}</p>
		</div>
	);
}
