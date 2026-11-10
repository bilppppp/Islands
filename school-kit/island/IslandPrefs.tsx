import { useEffect, useRef, useState } from "react";
import { Button, Select } from "animal-island-ui";
import { showAskTeacherNotice, t } from "./IslandAskTeacher";

const depthOptions = [
	{ key: "brief", label: "简短" },
	{ key: "some-context", label: "适中" },
	{ key: "all-details", label: "充分" },
];

export default function IslandPrefs() {
	const [depth, setDepth] = useState("some-context");
	const [studentId, setStudentId] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const userChanged = useRef(false);

	useEffect(() => {
		const id = (window.school as { getStudentId?: () => string | null } | undefined)?.getStudentId?.() ?? null;
		setStudentId(id);
		if (!id) return;
		fetch(`/api/profile/${encodeURIComponent(id)}`)
			.then((response) => (response.ok ? response.json() : null))
			.then((body: { profile?: { depthPreference?: string } } | null) => {
				if (userChanged.current) return;
				const preference = body?.profile?.depthPreference;
				if (preference) setDepth(preference);
			})
			.catch(() => undefined);
	}, []);

	const save = async () => {
		setPending(true);
		try {
			const id = (window.school as { getStudentId?: () => string | null } | undefined)?.getStudentId?.();
			if (!id) {
				showAskTeacherNotice({ type: "info", message: t("prefsNeedIdentity") });
				return;
			}
			const response = await fetch(`/api/profile/${encodeURIComponent(id)}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ depthPreference: depth }),
			});
			if (!response.ok) {
				showAskTeacherNotice({ type: "error", message: t("prefsSaveFailed") });
				return;
			}
			showAskTeacherNotice({ type: "success", message: t("prefsSaved") });
		} catch {
			showAskTeacherNotice({ type: "error", message: t("prefsSaveFailed") });
		} finally {
			setPending(false);
		}
	};

	return (
		<section className="island-prefs">
			<p className="island-prefs-label" id="island-depth-label">
				讲解详略
			</p>
			<div className="island-depth">
				<Select
					aria-labelledby="island-depth-label"
					options={depthOptions}
					value={depth}
					onChange={(next) => {
						userChanged.current = true;
						setDepth(next);
					}}
				/>
			</div>
			<Button type="primary" disabled={!studentId || pending} onClick={save}>
				保存偏好
			</Button>
		</section>
	);
}
