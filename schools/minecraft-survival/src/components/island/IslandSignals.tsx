import { useEffect, useState } from "react";
import { Modal } from "animal-island-ui";
import { showAskTeacherNotice } from "./IslandAskTeacher";

type Notice = { kind?: "success" | "info" | "warning" | "error"; message: string; description?: string };

function t(key: string, values?: Record<string, string | number>): string {
	if (typeof window !== "undefined" && (window as any).schoolUI?.t) {
		return (window as any).schoolUI.t(key, values);
	}
	return key;
}

export default function IslandSignals() {
	const [exitOpen, setExitOpen] = useState(false);

	useEffect(() => {
		const onNotice = (event: Event) => {
			const detail = (event as CustomEvent<Notice>).detail;
			if (!detail?.message) return;
			const kind = detail.kind ?? "info";
			showAskTeacherNotice({ type: kind, message: detail.message, description: detail.description });
		};
		const onExit = (event: MouseEvent) => {
			const link = (event.target as Element | null)?.closest?.("#sidebar-disenroll-link");
			if (!link) return;
			event.preventDefault();
			setExitOpen(true);
		};
		window.addEventListener("school:island-notice", onNotice);
		document.addEventListener("click", onExit);
		return () => {
			window.removeEventListener("school:island-notice", onNotice);
			document.removeEventListener("click", onExit);
		};
	}, []);

	return (
		<Modal open={exitOpen} title={t("exitModalTitle")} onClose={() => setExitOpen(false)} onOk={() => { window.location.href = "/disenroll"; }}>
			{t("exitModalBody")}
		</Modal>
	);
}
