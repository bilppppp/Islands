import { useEffect, useRef, useState } from "react";

interface RunResult {
	stdout: string;
	stderr: string;
	ok: boolean;
}

type StatusCallback = (msg: string) => void;

let sharedWorker: Worker | null = null;
let currentTimeout: number | null = null;
let runIdCounter = 0;
let pendingResolve: ((res: RunResult) => void) | null = null;
let pendingStatus: StatusCallback | null = null;

function getWorker(): Worker {
	if (!sharedWorker) {
		const workerUrl = new URL("/pyodide-worker.js", window.location.origin).href;
		sharedWorker = new Worker(workerUrl, { type: "module" });
		sharedWorker.onmessage = (e) => {
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
				resolve?.({ stdout: data.stdout, stderr: data.stderr, ok: data.ok });
			}
		};
		sharedWorker.onerror = (e) => {
			terminateWorker(`Worker 运行错误: ${e.message}`);
		};
	}
	return sharedWorker;
}

export function terminateWorker(reason = "已被另一段代码的运行中断") {
	if (sharedWorker) {
		sharedWorker.terminate();
		sharedWorker = null;
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

export function runPythonCode(
	code: string,
	stdin: string,
	onStatus: StatusCallback,
): Promise<RunResult> {
	return new Promise((resolve) => {
		if (pendingResolve) {
			terminateWorker();
		}
		const worker = getWorker();
		const id = ++runIdCounter;
		pendingResolve = resolve;
		pendingStatus = onStatus;

		const indexURL = new URL("/vendor/pyodide/", window.location.origin).pathname;
		worker.postMessage({ id, type: "run", code, stdin, indexURL });
	});
}

export default function IslandRunBlock({ initialCode }: { initialCode: string }) {
	const [code, setCode] = useState(initialCode);
	const [stdin, setStdin] = useState("");
	const [stdout, setStdout] = useState("");
	const [stderr, setStderr] = useState("");
	const [status, setStatus] = useState("");
	const [running, setRunning] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
			const res = await runPythonCode(code, stdin, (msg) => {
				setStatus(msg);
			});
			setStatus("");
			setStdout(res.stdout);
			setStderr(res.stderr);
		} finally {
			setRunning(false);
		}
	};

	const handleReset = () => {
		setCode(initialCode);
		setStdin("");
		setStdout("");
		setStderr("");
		setStatus("");
	};

	const needsStdin = code.includes("input(");
	const hasOutput = stdout !== "" || stderr !== "" || status !== "" || running;

	return (
		<div className="island-run-card">
			<div className="island-run-header">
				<span className="island-run-badge">Python 运行</span>
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
					aria-label="可编辑 Python 代码"
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
