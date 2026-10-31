import { useEffect, useRef, useState } from "react";
import { Collapse } from "animal-island-ui";
import IslandAskTeacher, { t } from "./IslandAskTeacher";
import {
	buildPreviewDocument,
	normalizeRunLang,
} from "../../lib/run-block.mjs";

interface RunResult {
	stdout: string;
	stderr: string;
	ok: boolean;
}

type StatusCallback = (msg: string) => void;

let currentWorker: Worker | null = null;
let currentRuntime: "python" | "javascript" | null = null;
let currentTimeout: number | null = null;
let runIdCounter = 0;
let pendingResolve: ((res: RunResult) => void) | null = null;
let pendingStatus: StatusCallback | null = null;
interface SucraseOptions {
	transforms: string[];
	jsxPragma?: string;
	jsxFragmentPragma?: string;
}

let sucraseTransform:
	| ((code: string, options: SucraseOptions) => { code: string })
	| null = null;

async function transformWithSucrase(
	code: string,
	options: SucraseOptions,
): Promise<string> {
	if (!sucraseTransform) {
		const { transform } = await import("sucrase");
		sucraseTransform = transform;
	}
	return sucraseTransform(code, options).code;
}
let preactUmdSource: string | null = null;
let hooksUmdSource: string | null = null;

async function loadPreactUmdSources(): Promise<{
	preact: string;
	hooks: string;
}> {
	if (!preactUmdSource || !hooksUmdSource) {
		const [preactMod, hooksMod] = await Promise.all([
			import("preact/dist/preact.umd.js?raw"),
			import("preact/hooks/dist/hooks.umd.js?raw"),
		]);
		preactUmdSource = (preactMod as unknown as { default: string }).default;
		hooksUmdSource = (hooksMod as unknown as { default: string }).default;
	}
	return { preact: preactUmdSource, hooks: hooksUmdSource };
}

function getWorker(runtime: "python" | "javascript"): Worker {
	if (currentWorker && currentRuntime === runtime) {
		return currentWorker;
	}
	if (currentWorker) {
		currentWorker.terminate();
		currentWorker = null;
		currentRuntime = null;
	}
	const workerUrl = new URL(
		runtime === "python" ? "/pyodide-worker.js" : "/js-worker.js",
		window.location.origin,
	).href;
	const worker = new Worker(workerUrl, { type: "module" });
	currentWorker = worker;
	currentRuntime = runtime;
	worker.onmessage = (e) => {
		const data = e.data;
		if (data.type === "status") {
			pendingStatus?.(data.text);
		} else if (data.type === "started") {
			if (currentTimeout !== null) {
				window.clearTimeout(currentTimeout);
			}
			currentTimeout = window.setTimeout(() => {
				terminateWorker("运行超时，已停止");
			}, 10000);
		} else if (data.type === "result") {
			if (currentTimeout !== null) {
				window.clearTimeout(currentTimeout);
				currentTimeout = null;
			}
			const resolve = pendingResolve;
			pendingResolve = null;
			pendingStatus = null;
			if (currentRuntime !== "python") {
				currentWorker?.terminate();
				currentWorker = null;
				currentRuntime = null;
			}
			resolve?.({ stdout: data.stdout, stderr: data.stderr, ok: data.ok });
		}
	};
	worker.onerror = (e) => {
		terminateWorker(`Worker 运行错误: ${e.message}`);
	};
	return worker;
}

export function terminateWorker(reason = "已被另一段代码的运行中断") {
	if (currentWorker) {
		currentWorker.terminate();
		currentWorker = null;
		currentRuntime = null;
	}
	if (currentTimeout !== null) {
		window.clearTimeout(currentTimeout);
		currentTimeout = null;
	}
	const resolve = pendingResolve;
	pendingResolve = null;
	pendingStatus = null;
	resolve?.({ stdout: "", stderr: reason, ok: false });
}

export async function runCode(
	lang: string,
	code: string,
	stdin: string,
	onStatus: StatusCallback,
): Promise<RunResult> {
	const normalized = normalizeRunLang(lang);
	let codeToRun = code;

	if (normalized === "typescript") {
		try {
			codeToRun = await transformWithSucrase(code, {
				transforms: ["typescript"],
			});
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			return {
				stdout: "",
				stderr: `语法错误：${msg}`,
				ok: false,
			};
		}
	}

	return new Promise((resolve) => {
		if (pendingResolve) {
			terminateWorker();
		}
		const runtime = normalized === "python" ? "python" : "javascript";
		const worker = getWorker(runtime);
		const id = ++runIdCounter;
		pendingResolve = resolve;
		pendingStatus = onStatus;

		if (runtime === "python") {
			const indexURL = new URL(
				"/vendor/pyodide/",
				window.location.origin,
			).pathname;
			worker.postMessage({ id, type: "run", code: codeToRun, stdin, indexURL });
		} else {
			worker.postMessage({ id, type: "run", code: codeToRun });
		}
	});
}

export default function IslandRunBlock({
	initialCode,
	lang = "python",
	mode = "run",
}: {
	initialCode: string;
	lang?: string;
	mode?: "run" | "preview";
}) {
	const [code, setCode] = useState(initialCode);
	const [stdin, setStdin] = useState("");
	const [stdout, setStdout] = useState("");
	const [stderr, setStderr] = useState("");
	const [status, setStatus] = useState("");
	const [running, setRunning] = useState(false);
	const [hasRun, setHasRun] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	// Preview states
	const [previewDoc, setPreviewDoc] = useState("");
	const [consoleLogs, setConsoleLogs] = useState<
		{ level: string; text: string }[]
	>([]);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [pageText, setPageText] = useState("");
	const previewDebounceTimerRef = useRef<number | null>(null);
	const lastPreviewCodeRef = useRef<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const collapseRef = useRef<HTMLDivElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const isFirstRender = useRef(true);
	const [isVisible, setIsVisible] = useState(false);

	const normalizedLang = normalizeRunLang(lang);
	const langTitle =
		normalizedLang === "python"
			? "Python"
			: normalizedLang === "typescript"
				? "TypeScript"
				: normalizedLang === "html"
					? "HTML"
					: normalizedLang === "jsx"
						? "JSX"
						: normalizedLang === "tsx"
							? "TSX"
							: "JavaScript";

	const adjustTextareaHeight = () => {
		const el = textareaRef.current;
		if (el) {
			el.style.height = "auto";
			el.style.height = `${Math.max(72, el.scrollHeight)}px`;
		}
	};

	useEffect(() => {
		adjustTextareaHeight();
	}, [code]);

	const updatePreview = async (codeToRender: string) => {
		lastPreviewCodeRef.current = codeToRender;
		if (normalizedLang === "html") {
			setPreviewError(null);
			setConsoleLogs([]);
			const doc = buildPreviewDocument({ lang: "html", code: codeToRender });
			setPreviewDoc(doc);
			return;
		}

		if (normalizedLang === "jsx" || normalizedLang === "tsx") {
			let transformedCode = "";
			try {
				const transforms =
					normalizedLang === "tsx"
						? ["jsx", "imports", "typescript"]
						: ["jsx", "imports"];
				transformedCode = await transformWithSucrase(codeToRender, {
					transforms,
					jsxPragma: "h",
					jsxFragmentPragma: "Fragment",
				});
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				setPreviewError(`语法错误：${msg}`);
				return;
			}

			setPreviewError(null);
			setConsoleLogs([]);
			try {
				const runtimeSources = await loadPreactUmdSources();
				const doc = buildPreviewDocument({
					lang: normalizedLang,
					code: transformedCode,
					runtimeSources,
				});
				setPreviewDoc(doc);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				setPreviewError(`加载运行库失败：${msg}`);
			}
		}
	};

	useEffect(() => {
		if (mode !== "preview") return;
		const el = collapseRef.current;
		if (!el) return;

		const checkExpanded = () => {
			const btn = el.querySelector("button[aria-expanded]");
			const expanded = btn ? btn.getAttribute("aria-expanded") === "true" : false;
			setIsExpanded(expanded);
		};

		checkExpanded();

		const observer = new MutationObserver(() => {
			checkExpanded();
		});

		observer.observe(el, {
			attributes: true,
			subtree: true,
			attributeFilter: ["aria-expanded", "class"],
		});

		return () => {
			observer.disconnect();
		};
	}, [mode]);

	useEffect(() => {
		if (isExpanded) {
			adjustTextareaHeight();
		}
	}, [isExpanded]);

	useEffect(() => {
		if (mode !== "preview") return;
		if (!isExpanded) return;
		if (isVisible) return;

		const el = containerRef.current;
		if (!el) return;

		if (typeof IntersectionObserver === "undefined") {
			setIsVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setIsVisible(true);
						observer.disconnect();
						break;
					}
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(el);

		return () => {
			observer.disconnect();
		};
	}, [mode, isExpanded, isVisible]);

	useEffect(() => {
		if (mode !== "preview") return;
		if (!isVisible) return;

		if (isFirstRender.current) {
			isFirstRender.current = false;
			updatePreview(code);
			return;
		}

		if (code === lastPreviewCodeRef.current) {
			return;
		}

		if (previewDebounceTimerRef.current !== null) {
			window.clearTimeout(previewDebounceTimerRef.current);
		}
		previewDebounceTimerRef.current = window.setTimeout(() => {
			previewDebounceTimerRef.current = null;
			updatePreview(code);
		}, 500);

		return () => {
			if (previewDebounceTimerRef.current !== null) {
				window.clearTimeout(previewDebounceTimerRef.current);
				previewDebounceTimerRef.current = null;
			}
		};
	}, [code, mode, isVisible]);

	useEffect(() => {
		if (mode !== "preview") return;

		const handleMessage = (e: MessageEvent) => {
			const iframe = iframeRef.current;
			if (!iframe || !iframe.contentWindow) return;
			if (e.source !== iframe.contentWindow) return;

			const data = e.data;
			if (!data || typeof data !== "object") return;

			if (data.type === "preview-console") {
				setConsoleLogs((prev) => [
					...prev,
					{ level: String(data.level || "log"), text: String(data.text || "") },
				]);
			} else if (data.type === "preview-error") {
				setConsoleLogs((prev) => [
					...prev,
					{ level: "error", text: String(data.text || "") },
				]);
			} else if (data.type === "preview-metrics") {
				if (typeof data.innerText === "string") {
					setPageText(data.innerText);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [mode]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const target = e.currentTarget;
			const start = target.selectionStart;
			const end = target.selectionEnd;
			const val = target.value;
			const nextVal = `${val.substring(0, start)}    ${val.substring(end)}`;
			setCode(nextVal);
			requestAnimationFrame(() => {
				target.selectionStart = target.selectionEnd = start + 4;
				adjustTextareaHeight();
			});
		}
	};

	const handleRun = async () => {
		if (mode === "preview") {
			if (previewDebounceTimerRef.current !== null) {
				window.clearTimeout(previewDebounceTimerRef.current);
				previewDebounceTimerRef.current = null;
			}
			isFirstRender.current = false;
			if (!isVisible) {
				setIsVisible(true);
			}
			await updatePreview(code);
			return;
		}

		setRunning(true);
		setStatus("");
		setStdout("");
		setStderr("");
		try {
			const res = await runCode(lang, code, stdin, (msg) => {
				setStatus(msg);
			});
			setStatus("");
			setStdout(res.stdout);
			setStderr(res.stderr);
		} finally {
			setRunning(false);
			setHasRun(true);
		}
	};

	const handleReset = () => {
		setCode(initialCode);
		setStdin("");
		setStdout("");
		setStderr("");
		setStatus("");
		setHasRun(false);
		if (mode === "preview") {
			if (previewDebounceTimerRef.current !== null) {
				window.clearTimeout(previewDebounceTimerRef.current);
				previewDebounceTimerRef.current = null;
			}
			setConsoleLogs([]);
			setPreviewError(null);
			setPageText("");
			setIsVisible(true);
			updatePreview(initialCode);
		}
	};

	const describeRun = (): string => {
		const lines: string[] = [
			t("askTeacherRunCode"),
			`\`\`\`${lang}`,
			code,
			"```",
			t("askTeacherRunOutput"),
			stdout.trim() ? stdout.trim() : t("askTeacherRunNoOutput"),
		];
		if (stderr.trim()) {
			lines.push(t("askTeacherRunError"), stderr.trim());
		}
		return lines.join("\n");
	};

	const describePreview = (): string => {
		const lines: string[] = [
			t("askTeacherRunCode"),
			`\`\`\`${lang}`,
			code,
			"```",
			t("askTeacherPreviewText"),
			pageText.trim() ? pageText.trim() : t("askTeacherPreviewNoText"),
			t("askTeacherPreviewConsole"),
		];
		const consoleText = consoleLogs.map((l) => l.text).join("\n");
		if (consoleText.trim()) {
			lines.push(consoleText.trim());
		} else {
			lines.push(t("askTeacherRunNoOutput"));
		}
		if (previewError?.trim()) {
			lines.push(t("askTeacherRunError"), previewError.trim());
		}
		return lines.join("\n");
	};

	const renderHeader = ({
		badgeSuffix,
		showRunButton = false,
		teacherKind,
		teacherDescribe,
		teacherDisabled,
	}: {
		badgeSuffix: string;
		showRunButton?: boolean;
		teacherKind: "run" | "preview";
		teacherDescribe: () => string;
		teacherDisabled?: boolean;
	}) => (
		<div className="island-run-header">
			<span className="island-run-badge">
				{langTitle} {badgeSuffix}
			</span>
			<div className="island-run-actions">
				{showRunButton ? (
					<button
						type="button"
						className="island-run-btn island-run-primary"
						disabled={running}
						onClick={handleRun}
					>
						{running ? "运行中…" : "运行"}
					</button>
				) : null}
				<button
					type="button"
					className="island-run-btn island-run-reset"
					disabled={showRunButton ? running : undefined}
					onClick={handleReset}
				>
					重置
				</button>
				<IslandAskTeacher
					kind={teacherKind}
					disabled={teacherDisabled}
					describe={teacherDescribe}
				/>
			</div>
		</div>
	);

	const renderEditor = () => (
		<div className="island-run-editor-wrap">
			<textarea
				ref={textareaRef}
				className="island-run-textarea"
				value={code}
				spellCheck={false}
				autoCapitalize="off"
				autoComplete="off"
				autoCorrect="off"
				wrap={mode === "preview" ? "off" : undefined}
				onChange={(e) => setCode(e.target.value)}
				onFocus={adjustTextareaHeight}
				onKeyDown={handleKeyDown}
				aria-label={`可编辑 ${langTitle} 代码`}
			/>
		</div>
	);

	if (mode === "preview") {
		const placeholder = t("previewScrollToRender");
		const hasConsoleOutput = consoleLogs.length > 0 || Boolean(previewError);

		return (
			<div
				ref={collapseRef}
				className="island-run-collapse-wrap"
			>
				<Collapse
					defaultExpanded={false}
					className="island-run-collapse"
					question={t("collapsePreviewTitle", { lang: langTitle })}
					answer={
						<div ref={containerRef} className="island-run-card island-preview-card">
							{renderHeader({
								badgeSuffix: "预览",
								showRunButton: true,
								teacherKind: "preview",
								teacherDescribe: describePreview,
							})}

							<div className="island-preview-grid">
								<div className="island-preview-editor-col">
									{renderEditor()}
								</div>

								<div className="island-preview-view-col">
									<div className="island-preview-frame-wrap">
										{isVisible ? (
											<iframe
												ref={iframeRef}
												sandbox="allow-scripts"
												srcDoc={previewDoc}
												className="island-preview-iframe"
												title={`${langTitle} 预览页面`}
											/>
										) : (
											<div className="island-preview-placeholder">
												{placeholder}
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="island-preview-console" aria-live="polite">
								{hasConsoleOutput ? (
									<>
										<div className="island-preview-console-header">控制台</div>
										<div className="island-preview-console-body">
											{consoleLogs.map((log, idx) => (
												<div
													key={idx}
													className={`island-preview-log island-preview-log-${log.level}`}
												>
													{log.text}
												</div>
											))}
											{previewError ? (
												<div className="island-preview-log island-preview-log-error">
													{previewError}
												</div>
											) : null}
										</div>
									</>
								) : (
									<div className="island-preview-console-empty">
										控制台（无输出）
									</div>
								)}
							</div>
						</div>
					}
				/>
			</div>
		);
	}

	const needsStdin = normalizedLang === "python" && code.includes("input(");
	const hasOutput = stdout !== "" || stderr !== "" || status !== "" || running;

	return (
		<div className="island-run-collapse-wrap">
			<Collapse
				defaultExpanded={false}
				className="island-run-collapse"
				question={t("collapseRunTitle", { lang: langTitle })}
				answer={
					<div className="island-run-card">
						{renderHeader({
							badgeSuffix: "运行",
							showRunButton: true,
							teacherKind: "run",
							teacherDescribe: describeRun,
							teacherDisabled: !hasRun || running,
						})}

						{renderEditor()}

						{needsStdin ? (
							<div className="island-run-stdin-wrap">
								<label htmlFor="island-run-stdin" className="island-run-label">
									程序输入（每行一项）：
								</label>
								<textarea
									id="island-run-stdin"
									className="island-run-stdin-input"
									value={stdin}
									placeholder="按 input() 调用顺序逐行读取"
									rows={Math.max(2, stdin.split("\n").length)}
									onChange={(e) => setStdin(e.target.value)}
								/>
							</div>
						) : null}

						{hasOutput ? (
							<div className="island-run-output" aria-live="polite">
								{status ? <div className="island-run-status">{status}</div> : null}
								{stdout ? <pre className="island-run-stdout">{stdout}</pre> : null}
								{stderr ? <pre className="island-run-stderr">{stderr}</pre> : null}
								{!status && !stdout && !stderr && !running ? (
									<div className="island-run-empty">（程序无输出）</div>
								) : null}
							</div>
						) : null}
					</div>
				}
			/>
		</div>
	);
}
