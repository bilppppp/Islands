import { useEffect, useState } from "react";

interface Props {
	mode: "simple" | "immersive";
	label: string;
	title: string;
	compact?: boolean;
}

export default function IslandModeTip({ mode, label, title, compact }: Props) {
	const [pressed, setPressed] = useState(false);

	useEffect(() => {
		const root = document.getElementById("teaching-mode-control");
		const read = () => {
			const stored = localStorage.getItem("teachingMode");
			const fallback = root?.getAttribute("data-default-mode") === "immersive" ? "immersive" : "simple";
			const current = stored === "immersive" || stored === "simple" ? stored : fallback;
			setPressed(current === mode);
		};
		const onVisual = (event: Event) => {
			const next = (event as CustomEvent<string>).detail;
			setPressed(next === mode);
		};
		read();
		root?.addEventListener("teaching-mode-visual", onVisual);
		return () => root?.removeEventListener("teaching-mode-visual", onVisual);
	}, [mode]);

	return (
		<button
			type="button"
			className={`teaching-mode-option w-full rounded-lg border text-left transition-colors ${
				compact ? "px-2.5 py-2" : "px-3 py-2.5"
			}${pressed ? " theme-active-nav border-transparent" : " border-gray-300 dark:border-stone-700 bg-white/40 hover:bg-white/70"}`}
			data-teaching-mode={mode}
			aria-pressed={pressed ? "true" : "false"}
		>
			<span className="block font-medium text-sm teaching-mode-label">{label}</span>
			<span className="block text-xs teaching-mode-desc mt-0.5 leading-snug">{title}</span>
		</button>
	);
}
