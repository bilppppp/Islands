import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { NotificationItem } from "animal-island-ui";
import { NotificationView } from "animal-island-ui/es/components/Notification/Notification.js";
import notificationStyles from "animal-island-ui/es/components/Notification/notification.module.less.js";

export type CopyStatus = "idle" | "copied" | "error";

export interface UseClipboardCopyOptions {
	skipCopiedStatus?: boolean;
}

export function useClipboardCopy(
	resetDelay = 2000,
	options?: UseClipboardCopyOptions | boolean,
) {
	const skipCopiedStatus =
		typeof options === "boolean" ? options : Boolean(options?.skipCopiedStatus);
	const [status, setStatus] = useState<CopyStatus>("idle");
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
		};
	}, []);

	const copy = useCallback(
		async (text: string): Promise<boolean> => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
			try {
				await navigator.clipboard.writeText(text);
				if (!skipCopiedStatus) {
					setStatus("copied");
					timerRef.current = window.setTimeout(() => setStatus("idle"), resetDelay);
				}
				return true;
			} catch {
				setStatus("error");
				timerRef.current = window.setTimeout(() => setStatus("idle"), resetDelay);
				return false;
			}
		},
		[resetDelay, skipCopiedStatus],
	);

	return { status, copy };
}

declare global {
	interface Window {
		schoolUI?: {
			locale: string;
			t: (key: string, values?: Record<string, string | number>) => string;
		};
	}
}

export function t(key: string, values?: Record<string, string | number>): string {
	if (typeof window !== "undefined" && window.schoolUI?.t) {
		return window.schoolUI.t(key, values);
	}
	if (!values) return key;
	return key.replace(/\{(\w+)\}/g, (match, name) => {
		return values[name] == null ? match : String(values[name]);
	});
}

function getLessonTitle(): string {
	const card = document.querySelector<HTMLElement>(".agent-prompt-card");
	const title =
		card?.getAttribute("data-lesson-title") ||
		card?.dataset.lessonTitle ||
		document.querySelector("h1")?.textContent?.trim() ||
		"";
	return title.trim();
}

function getPrecedingSection(element: HTMLElement | null): string {
	if (!element) return "";
	const headings = Array.from(
		document.querySelectorAll<HTMLElement>(
			"h2, h3, [data-heading='h2'], [data-heading='h3']",
		),
	);
	let closest: HTMLElement | null = null;
	for (const heading of headings) {
		const pos = element.compareDocumentPosition(heading);
		if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
			closest = heading;
		}
	}
	if (!closest) return "";
	const text =
		closest.dataset.headingText ||
		closest.textContent ||
		"";
	return text.replace(/^#+\s*/, "").trim();
}

function getKindName(kind: string): string {
	switch (kind) {
		case "run":
			return t("askTeacherKindRun");
		case "preview":
			return t("askTeacherKindPreview");
		case "predict":
			return t("askTeacherKindPredict");
		case "numberline":
			return t("askTeacherKindNumberline");
		default:
			return t("askTeacherKindGeneric");
	}
}

function getButtonLabel(kind: string, status: CopyStatus): string {
	if (status === "copied") {
		return t("askTeacherCopied");
	}
	if (status === "error") {
		return t("askTeacherCopyError");
	}
	switch (kind) {
		case "run":
			return t("askTeacherBtnRun");
		case "preview":
			return t("askTeacherBtnPreview");
		case "predict":
			return t("askTeacherBtnPredict");
		case "numberline":
			return t("askTeacherBtnNumberline");
		default:
			return t("askTeacherBtnGeneric");
	}
}

export interface AskTeacherNoticeOptions {
	type?: "success" | "info" | "warning" | "error";
	message: ReactNode;
	description?: ReactNode;
}

let noticeRoot: Root | null = null;
let noticeSeq = 0;

// 库自带的 Notification 挂载代码是按 React 18 写的，在 React 19 下会失败。
export function showAskTeacherNotice({
	type = "success",
	message,
	description,
}: AskTeacherNoticeOptions) {
	if (typeof document === "undefined") return;

	if (!noticeRoot) {
		const container = document.createElement("div");
		container.className = notificationStyles.notificationRoot;
		const bottom = document.createElement("div");
		bottom.className = notificationStyles["position-bottom"];
		container.appendChild(bottom);
		document.body.appendChild(container);
		noticeRoot = createRoot(bottom);
	}

	noticeSeq += 1;
	const currentSeq = noticeSeq;
	const createdAt = Date.now();

	const handleRemove = () => {
		if (noticeSeq === currentSeq && noticeRoot) {
			noticeRoot.render(null);
		}
	};

	const item: NotificationItem = {
		key: "island-ask-teacher",
		type,
		position: "bottom",
		placement: "bottom",
		duration: 4.5,
		createdAt,
		message,
		description,
	};

	noticeRoot.render(
		<NotificationView
			key={currentSeq}
			item={item}
			onRemove={handleRemove}
		/>,
	);
}

export interface IslandAskTeacherProps {
	kind: "run" | "predict" | "numberline" | string;
	describe: () => string;
	disabled?: boolean;
	className?: string;
}

export default function IslandAskTeacher({
	kind,
	describe,
	disabled = false,
	className,
}: IslandAskTeacherProps) {
	const { status, copy } = useClipboardCopy(2000, { skipCopiedStatus: true });
	const btnRef = useRef<HTMLButtonElement | null>(null);

	const handleAsk = async () => {
		const blockEl =
			btnRef.current?.closest(
				".island-predict-host, .island-run-host, .island-numberline-host, .island-predict-card, .island-run-card, .island-numberline-card",
			) || btnRef.current;
		const section = getPrecedingSection(blockEl);
		const lessonTitle = getLessonTitle();
		const kindName = getKindName(kind);
		const header = section
			? t("askTeacherHeaderWithSection", { lessonTitle, section, kindName })
			: t("askTeacherHeaderWithoutSection", { lessonTitle, kindName });
		const body = describe();
		const followup = t("askTeacherFollowup");
		const origin = typeof window !== "undefined" ? window.location.origin : "";
		const pathname = typeof window !== "undefined" ? window.location.pathname : "";
		const url = t("askTeacherUrl", { origin, pathname });

		const fullMessage = [header, body, followup, url].filter(Boolean).join("\n");
		const ok = await copy(fullMessage);
		if (ok) {
			showAskTeacherNotice({
				message: t("askTeacherNoticeMessage"),
				description: t("askTeacherNoticeDescription"),
			});
		}
	};

	return (
		<button
			ref={btnRef}
			type="button"
			className={`island-ask-teacher-btn ${status === "copied" ? "is-copied" : ""} ${status === "error" ? "is-error" : ""} ${className ?? ""}`.trim()}
			disabled={disabled}
			onClick={handleAsk}
		>
			{getButtonLabel(kind, status)}
		</button>
	);
}
