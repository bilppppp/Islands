import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "animal-island-ui";

function t(key: string, values?: Record<string, string | number>): string {
	if (typeof window !== "undefined" && (window as any).schoolUI?.t) {
		return (window as any).schoolUI.t(key, values);
	}
	return key;
}

export default function IslandPromptNotice() {
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const timerRef = useRef<number | null>(null);
	const closeTimerRef = useRef<number | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);

	const closeModal = useCallback(() => {
		if (timerRef.current) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		const prefersReduced =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const finishClose = () => {
			setOpen(false);
			setClosing(false);
			if (triggerRef.current && typeof triggerRef.current.focus === "function") {
				triggerRef.current.focus();
			}
		};

		if (prefersReduced) {
			finishClose();
			return;
		}

		setClosing(true);
		closeTimerRef.current = window.setTimeout(finishClose, 150);
	}, []);

	useEffect(() => {
		const onCopied = (event: Event) => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
			const customEvent = event as CustomEvent<{ trigger?: HTMLElement }>;
			triggerRef.current =
				customEvent.detail?.trigger ||
				(document.activeElement as HTMLElement | null);
			setClosing(false);
			setOpen(true);
		};

		window.addEventListener("school:island-prompt-copied", onCopied);
		return () => {
			window.removeEventListener("school:island-prompt-copied", onCopied);
			if (timerRef.current) window.clearTimeout(timerRef.current);
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
		};
	}, []);

	useEffect(() => {
		if (!open || closing) return;

		timerRef.current = window.setTimeout(() => {
			closeModal();
		}, 1600);

		const onWindowClick = () => {
			closeModal();
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeModal();
			}
		};

		const clickTimer = window.setTimeout(() => {
			window.addEventListener("click", onWindowClick, true);
		}, 50);
		window.addEventListener("keydown", onKeyDown, true);

		return () => {
			window.clearTimeout(clickTimer);
			if (timerRef.current) {
				window.clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			window.removeEventListener("click", onWindowClick, true);
			window.removeEventListener("keydown", onKeyDown, true);
		};
	}, [open, closing, closeModal]);

	const line1 = t("promptCopiedModalLine1");
	const line2Template = t("promptCopiedModalLine2");
	const tool = t("promptCopiedModalTool");
	const parts = line2Template.split("{tool}");

	const prefersReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const maskStyle = prefersReduced
		? undefined
		: {
				opacity: closing ? 0 : 1,
				transition: "opacity 150ms ease",
			};

	return (
		<Modal
			open={open}
			onClose={closeModal}
			footer={null}
			typewriter={false}
			className={closing ? "island-prompt-modal is-closing" : "island-prompt-modal"}
			maskStyle={maskStyle}
		>
			<div
				className="island-prompt-notice-content"
				onClick={closeModal}
				style={{ cursor: "pointer", width: "100%" }}
			>
				<span className="island-copy-line">{line1}</span>
				<span className="island-copy-line">
					{parts.length === 2 ? (
						<>
							{parts[0]}
							<span className="island-copy-mark">{tool}</span>
							{parts[1]}
						</>
					) : (
						line2Template
					)}
				</span>
			</div>
		</Modal>
	);
}
