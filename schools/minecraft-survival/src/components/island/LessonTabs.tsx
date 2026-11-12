import { useEffect, useState } from "react";
import { Tabs } from "animal-island-ui";
import { t } from "./IslandAskTeacher";

interface Props {
	readLabel: string;
	teachLabel: string;
	ariaLabel?: string;
}

export default function LessonTabs({ readLabel, teachLabel, ariaLabel }: Props) {
	const [active, setActive] = useState("read");

	useEffect(() => {
		const readTab = document.querySelector<HTMLElement>('[role="tab"][id$="tab-read"]');
		const teachTab = document.querySelector<HTMLElement>('[role="tab"][id$="tab-teach"]');
		const readPanel = document.querySelector<HTMLElement>('[data-lesson-panel="read"]');
		const teachPanel = document.querySelector<HTMLElement>('[data-lesson-panel="teach"]');

		if (readTab && readPanel) {
			const panelId = readTab.getAttribute("aria-controls") || "lesson-panel-read";
			readPanel.setAttribute("role", "tabpanel");
			readPanel.id = panelId;
			readPanel.setAttribute("aria-labelledby", readTab.id);
		}
		if (teachTab && teachPanel) {
			const panelId = teachTab.getAttribute("aria-controls") || "lesson-panel-teach";
			teachPanel.setAttribute("role", "tabpanel");
			teachPanel.id = panelId;
			teachPanel.setAttribute("aria-labelledby", teachTab.id);
		}

		for (const panel of document.querySelectorAll<HTMLElement>("[data-lesson-panel]")) {
			panel.hidden = panel.dataset.lessonPanel !== active;
		}
		window.dispatchEvent(new CustomEvent("school:island-lesson-tab", { detail: { panel: active } }));
	}, [active]);

	return (
		<div className="island-lesson-tabs">
			<Tabs
				activeKey={active}
				onChange={setActive}
				aria-label={ariaLabel || t("thisLesson")}
				items={[
					{ key: "read", label: readLabel, children: null },
					{ key: "teach", label: teachLabel, children: null },
				]}
			/>
		</div>
	);
}
