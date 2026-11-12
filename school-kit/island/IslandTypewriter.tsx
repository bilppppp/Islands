import { useEffect, useState } from "react";
import { Typewriter } from "animal-island-ui";

interface Props {
	text: string;
}

function checkReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function IslandTypewriter({ text }: Props) {
	const [reducedMotion, setReducedMotion] = useState(checkReducedMotion);

	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReducedMotion(mql.matches);
		const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	if (reducedMotion) {
		return <p className="island-typewriter">{text}</p>;
	}

	return (
		<Typewriter autoPlay speed={36}>
			<p className="island-typewriter">{text}</p>
		</Typewriter>
	);
}
