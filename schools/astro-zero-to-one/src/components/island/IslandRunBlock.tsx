import { useEffect, useRef, useState } from "react";
import IslandAskTeacher, { t } from "./IslandAskTeacher";
import { normalizeRunLang } from "../../lib/run-block.mjs";

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
let sucraseTransform:
	| ((code: string, options: { transforms: string[] }) => { code: string })
	| null = null;

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
			if (!sucraseTransform) {
				const { transform } = await import("sucrase");
				sucraseTransform = transform;
			}
			const res = sucraseTransform(code, { transforms: ["typescript"] });
			codeToRun = res.code;
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
			const indexURL = new URL("/vendor/pyodide/", window.location.origin).pathname;
			worker.postMessage({ id, type: "run", code: codeToRun, stdin, indexURL });
		} else {
			worker.postMessage({ id, type: "run", code: codeToRun });
		}
	});
}

export function runPythonCode(
	code: string,
	stdin: string,
	onStatus: StatusCallback,
): Promise<RunResult> {
	return runCode("python", code, stdin, onStatus);
}

export default function IslandRunBlock({
	initialCode,
	lang = "python",
}: {
	initialCode: string;
	lang?: string;
}) {
	const [code, setCode] = useState(initialCode);
	const [stdin, setStdin] = useState("");
	const [stdout, setStdout] = useState("");
	const [stderr, setStderr] = useState("");
	const [status, setStatus] = useState("");
	const [running, setRunning] = useState(false);
	const [hasRun, setHasRun] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const normalizedLang = normalizeRunLang(lang);
	const langTitle =
		normalizedLang === "python"
			? "Python"
			: normalizedLang === "typescript"
				? "TypeScript"
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const target = e.currentTarget;
			const start = target.selectionStart;
			const end = target.selectionEnd;
			const val = target.value;
			const nextVal = val.substring(0, start) + "    " + val.substring(end);
			setCode(nextVal);
			requestAnimationFrame(() => {
				target.selectionStart = target.selectionEnd = start + 4;
				adjustTextareaHeight();
			});
		}
	};

	const handleRun = async () => {
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

	const needsStdin = normalizedLang === "python" && code.includes("input(");
	const hasOutput = stdout !== "" || stderr !== "" || status !== "" || running;

	return (
		<div className="island-run-card">
			<div className="island-run-header">
				<span className="island-run-badge">{langTitle} 运行</span>
				<div className="island-run-actions">
					<button
						type="button"
						className="island-run-btn island-run-primary"
						disabled={running}
						onClick={handleRun}
					>
						{running ? "运行中…" : "运行"}
					</button>
					<button
						type="button"
						className="island-run-btn island-run-reset"
						disabled={running}
						onClick={handleReset}
					>
						重置
					</button>
					<IslandAskTeacher
						kind="run"
						disabled={!hasRun || running}
						describe={describeRun}
					/>
				</div>
			</div>

			<div className="island-run-editor-wrap">
				<textarea
					ref={textareaRef}
					className="island-run-textarea"
					value={code}
					spellCheck={false}
					autoCapitalize="off"
					autoComplete="off"
					autoCorrect="off"
					onChange={(e) => setCode(e.target.value)}
					onKeyDown={handleKeyDown}
					aria-label={`可编辑 ${langTitle} 代码`}
				/>
			</div>

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
	);
}
