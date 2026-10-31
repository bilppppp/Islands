import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button, Countdown, Loading, Title } from "animal-island-ui";
import IslandPageIcon from "./IslandPageIcon";
import IslandPredict from "./IslandPredict";
import IslandRunBlock from "./IslandRunBlock";
import IslandNumberline from "./IslandNumberline";
import { useClipboardCopy } from "./IslandAskTeacher";
import { parsePredictBlock, parseNumberlineBlock } from "../../lib/predict-block.mjs";

function IslandShikiBlock({ pre }: { pre: HTMLElement }) {
	const slotRef = useRef<HTMLDivElement | null>(null);
	const { status, copy } = useClipboardCopy();

	useEffect(() => {
		const slot = slotRef.current;
		if (slot && !slot.contains(pre)) {
			slot.appendChild(pre);
		}
	}, [pre]);

	const handleCopy = () => {
		copy(pre.textContent ?? "");
	};

	const labels = {
		idle: { text: "复制", label: "复制代码" },
		copied: { text: "已复制", label: "代码已复制" },
		error: { text: "复制失败", label: "代码复制失败" },
	};
	const current = labels[status];

	return (
		<div className="island-shiki-host">
			<div ref={slotRef} className="island-shiki-slot" />
			<button
				type="button"
				className="island-code-copy-btn"
				aria-label={current.label}
				onClick={handleCopy}
			>
				{current.text}
			</button>
		</div>
	);
}

declare global {
	interface Window {
		__islandCancelDepart?: boolean;
	}
}

function HeadingTitle({ variant, children }: { variant: "tab" | "layer"; children: ReactNode }) {
	return (
		<Title variant={variant} color="brown" size="small">
			{children}
		</Title>
	);
}

function HeadingSlot({ nodes }: { nodes: ChildNode[] }) {
	const slotRef = useRef<HTMLSpanElement | null>(null);

	useEffect(() => {
		const slot = slotRef.current;
		if (!slot) return;
		for (const node of nodes) {
			slot.appendChild(node);
		}
	}, [nodes]);

	return <span className="island-heading-rich" ref={slotRef} />;
}

function contentNodes(heading: HTMLElement): ChildNode[] {
	const anchor = heading.querySelector(":scope > a.heading-anchor");
	if (anchor && heading.childNodes.length === 1) return Array.from(anchor.childNodes);
	return Array.from(heading.childNodes);
}

function mountHeading(heading: HTMLElement, variant: "tab" | "layer", withIcon: boolean) {
	const nodes = contentNodes(heading);
	const host = document.createElement("div");
	if (heading.id) host.id = heading.id;
	host.dataset.heading = heading.tagName.toLowerCase();
	host.dataset.headingText = heading.textContent?.replace(/^#+\s*/, "").trim() ?? "";
	if (withIcon) host.className = "island-heading-mark";
	heading.replaceWith(host);
	createRoot(host).render(
		<>
			{withIcon ? <IslandPageIcon size={22} /> : null}
			<HeadingTitle variant={variant}>
				<HeadingSlot nodes={nodes} />
			</HeadingTitle>
		</>,
	);
}

export default function IslandLessonChrome() {
	const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
	const [tocHost, setTocHost] = useState<HTMLElement | null>(null);
	const [departAt, setDepartAt] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const article = document.querySelector<HTMLElement>('[data-lesson-panel="read"]');
		if (article && article.dataset.islandEnhanced !== "1") {
			article.dataset.islandEnhanced = "1";
			article.querySelectorAll("pre").forEach((pre) => {
				const rawLang = pre.getAttribute("data-language") ?? pre.dataset.language ?? "";
				const lang = rawLang.toLowerCase().trim();
				if (lang === "mermaid") {
					return;
				}
				const code = pre.textContent ?? "";
				if (lang === "predict") {
					const parsed = parsePredictBlock(code);
					if (!("error" in parsed)) {
						const host = document.createElement("div");
						host.className = "island-predict-host";
						pre.replaceWith(host);
						createRoot(host).render(<IslandPredict block={parsed} />);
						return;
					}
				}
				if (lang === "numberline") {
					const parsed = parseNumberlineBlock(code);
					if (!("error" in parsed)) {
						const host = document.createElement("div");
						host.className = "island-numberline-host";
						pre.replaceWith(host);
						createRoot(host).render(<IslandNumberline block={parsed} />);
						return;
					}
				}
				const isRun = pre.getAttribute("data-run") === "true" || pre.dataset.run === "true";
				if (lang === "python" && isRun) {
					const host = document.createElement("div");
					host.className = "island-run-host";
					pre.replaceWith(host);
					createRoot(host).render(<IslandRunBlock initialCode={code} />);
					return;
				}
				const host = document.createElement("div");
				host.className = "island-code-host";
				pre.replaceWith(host);
				createRoot(host).render(<IslandShikiBlock pre={pre} />);
			});
			const found: { id: string; text: string }[] = [];
			let firstH2 = true;
			article.querySelectorAll<HTMLElement>("h2, h3").forEach((heading) => {
				const text = heading.textContent ?? "";
				if (heading.tagName === "H2") {
					found.push({ id: heading.id, text });
					if (firstH2) {
						firstH2 = false;
						mountHeading(heading, "tab", true);
						return;
					}
				}
				mountHeading(heading, "layer", false);
			});
			setHeadings(found.filter((item) => item.id));
		}

		setTocHost(document.getElementById("sidebar-lesson-toc"));

		const onDepart = (event: Event) => {
			const ms = (event as CustomEvent<{ ms?: number }>).detail?.ms ?? 3000;
			setDepartAt(Date.now() + ms);
		};
		const onSaving = () => setSaving(true);
		const onSaved = () => setSaving(false);
		window.addEventListener("school:island-depart", onDepart);
		window.addEventListener("school:island-saving", onSaving);
		window.addEventListener("school:island-saving-done", onSaved);
		return () => {
			window.removeEventListener("school:island-depart", onDepart);
			window.removeEventListener("school:island-saving", onSaving);
			window.removeEventListener("school:island-saving-done", onSaved);
		};
	}, []);

	useEffect(() => {
		if (!tocHost) return;
		tocHost.hidden = headings.length === 0;
	}, [tocHost, headings]);

	return (
		<div className="island-lesson-chrome">
			{tocHost
				? createPortal(
						headings.length > 0 ? (
							<nav className="island-toc" aria-label="本关目录">
								<p className="island-toc-label">本关目录</p>
								<ul>
									{headings.map((heading) => (
										<li key={heading.id}>
											<a href={`#${heading.id}`}>{heading.text}</a>
										</li>
									))}
								</ul>
							</nav>
						) : null,
						tocHost,
					)
				: null}
			{departAt ? (
				<div className="island-depart">
					<Countdown value={departAt} variant="island" size="small" prefix="去下一关" />
					<Button
						type="dashed"
						onClick={() => {
						window.__islandCancelDepart = true;
							setDepartAt(null);
						}}
					>
						留下
					</Button>
				</div>
			) : null}
			<Loading active={saving} tip="正在保存" />
		</div>
	);
}
