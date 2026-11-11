import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Loading, Title } from "animal-island-ui";
import IslandPageIcon from "./IslandPageIcon";
import IslandPredict from "./IslandPredict";
import IslandRunBlock from "./IslandRunBlock";
import IslandNumberline from "./IslandNumberline";
import { useClipboardCopy } from "./IslandAskTeacher";
import { parsePredictBlock, parseNumberlineBlock } from "../../lib/predict-block.mjs";
import { isRunnableLang, isPreviewLang } from "../../lib/run-block.mjs";

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
	const rawLang = pre.getAttribute("data-language") ?? pre.dataset.language ?? "";
	const lang = rawLang.trim();

	return (
		<div className="island-shiki-host">
			<div className="island-shiki-toolbar">
				{lang ? <span className="island-shiki-lang">{lang}</span> : <span />}
				<button
					type="button"
					className="island-code-copy-btn"
					aria-label={current.label}
					onClick={handleCopy}
				>
					{current.text}
				</button>
			</div>
			<div ref={slotRef} className="island-shiki-slot" />
		</div>
	);
}

declare global {
	interface Window {
		__islandCancelDepart?: boolean;
	}
}

function HeadingTitle({ children }: { children: ReactNode }) {
	return (
		<Title variant="layer" color="brown" size="small">
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
	host.dataset.headingVariant = variant;
	host.dataset.headingText = heading.textContent?.replace(/^#+\s*/, "").trim() ?? "";
	if (withIcon) host.className = "island-heading-mark";
	host.setAttribute("role", "heading");
	host.setAttribute("aria-level", heading.tagName.substring(1));
	heading.replaceWith(host);
	createRoot(host).render(
		<>
			{withIcon ? <IslandPageIcon size={22} /> : null}
			{variant === "layer" ? (
				<HeadingTitle>
					<HeadingSlot nodes={nodes} />
				</HeadingTitle>
			) : (
				<span className="island-heading-plain-text">
					<HeadingSlot nodes={nodes} />
				</span>
			)}
		</>,
	);
}

export default function IslandLessonChrome() {
	const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
	const [tocHost, setTocHost] = useState<HTMLElement | null>(null);
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
				const isPreview = pre.getAttribute("data-preview") === "true" || pre.dataset.preview === "true";
				if (isPreview && isPreviewLang(lang)) {
					const host = document.createElement("div");
					host.className = "island-run-host island-preview-host";
					const explicitRuntime = (pre.getAttribute("data-runtime") || undefined) as "react" | "preact" | undefined;
					const demo = pre.getAttribute("data-demo") === "true";
					pre.replaceWith(host);
					createRoot(host).render(<IslandRunBlock initialCode={code} lang={lang} mode="preview" initialRuntime={explicitRuntime} demo={demo} />);
					return;
				}
				const isRun = pre.getAttribute("data-run") === "true" || pre.dataset.run === "true";
				if (isRun && isRunnableLang(lang)) {
					const host = document.createElement("div");
					host.className = "island-run-host";
					pre.replaceWith(host);
					createRoot(host).render(<IslandRunBlock initialCode={code} lang={lang} mode="run" />);
					return;
				}
				const host = document.createElement("div");
				host.className = "island-code-host";
				pre.replaceWith(host);
				createRoot(host).render(<IslandShikiBlock pre={pre} />);
			});

			const headingElements = Array.from(
				article.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
			).filter((h) => !h.closest(".island-predict-host, .island-run-host, .island-numberline-host"));

			const found: { id: string; text: string }[] = [];
			if (headingElements.length > 0) {
				const levels = headingElements.map((h) => parseInt(h.tagName.substring(1), 10));
				const minLevel = Math.min(...levels);
				const primaryLevel = minLevel;
				const secondaryLevel = minLevel + 1;

				let firstPrimary = true;
				headingElements.forEach((heading) => {
					const level = parseInt(heading.tagName.substring(1), 10);
					const text = heading.textContent?.replace(/^#+\s*/, "").trim() ?? "";
					if (level === primaryLevel) {
						found.push({ id: heading.id, text });
						if (firstPrimary) {
							firstPrimary = false;
							mountHeading(heading, "tab", true);
							return;
						}
						mountHeading(heading, "layer", false);
					} else if (level === secondaryLevel) {
						mountHeading(heading, "layer", false);
					} else {
						heading.classList.add("island-prose-subheading");
					}
				});
			}
			setHeadings(found.filter((item) => item.id));
		}

		setTocHost(document.getElementById("sidebar-lesson-toc"));

		const onSaving = () => setSaving(true);
		const onSaved = () => setSaving(false);
		window.addEventListener("school:island-saving", onSaving);
		window.addEventListener("school:island-saving-done", onSaved);
		return () => {
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
			<Loading active={saving} tip="正在保存" />
		</div>
	);
}
